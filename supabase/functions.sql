-- ============================================================================
-- Student Scholarship Monitoring and Academic Compliance System
-- PostgreSQL Functions, Stored Procedures, and Triggers for Supabase
-- ============================================================================

-- 1. Helper function: Get Current Manila Timestamp
CREATE OR REPLACE FUNCTION get_manila_now()
RETURNS TIMESTAMPTZ AS $$
BEGIN
    RETURN TIMEZONE('Asia/Manila', NOW());
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Trigger Function: Pre-submission validation, timezone deadline check, and status locking
CREATE OR REPLACE FUNCTION trg_before_submission_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_deadline TIMESTAMPTZ;
    v_program_id UUID;
    v_scholar_role TEXT;
BEGIN
    -- Verify scholar exists and has role 'scholar'
    SELECT role INTO v_scholar_role FROM profiles WHERE id = NEW.scholar_id;
    IF v_scholar_role IS NULL OR v_scholar_role != 'scholar' THEN
        RAISE EXCEPTION 'Only registered scholars can create submissions.';
    END IF;

    -- Lookup assigned scholarship program deadline
    SELECT sp.id, sp.submission_deadline INTO v_program_id, v_deadline
    FROM scholar_assignments sa
    JOIN scholarship_programs sp ON sp.id = sa.scholarship_program_id
    WHERE sa.scholar_id = NEW.scholar_id AND sa.assignment_status = 'Active'
    LIMIT 1;

    IF v_deadline IS NULL THEN
        RAISE EXCEPTION 'Scholar has no active scholarship program assignment.';
    END IF;

    -- Enforce server-side Manila timestamp for submitted_at
    NEW.submitted_at := get_manila_now();

    -- Determine lateness (exact deadline is on time; strictly after is late)
    IF NEW.submitted_at > v_deadline THEN
        NEW.is_late := TRUE;
    ELSE
        NEW.is_late := FALSE;
    END IF;

    -- Force initial lifecycle statuses regardless of input payload
    NEW.verification_status := 'Pending';
    NEW.compliance_status := 'Not Evaluated';
    NEW.renewal_status := 'Pending';
    NEW.created_at := NEW.submitted_at;
    NEW.updated_at := NEW.submitted_at;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_submission_insert ON semester_submissions;
CREATE TRIGGER trg_submission_insert
BEFORE INSERT ON semester_submissions
FOR EACH ROW
EXECUTE FUNCTION trg_before_submission_insert();

-- 3. Stored Procedure: Resubmit a Returned Submission (Scholar)
CREATE OR REPLACE FUNCTION resubmit_semester_submission(
    p_submission_id UUID,
    p_gwa NUMERIC(3, 2),
    p_enrolled_units INTEGER,
    p_failed_subjects INTEGER,
    p_incomplete_subjects INTEGER,
    p_dropped_subjects INTEGER,
    p_evidence_reference TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_sub RECORD;
    v_caller_id UUID := auth.uid();
BEGIN
    SELECT * INTO v_sub FROM semester_submissions WHERE id = p_submission_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Submission not found.';
    END IF;

    -- Ensure caller owns this submission
    IF v_caller_id IS NOT NULL AND v_sub.scholar_id != v_caller_id THEN
        RAISE EXCEPTION 'Access denied. You can only resubmit your own submissions.';
    END IF;

    -- Ensure it was Returned
    IF v_sub.verification_status != 'Returned' THEN
        RAISE EXCEPTION 'Only submissions with Returned status can be resubmitted.';
    END IF;

    -- Validate inputs
    IF p_gwa < 1.00 OR p_gwa > 5.00 THEN
        RAISE EXCEPTION 'GWA must be between 1.00 and 5.00.';
    END IF;
    IF p_enrolled_units < 0 OR p_failed_subjects < 0 OR p_incomplete_subjects < 0 OR p_dropped_subjects < 0 THEN
        RAISE EXCEPTION 'Subject counts and enrolled units must be non-negative integers.';
    END IF;
    IF p_evidence_reference IS NULL OR trim(p_evidence_reference) = '' THEN
        RAISE EXCEPTION 'Evidence document reference is required.';
    END IF;

    -- Update submission
    UPDATE semester_submissions
    SET gwa = p_gwa,
        enrolled_units = p_enrolled_units,
        failed_subjects = p_failed_subjects,
        incomplete_subjects = p_incomplete_subjects,
        dropped_subjects = p_dropped_subjects,
        evidence_reference = trim(p_evidence_reference),
        verification_status = 'Pending',
        compliance_status = 'Not Evaluated',
        renewal_status = 'Pending',
        updated_at = get_manila_now()
    WHERE id = p_submission_id;

    -- Record in verification history
    INSERT INTO verification_history (submission_id, staff_id, action, reason, created_at)
    VALUES (p_submission_id, v_caller_id, 'Resubmitted', 'Corrected by scholar and resubmitted for verification', get_manila_now());

    -- Audit Log
    INSERT INTO audit_logs (actor_id, action_type, record_table, record_id, details, timestamp)
    VALUES (v_caller_id, 'RESUBMIT', 'semester_submissions', p_submission_id, jsonb_build_object(
        'gwa', p_gwa,
        'units', p_enrolled_units,
        'failed', p_failed_subjects,
        'incomplete', p_incomplete_subjects,
        'dropped', p_dropped_subjects
    ), get_manila_now());

    RETURN jsonb_build_object('success', true, 'message', 'Submission successfully resubmitted and pending verification.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Stored Procedure: Staff Verification
CREATE OR REPLACE FUNCTION verify_submission(
    p_submission_id UUID,
    p_action TEXT, -- 'Verified' or 'Returned'
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_staff_id UUID := auth.uid();
    v_staff_role TEXT;
    v_sub RECORD;
BEGIN
    -- Verify staff authorization
    IF v_staff_id IS NOT NULL THEN
        SELECT role INTO v_staff_role FROM profiles WHERE id = v_staff_id;
        IF v_staff_role != 'staff' THEN
            RAISE EXCEPTION 'Unauthorized: Only scholarship staff can verify submissions.';
        END IF;
    END IF;

    IF p_action NOT IN ('Verified', 'Returned') THEN
        RAISE EXCEPTION 'Action must be either Verified or Returned.';
    END IF;

    IF p_action = 'Returned' AND (p_reason IS NULL OR trim(p_reason) = '') THEN
        RAISE EXCEPTION 'A non-empty reason is strictly required when returning evidence for correction.';
    END IF;

    SELECT * INTO v_sub FROM semester_submissions WHERE id = p_submission_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Submission not found.';
    END IF;

    -- Update submission verification status
    UPDATE semester_submissions
    SET verification_status = p_action,
        updated_at = get_manila_now()
    WHERE id = p_submission_id;

    -- Record history
    INSERT INTO verification_history (submission_id, staff_id, action, reason, created_at)
    VALUES (p_submission_id, v_staff_id, p_action, p_reason, get_manila_now());

    -- Audit Log
    INSERT INTO audit_logs (actor_id, action_type, record_table, record_id, details, timestamp)
    VALUES (v_staff_id, 'VERIFICATION_' || upper(p_action), 'semester_submissions', p_submission_id, jsonb_build_object(
        'action', p_action,
        'reason', p_reason
    ), get_manila_now());

    RETURN jsonb_build_object('success', true, 'status', p_action);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Stored Procedure: Compliance Evaluation Engine
CREATE OR REPLACE FUNCTION evaluate_submission_compliance(
    p_submission_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_staff_id UUID := auth.uid();
    v_staff_role TEXT;
    v_sub RECORD;
    v_prog RECORD;
    v_gwa_pass BOOLEAN;
    v_units_pass BOOLEAN;
    v_failed_pass BOOLEAN;
    v_inc_pass BOOLEAN;
    v_drop_pass BOOLEAN;
    v_evidence_pass BOOLEAN;
    v_deadline_pass BOOLEAN;
    v_overall_result TEXT;
    v_reasons TEXT[] := ARRAY[]::TEXT[];
    v_checks JSONB;
    v_snapshot JSONB;
BEGIN
    -- Verify staff authorization
    IF v_staff_id IS NOT NULL THEN
        SELECT role INTO v_staff_role FROM profiles WHERE id = v_staff_id;
        IF v_staff_role != 'staff' THEN
            RAISE EXCEPTION 'Unauthorized: Only scholarship staff can evaluate compliance.';
        END IF;
    END IF;

    -- Fetch submission
    SELECT * INTO v_sub FROM semester_submissions WHERE id = p_submission_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Submission not found.';
    END IF;

    -- Strict gate: Evidence status MUST be Verified
    IF v_sub.verification_status != 'Verified' THEN
        RAISE EXCEPTION 'Evaluation blocked: Submission evidence status is %, not Verified. Final evaluation cannot proceed until evidence is verified.', v_sub.verification_status;
    END IF;

    -- Fetch assigned program policy
    SELECT sp.* INTO v_prog
    FROM scholar_assignments sa
    JOIN scholarship_programs sp ON sp.id = sa.scholarship_program_id
    WHERE sa.scholar_id = v_sub.scholar_id AND sa.assignment_status = 'Active'
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Scholarship program policy thresholds not found for scholar.';
    END IF;

    -- Check 1: GWA <= max_gwa
    IF v_sub.gwa <= v_prog.max_gwa THEN
        v_gwa_pass := TRUE;
    ELSE
        v_gwa_pass := FALSE;
        v_reasons := array_append(v_reasons, format('GWA (%s) exceeds the maximum permitted %s for %s.', v_sub.gwa, v_prog.max_gwa, v_prog.program_name));
    END IF;

    -- Check 2: Enrolled units >= min_enrolled_units
    IF v_sub.enrolled_units >= v_prog.min_enrolled_units THEN
        v_units_pass := TRUE;
    ELSE
        v_units_pass := FALSE;
        v_reasons := array_append(v_reasons, format('Enrolled units (%s) are below the required %s units.', v_sub.enrolled_units, v_prog.min_enrolled_units));
    END IF;

    -- Check 3: Failed subjects <= max_failed_subjects
    IF v_sub.failed_subjects <= v_prog.max_failed_subjects THEN
        v_failed_pass := TRUE;
    ELSE
        v_failed_pass := FALSE;
        v_reasons := array_append(v_reasons, format('One or more failed subjects (%s) are not permitted (maximum %s).', v_sub.failed_subjects, v_prog.max_failed_subjects));
    END IF;

    -- Check 4: Incomplete subjects <= max_incomplete_subjects
    IF v_sub.incomplete_subjects <= v_prog.max_incomplete_subjects THEN
        v_inc_pass := TRUE;
    ELSE
        v_inc_pass := FALSE;
        v_reasons := array_append(v_reasons, format('Incomplete grades (%s) exceed the permitted limit (maximum %s).', v_sub.incomplete_subjects, v_prog.max_incomplete_subjects));
    END IF;

    -- Check 5: Dropped subjects <= max_dropped_subjects
    IF v_sub.dropped_subjects <= v_prog.max_dropped_subjects THEN
        v_drop_pass := TRUE;
    ELSE
        v_drop_pass := FALSE;
        v_reasons := array_append(v_reasons, format('Dropped subjects (%s) exceed the permitted limit (maximum %s).', v_sub.dropped_subjects, v_prog.max_dropped_subjects));
    END IF;

    -- Check 6: Required evidence verified
    v_evidence_pass := (v_sub.verification_status = 'Verified' AND v_sub.evidence_reference IS NOT NULL AND trim(v_sub.evidence_reference) != '');
    IF NOT v_evidence_pass THEN
        v_reasons := array_append(v_reasons, 'Required grade-document reference evidence is missing or unverified.');
    END IF;

    -- Check 7: Submitted on or before deadline
    IF v_sub.is_late THEN
        v_deadline_pass := FALSE;
        v_reasons := array_append(v_reasons, 'Submission was received after the deadline.');
    ELSE
        v_deadline_pass := TRUE;
    END IF;

    -- Determine overall result
    IF v_gwa_pass AND v_units_pass AND v_failed_pass AND v_inc_pass AND v_drop_pass AND v_evidence_pass AND v_deadline_pass THEN
        v_overall_result := 'Compliant';
    ELSE
        v_overall_result := 'With Deficiency';
    END IF;

    v_checks := jsonb_build_object(
        'gwa_check', jsonb_build_object('pass', v_gwa_pass, 'value', v_sub.gwa, 'threshold', v_prog.max_gwa),
        'units_check', jsonb_build_object('pass', v_units_pass, 'value', v_sub.enrolled_units, 'threshold', v_prog.min_enrolled_units),
        'failed_check', jsonb_build_object('pass', v_failed_pass, 'value', v_sub.failed_subjects, 'threshold', v_prog.max_failed_subjects),
        'incomplete_check', jsonb_build_object('pass', v_inc_pass, 'value', v_sub.incomplete_subjects, 'threshold', v_prog.max_incomplete_subjects),
        'dropped_check', jsonb_build_object('pass', v_drop_pass, 'value', v_sub.dropped_subjects, 'threshold', v_prog.max_dropped_subjects),
        'evidence_check', jsonb_build_object('pass', v_evidence_pass, 'status', v_sub.verification_status),
        'deadline_check', jsonb_build_object('pass', v_deadline_pass, 'is_late', v_sub.is_late)
    );

    v_snapshot := jsonb_build_object(
        'program_name', v_prog.program_name,
        'max_gwa', v_prog.max_gwa,
        'min_enrolled_units', v_prog.min_enrolled_units,
        'max_failed_subjects', v_prog.max_failed_subjects,
        'max_incomplete_subjects', v_prog.max_incomplete_subjects,
        'max_dropped_subjects', v_prog.max_dropped_subjects,
        'submission_deadline', v_prog.submission_deadline
    );

    -- Insert compliance evaluation record
    INSERT INTO compliance_evaluations (
        submission_id, program_id, overall_result, policy_snapshot, check_results, deficiency_reasons, evaluator_id, evaluated_at
    ) VALUES (
        p_submission_id, v_prog.id, v_overall_result, v_snapshot, v_checks, v_reasons, v_staff_id, get_manila_now()
    );

    -- Update submission compliance status
    UPDATE semester_submissions
    SET compliance_status = v_overall_result,
        updated_at = get_manila_now()
    WHERE id = p_submission_id;

    -- Audit Log
    INSERT INTO audit_logs (actor_id, action_type, record_table, record_id, details, timestamp)
    VALUES (v_staff_id, 'COMPLIANCE_EVALUATION', 'semester_submissions', p_submission_id, jsonb_build_object(
        'result', v_overall_result,
        'deficiency_reasons', v_reasons
    ), get_manila_now());

    RETURN jsonb_build_object(
        'success', true,
        'overall_result', v_overall_result,
        'checks', v_checks,
        'deficiency_reasons', v_reasons
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Stored Procedure: Renewal Decision Workflow
CREATE OR REPLACE FUNCTION record_renewal_decision(
    p_submission_id UUID,
    p_decision TEXT, -- 'Approved' or 'Held'
    p_notes TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_staff_id UUID := auth.uid();
    v_staff_role TEXT;
    v_sub RECORD;
BEGIN
    -- Verify staff authorization
    IF v_staff_id IS NOT NULL THEN
        SELECT role INTO v_staff_role FROM profiles WHERE id = v_staff_id;
        IF v_staff_role != 'staff' THEN
            RAISE EXCEPTION 'Unauthorized: Only scholarship staff can record renewal decisions.';
        END IF;
    END IF;

    IF p_decision NOT IN ('Approved', 'Held') THEN
        RAISE EXCEPTION 'Renewal decision must be either Approved or Held.';
    END IF;

    SELECT * INTO v_sub FROM semester_submissions WHERE id = p_submission_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Submission not found.';
    END IF;

    -- Strict Rule Checks for Approval
    IF p_decision = 'Approved' THEN
        IF v_sub.verification_status != 'Verified' THEN
            RAISE EXCEPTION 'Approval blocked: Submission evidence is %, but must be Verified.', v_sub.verification_status;
        END IF;
        IF v_sub.compliance_status != 'Compliant' THEN
            RAISE EXCEPTION 'Approval blocked: Compliance status is %, but must be Compliant. Submissions with deficiencies cannot be approved.', v_sub.compliance_status;
        END IF;
    END IF;

    -- Held decision requires notes
    IF p_decision = 'Held' AND (p_notes IS NULL OR trim(p_notes) = '') THEN
        RAISE EXCEPTION 'A Held decision requires explanatory staff notes.';
    END IF;

    -- Insert into renewal_decisions
    INSERT INTO renewal_decisions (submission_id, decision, notes, staff_id, decided_at)
    VALUES (p_submission_id, p_decision, trim(p_notes), v_staff_id, get_manila_now());

    -- Update submission renewal status
    UPDATE semester_submissions
    SET renewal_status = p_decision,
        updated_at = get_manila_now()
    WHERE id = p_submission_id;

    -- Audit Log
    INSERT INTO audit_logs (actor_id, action_type, record_table, record_id, details, timestamp)
    VALUES (v_staff_id, 'RENEWAL_' || upper(p_decision), 'semester_submissions', p_submission_id, jsonb_build_object(
        'decision', p_decision,
        'notes', p_notes
    ), get_manila_now());

    RETURN jsonb_build_object('success', true, 'decision', p_decision);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger Function: Automatically create profile on Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, student_id, email, role, created_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'student_id',
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'scholar'),
        TIMEZONE('Asia/Manila', NOW())
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
