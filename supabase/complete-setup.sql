-- ============================================================================
-- STUDENT SCHOLARSHIP MONITORING AND ACADEMIC COMPLIANCE SYSTEM (SSMAS)
-- COMPLETE ONE-CLICK DATABASE SETUP SCRIPT FOR SUPABASE
-- Run this entire file in Supabase SQL Editor in ONE single run.
-- ============================================================================

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- SECTION 1: DATABASE SCHEMA & TABLES
-- ============================================================================

-- Drop existing tables in correct foreign key order
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS renewal_decisions CASCADE;
DROP TABLE IF EXISTS compliance_evaluations CASCADE;
DROP TABLE IF EXISTS verification_history CASCADE;
DROP TABLE IF EXISTS semester_submissions CASCADE;
DROP TABLE IF EXISTS scholar_assignments CASCADE;
DROP TABLE IF EXISTS scholarship_programs CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 1. USER PROFILES
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    student_id TEXT UNIQUE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('scholar', 'staff')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Manila', NOW())
);

-- 2. SCHOLARSHIP PROGRAMS & POLICY THRESHOLDS
CREATE TABLE scholarship_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_name TEXT NOT NULL UNIQUE,
    max_gwa NUMERIC(3, 2) NOT NULL CHECK (max_gwa >= 1.00 AND max_gwa <= 5.00),
    min_enrolled_units INTEGER NOT NULL CHECK (min_enrolled_units >= 0),
    max_failed_subjects INTEGER NOT NULL CHECK (max_failed_subjects >= 0),
    max_incomplete_subjects INTEGER NOT NULL CHECK (max_incomplete_subjects >= 0),
    max_dropped_subjects INTEGER NOT NULL CHECK (max_dropped_subjects >= 0),
    evidence_required TEXT NOT NULL DEFAULT 'Grade-document reference',
    submission_deadline TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Manila', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Manila', NOW())
);

-- 3. SCHOLAR ASSIGNMENTS
CREATE TABLE scholar_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scholar_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    scholarship_program_id UUID NOT NULL REFERENCES scholarship_programs(id) ON DELETE RESTRICT,
    assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Manila', NOW()),
    assignment_status TEXT NOT NULL DEFAULT 'Active' CHECK (assignment_status IN ('Active', 'Inactive', 'Suspended')),
    CONSTRAINT uq_scholar_program UNIQUE (scholar_id, scholarship_program_id)
);

-- 4. SEMESTER SUBMISSIONS
CREATE TABLE semester_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scholar_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    semester TEXT NOT NULL CHECK (semester IN ('Semester 1', 'Semester 2', 'Summer')),
    gwa NUMERIC(3, 2) NOT NULL CHECK (gwa >= 1.00 AND gwa <= 5.00),
    enrolled_units INTEGER NOT NULL CHECK (enrolled_units >= 0),
    failed_subjects INTEGER NOT NULL CHECK (failed_subjects >= 0),
    incomplete_subjects INTEGER NOT NULL CHECK (incomplete_subjects >= 0),
    dropped_subjects INTEGER NOT NULL CHECK (dropped_subjects >= 0),
    evidence_reference TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Manila', NOW()),
    is_late BOOLEAN NOT NULL DEFAULT FALSE,
    verification_status TEXT NOT NULL DEFAULT 'Pending' CHECK (verification_status IN ('Pending', 'Verified', 'Returned')),
    compliance_status TEXT NOT NULL DEFAULT 'Not Evaluated' CHECK (compliance_status IN ('Not Evaluated', 'Compliant', 'With Deficiency')),
    renewal_status TEXT NOT NULL DEFAULT 'Pending' CHECK (renewal_status IN ('Pending', 'Approved', 'Held')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Manila', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Manila', NOW()),
    CONSTRAINT uq_scholar_semester UNIQUE (scholar_id, academic_year, semester)
);

-- 5. VERIFICATION HISTORY
CREATE TABLE verification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES semester_submissions(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('Verified', 'Returned', 'Resubmitted')),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Manila', NOW())
);

-- 6. COMPLIANCE EVALUATIONS
CREATE TABLE compliance_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES semester_submissions(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES scholarship_programs(id) ON DELETE RESTRICT,
    overall_result TEXT NOT NULL CHECK (overall_result IN ('Compliant', 'With Deficiency')),
    policy_snapshot JSONB NOT NULL,
    check_results JSONB NOT NULL,
    deficiency_reasons TEXT[] NOT NULL DEFAULT '{}',
    evaluator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Manila', NOW())
);

-- 7. RENEWAL DECISIONS
CREATE TABLE renewal_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES semester_submissions(id) ON DELETE CASCADE,
    decision TEXT NOT NULL CHECK (decision IN ('Approved', 'Held')),
    notes TEXT,
    staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Manila', NOW())
);

-- 8. AUDIT LOGS
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    record_table TEXT NOT NULL,
    record_id UUID,
    details JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Manila', NOW())
);

-- PERFORMANCE INDEXES
CREATE INDEX idx_profiles_student_id ON profiles(student_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_assignments_scholar ON scholar_assignments(scholar_id);
CREATE INDEX idx_assignments_program ON scholar_assignments(scholarship_program_id);
CREATE INDEX idx_submissions_scholar ON semester_submissions(scholar_id);
CREATE INDEX idx_submissions_ay_sem ON semester_submissions(academic_year, semester);
CREATE INDEX idx_submissions_vcr ON semester_submissions(verification_status, compliance_status, renewal_status);
CREATE INDEX idx_verification_submission ON verification_history(submission_id);
CREATE INDEX idx_evaluations_submission ON compliance_evaluations(submission_id);
CREATE INDEX idx_renewal_submission ON renewal_decisions(submission_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);


-- ============================================================================
-- SECTION 2: FUNCTIONS, PROCEDURES & TRIGGERS
-- ============================================================================

-- 1. Helper: Get Current Manila Timestamp
CREATE OR REPLACE FUNCTION get_manila_now()
RETURNS TIMESTAMPTZ AS $$
BEGIN
    RETURN TIMEZONE('Asia/Manila', NOW());
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Trigger Function: Pre-submission validation & Manila deadline comparison
CREATE OR REPLACE FUNCTION trg_before_submission_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_deadline TIMESTAMPTZ;
    v_program_id UUID;
    v_scholar_role TEXT;
BEGIN
    SELECT role INTO v_scholar_role FROM profiles WHERE id = NEW.scholar_id;
    IF v_scholar_role IS NULL OR v_scholar_role != 'scholar' THEN
        RAISE EXCEPTION 'Only registered scholars can create submissions.';
    END IF;

    SELECT sp.id, sp.submission_deadline INTO v_program_id, v_deadline
    FROM scholar_assignments sa
    JOIN scholarship_programs sp ON sp.id = sa.scholarship_program_id
    WHERE sa.scholar_id = NEW.scholar_id AND sa.assignment_status = 'Active'
    LIMIT 1;

    IF v_deadline IS NULL THEN
        RAISE EXCEPTION 'Scholar has no active scholarship program assignment.';
    END IF;

    NEW.submitted_at := get_manila_now();

    IF NEW.submitted_at > v_deadline THEN
        NEW.is_late := TRUE;
    ELSE
        NEW.is_late := FALSE;
    END IF;

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

-- 3. Stored Procedure: Resubmit Returned Submission (Scholar)
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

    IF v_caller_id IS NOT NULL AND v_sub.scholar_id != v_caller_id THEN
        RAISE EXCEPTION 'Access denied. You can only resubmit your own submissions.';
    END IF;

    IF v_sub.verification_status != 'Returned' THEN
        RAISE EXCEPTION 'Only submissions with Returned status can be resubmitted.';
    END IF;

    IF p_gwa < 1.00 OR p_gwa > 5.00 THEN
        RAISE EXCEPTION 'GWA must be between 1.00 and 5.00.';
    END IF;
    IF p_enrolled_units < 0 OR p_failed_subjects < 0 OR p_incomplete_subjects < 0 OR p_dropped_subjects < 0 THEN
        RAISE EXCEPTION 'Subject counts and enrolled units must be non-negative integers.';
    END IF;
    IF p_evidence_reference IS NULL OR trim(p_evidence_reference) = '' THEN
        RAISE EXCEPTION 'Evidence document reference is required.';
    END IF;

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

    INSERT INTO verification_history (submission_id, staff_id, action, reason, created_at)
    VALUES (p_submission_id, v_caller_id, 'Resubmitted', 'Corrected by scholar and resubmitted for verification', get_manila_now());

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
    p_action TEXT,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_staff_id UUID := auth.uid();
    v_staff_role TEXT;
    v_sub RECORD;
BEGIN
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

    UPDATE semester_submissions
    SET verification_status = p_action,
        updated_at = get_manila_now()
    WHERE id = p_submission_id;

    INSERT INTO verification_history (submission_id, staff_id, action, reason, created_at)
    VALUES (p_submission_id, v_staff_id, p_action, p_reason, get_manila_now());

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
    IF v_staff_id IS NOT NULL THEN
        SELECT role INTO v_staff_role FROM profiles WHERE id = v_staff_id;
        IF v_staff_role != 'staff' THEN
            RAISE EXCEPTION 'Unauthorized: Only scholarship staff can evaluate compliance.';
        END IF;
    END IF;

    SELECT * INTO v_sub FROM semester_submissions WHERE id = p_submission_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Submission not found.';
    END IF;

    IF v_sub.verification_status != 'Verified' THEN
        RAISE EXCEPTION 'Evaluation blocked: Submission evidence status is %, not Verified. Final evaluation cannot proceed until evidence is verified.', v_sub.verification_status;
    END IF;

    SELECT sp.* INTO v_prog
    FROM scholar_assignments sa
    JOIN scholarship_programs sp ON sp.id = sa.scholarship_program_id
    WHERE sa.scholar_id = v_sub.scholar_id AND sa.assignment_status = 'Active'
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Scholarship program policy thresholds not found for scholar.';
    END IF;

    -- Check 1: GWA
    IF v_sub.gwa <= v_prog.max_gwa THEN
        v_gwa_pass := TRUE;
    ELSE
        v_gwa_pass := FALSE;
        v_reasons := array_append(v_reasons, format('GWA (%s) exceeds the maximum permitted %s for %s.', v_sub.gwa, v_prog.max_gwa, v_prog.program_name));
    END IF;

    -- Check 2: Units
    IF v_sub.enrolled_units >= v_prog.min_enrolled_units THEN
        v_units_pass := TRUE;
    ELSE
        v_units_pass := FALSE;
        v_reasons := array_append(v_reasons, format('Enrolled units (%s) are below the required %s units.', v_sub.enrolled_units, v_prog.min_enrolled_units));
    END IF;

    -- Check 3: Failed
    IF v_sub.failed_subjects <= v_prog.max_failed_subjects THEN
        v_failed_pass := TRUE;
    ELSE
        v_failed_pass := FALSE;
        v_reasons := array_append(v_reasons, format('One or more failed subjects (%s) are not permitted (maximum %s).', v_sub.failed_subjects, v_prog.max_failed_subjects));
    END IF;

    -- Check 4: Incomplete
    IF v_sub.incomplete_subjects <= v_prog.max_incomplete_subjects THEN
        v_inc_pass := TRUE;
    ELSE
        v_inc_pass := FALSE;
        v_reasons := array_append(v_reasons, format('Incomplete grades (%s) exceed the permitted limit (maximum %s).', v_sub.incomplete_subjects, v_prog.max_incomplete_subjects));
    END IF;

    -- Check 5: Dropped
    IF v_sub.dropped_subjects <= v_prog.max_dropped_subjects THEN
        v_drop_pass := TRUE;
    ELSE
        v_drop_pass := FALSE;
        v_reasons := array_append(v_reasons, format('Dropped subjects (%s) exceed the permitted limit (maximum %s).', v_sub.dropped_subjects, v_prog.max_dropped_subjects));
    END IF;

    -- Check 6: Evidence Verified
    v_evidence_pass := (v_sub.verification_status = 'Verified' AND v_sub.evidence_reference IS NOT NULL AND trim(v_sub.evidence_reference) != '');
    IF NOT v_evidence_pass THEN
        v_reasons := array_append(v_reasons, 'Required grade-document reference evidence is missing or unverified.');
    END IF;

    -- Check 7: Deadline
    IF v_sub.is_late THEN
        v_deadline_pass := FALSE;
        v_reasons := array_append(v_reasons, 'Submission was received after the deadline.');
    ELSE
        v_deadline_pass := TRUE;
    END IF;

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

    INSERT INTO compliance_evaluations (
        submission_id, program_id, overall_result, policy_snapshot, check_results, deficiency_reasons, evaluator_id, evaluated_at
    ) VALUES (
        p_submission_id, v_prog.id, v_overall_result, v_snapshot, v_checks, v_reasons, v_staff_id, get_manila_now()
    );

    UPDATE semester_submissions
    SET compliance_status = v_overall_result,
        updated_at = get_manila_now()
    WHERE id = p_submission_id;

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

-- 6. Stored Procedure: Renewal Decision
CREATE OR REPLACE FUNCTION record_renewal_decision(
    p_submission_id UUID,
    p_decision TEXT,
    p_notes TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_staff_id UUID := auth.uid();
    v_staff_role TEXT;
    v_sub RECORD;
BEGIN
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

    IF p_decision = 'Approved' THEN
        IF v_sub.verification_status != 'Verified' THEN
            RAISE EXCEPTION 'Approval blocked: Submission evidence is %, but must be Verified.', v_sub.verification_status;
        END IF;
        IF v_sub.compliance_status != 'Compliant' THEN
            RAISE EXCEPTION 'Approval blocked: Compliance status is %, but must be Compliant. Submissions with deficiencies cannot be approved.', v_sub.compliance_status;
        END IF;
    END IF;

    IF p_decision = 'Held' AND (p_notes IS NULL OR trim(p_notes) = '') THEN
        RAISE EXCEPTION 'A Held decision requires explanatory staff notes.';
    END IF;

    INSERT INTO renewal_decisions (submission_id, decision, notes, staff_id, decided_at)
    VALUES (p_submission_id, p_decision, trim(p_notes), v_staff_id, get_manila_now());

    UPDATE semester_submissions
    SET renewal_status = p_decision,
        updated_at = get_manila_now()
    WHERE id = p_submission_id;

    INSERT INTO audit_logs (actor_id, action_type, record_table, record_id, details, timestamp)
    VALUES (v_staff_id, 'RENEWAL_' || upper(p_decision), 'semester_submissions', p_submission_id, jsonb_build_object(
        'decision', p_decision,
        'notes', p_notes
    ), get_manila_now());

    RETURN jsonb_build_object('success', true, 'decision', p_decision);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- SECTION 3: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarship_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholar_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE semester_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE renewal_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'staff'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_owner(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (auth.uid() = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Profiles Policies
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
CREATE POLICY "profiles_select_policy" ON profiles FOR SELECT TO authenticated USING (is_owner(id) OR is_staff());

DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
CREATE POLICY "profiles_update_policy" ON profiles FOR UPDATE TO authenticated USING (is_owner(id) OR is_staff())
WITH CHECK ((role = (SELECT role FROM profiles WHERE id = auth.uid())) OR is_staff());

DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
CREATE POLICY "profiles_insert_policy" ON profiles FOR INSERT TO authenticated WITH CHECK (is_owner(id) OR is_staff());

-- Scholarship Programs Policies
DROP POLICY IF EXISTS "programs_select_policy" ON scholarship_programs;
CREATE POLICY "programs_select_policy" ON scholarship_programs FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "programs_admin_modify" ON scholarship_programs;
CREATE POLICY "programs_admin_modify" ON scholarship_programs FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

-- Scholar Assignments Policies
DROP POLICY IF EXISTS "assignments_select_policy" ON scholar_assignments;
CREATE POLICY "assignments_select_policy" ON scholar_assignments FOR SELECT TO authenticated USING (is_owner(scholar_id) OR is_staff());

DROP POLICY IF EXISTS "assignments_staff_manage" ON scholar_assignments;
CREATE POLICY "assignments_staff_manage" ON scholar_assignments FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

-- Semester Submissions Policies
DROP POLICY IF EXISTS "submissions_select_policy" ON semester_submissions;
CREATE POLICY "submissions_select_policy" ON semester_submissions FOR SELECT TO authenticated USING (is_owner(scholar_id) OR is_staff());

DROP POLICY IF EXISTS "submissions_insert_policy" ON semester_submissions;
CREATE POLICY "submissions_insert_policy" ON semester_submissions FOR INSERT TO authenticated WITH CHECK (
    is_owner(scholar_id) AND verification_status = 'Pending' AND compliance_status = 'Not Evaluated' AND renewal_status = 'Pending'
);

DROP POLICY IF EXISTS "submissions_update_policy" ON semester_submissions;
CREATE POLICY "submissions_update_policy" ON semester_submissions FOR UPDATE TO authenticated USING (is_owner(scholar_id) OR is_staff())
WITH CHECK (is_staff() OR (is_owner(scholar_id) AND verification_status = 'Returned'));

-- Verification History Policies
DROP POLICY IF EXISTS "verification_select_policy" ON verification_history;
CREATE POLICY "verification_select_policy" ON verification_history FOR SELECT TO authenticated USING (
    is_staff() OR EXISTS (SELECT 1 FROM semester_submissions sub WHERE sub.id = verification_history.submission_id AND sub.scholar_id = auth.uid())
);

DROP POLICY IF EXISTS "verification_insert_policy" ON verification_history;
CREATE POLICY "verification_insert_policy" ON verification_history FOR INSERT TO authenticated WITH CHECK (is_staff() OR action = 'Resubmitted');

-- Compliance Evaluations Policies
DROP POLICY IF EXISTS "evaluations_select_policy" ON compliance_evaluations;
CREATE POLICY "evaluations_select_policy" ON compliance_evaluations FOR SELECT TO authenticated USING (
    is_staff() OR EXISTS (SELECT 1 FROM semester_submissions sub WHERE sub.id = compliance_evaluations.submission_id AND sub.scholar_id = auth.uid())
);

DROP POLICY IF EXISTS "evaluations_staff_insert" ON compliance_evaluations;
CREATE POLICY "evaluations_staff_insert" ON compliance_evaluations FOR INSERT TO authenticated WITH CHECK (is_staff());

-- Renewal Decisions Policies
DROP POLICY IF EXISTS "renewal_select_policy" ON renewal_decisions;
CREATE POLICY "renewal_select_policy" ON renewal_decisions FOR SELECT TO authenticated USING (
    is_staff() OR EXISTS (SELECT 1 FROM semester_submissions sub WHERE sub.id = renewal_decisions.submission_id AND sub.scholar_id = auth.uid())
);

DROP POLICY IF EXISTS "renewal_staff_insert" ON renewal_decisions;
CREATE POLICY "renewal_staff_insert" ON renewal_decisions FOR INSERT TO authenticated WITH CHECK (
    is_staff() AND (
        decision != 'Approved' OR EXISTS (
            SELECT 1 FROM semester_submissions sub
            WHERE sub.id = renewal_decisions.submission_id AND sub.verification_status = 'Verified' AND sub.compliance_status = 'Compliant'
        )
    )
);

-- Audit Logs Policies
DROP POLICY IF EXISTS "audit_select_policy" ON audit_logs;
CREATE POLICY "audit_select_policy" ON audit_logs FOR SELECT TO authenticated USING (is_staff());

DROP POLICY IF EXISTS "audit_insert_policy" ON audit_logs;
CREATE POLICY "audit_insert_policy" ON audit_logs FOR INSERT TO authenticated WITH CHECK (TRUE);


-- ============================================================================
-- SECTION 4: SEED DATA & SYNTHETIC TEST SCENARIOS (A01 - A06)
-- ============================================================================

DELETE FROM audit_logs;
DELETE FROM renewal_decisions;
DELETE FROM compliance_evaluations;
DELETE FROM verification_history;
DELETE FROM semester_submissions;
DELETE FROM scholar_assignments;
DELETE FROM scholarship_programs;
DELETE FROM profiles;

-- 1. Seed Scholarship Programs
INSERT INTO scholarship_programs (
    id, program_name, max_gwa, min_enrolled_units, max_failed_subjects, max_incomplete_subjects, max_dropped_subjects, evidence_required, submission_deadline, created_at, updated_at
) VALUES 
(
    '00000000-0000-0000-0001-000000000001',
    'Merit Scholar',
    1.75,
    18,
    0,
    0,
    0,
    'Grade-document reference',
    '2026-10-30 17:00:00+08',
    '2026-08-01 08:00:00+08',
    '2026-08-01 08:00:00+08'
),
(
    '00000000-0000-0000-0001-000000000002',
    'Community Scholar',
    2.25,
    15,
    0,
    0,
    1,
    'Grade-document reference',
    '2026-10-30 17:00:00+08',
    '2026-08-01 08:00:00+08',
    '2026-08-01 08:00:00+08'
);

-- 2. Seed Staff Profile
INSERT INTO profiles (id, full_name, student_id, email, role, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Director Maria Santos',
    NULL,
    'staff.santos@scholarship.edu.ph',
    'staff',
    '2026-08-01 08:00:00+08'
);

-- 3. Seed Six Synthetic Scholars (A01 - A06)
INSERT INTO profiles (id, full_name, student_id, email, role, created_at) VALUES
('10000000-0000-0000-0000-000000000001', 'Juan Dela Cruz', '2026-A01', 'juan.a01@student.edu.ph', 'scholar', '2026-08-05 09:00:00+08'),
('10000000-0000-0000-0000-000000000002', 'Maria Clara', '2026-A02', 'clara.a02@student.edu.ph', 'scholar', '2026-08-05 09:15:00+08'),
('10000000-0000-0000-0000-000000000003', 'Antonio Luna', '2026-A03', 'antonio.a03@student.edu.ph', 'scholar', '2026-08-05 09:30:00+08'),
('10000000-0000-0000-0000-000000000004', 'Gabriela Silang', '2026-A04', 'gabriela.a04@student.edu.ph', 'scholar', '2026-08-05 09:45:00+08'),
('10000000-0000-0000-0000-000000000005', 'Jose Rizal', '2026-A05', 'jose.a05@student.edu.ph', 'scholar', '2026-08-05 10:00:00+08'),
('10000000-0000-0000-0000-000000000006', 'Melchora Aquino', '2026-A06', 'melchora.a06@student.edu.ph', 'scholar', '2026-08-05 10:15:00+08');

-- 4. Seed Scholar Assignments
INSERT INTO scholar_assignments (id, scholar_id, scholarship_program_id, assigned_by, assigned_at, assignment_status) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', '2026-08-10 10:00:00+08', 'Active'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', '2026-08-10 10:00:00+08', 'Active'),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', '2026-08-10 10:00:00+08', 'Active'),
('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', '2026-08-10 10:00:00+08', 'Active'),
('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', '2026-08-10 10:00:00+08', 'Active'),
('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', '2026-08-10 10:00:00+08', 'Active');

-- 5. Seed Submissions (A01 - A06)
INSERT INTO semester_submissions (
    id, scholar_id, academic_year, semester, gwa, enrolled_units, failed_subjects, incomplete_subjects, dropped_subjects,
    evidence_reference, submitted_at, is_late, verification_status, compliance_status, renewal_status, created_at, updated_at
) VALUES 
('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '2026-2027', 'Semester 1', 1.75, 18, 0, 0, 0, 'DOC-REG-2026-A01-OFFICIAL_GRADE_TRANSCRIPT.pdf', '2026-10-30 17:00:00+08', FALSE, 'Verified', 'Not Evaluated', 'Pending', '2026-10-30 17:00:00+08', '2026-10-30 17:00:00+08'),
('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '2026-2027', 'Semester 1', 1.76, 18, 0, 0, 0, 'DOC-REG-2026-A02-CERTIFIED_TRUE_COPY.pdf', '2026-10-25 14:30:00+08', FALSE, 'Verified', 'Not Evaluated', 'Pending', '2026-10-25 14:30:00+08', '2026-10-25 14:30:00+08'),
('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', '2026-2027', 'Semester 1', 2.25, 15, 0, 0, 1, 'DOC-REG-2026-A03-PORTAL_GRADE_SLIP.pdf', '2026-10-26 11:15:00+08', FALSE, 'Verified', 'Not Evaluated', 'Pending', '2026-10-26 11:15:00+08', '2026-10-26 11:15:00+08'),
('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', '2026-2027', 'Semester 1', 2.25, 14, 0, 1, 0, 'DOC-REG-2026-A04-OFFICIAL_GRADE_CARD.pdf', '2026-10-27 09:45:00+08', FALSE, 'Verified', 'Not Evaluated', 'Pending', '2026-10-27 09:45:00+08', '2026-10-27 09:45:00+08'),
('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', '2026-2027', 'Semester 1', 1.50, 18, 1, 0, 0, 'DOC-REG-2026-A05-LATE_SUBMISSION_TRANSCRIPT.pdf', '2026-10-30 17:01:00+08', TRUE, 'Verified', 'Not Evaluated', 'Pending', '2026-10-30 17:01:00+08', '2026-10-30 17:01:00+08'),
('30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', '2026-2027', 'Semester 1', 2.00, 15, 0, 0, 0, 'DOC-REG-2026-A06-PENDING_REVIEW_DOCUMENT.pdf', '2026-10-28 16:00:00+08', FALSE, 'Pending', 'Not Evaluated', 'Pending', '2026-10-28 16:00:00+08', '2026-10-28 16:00:00+08');

-- 6. Seed Verification History
INSERT INTO verification_history (id, submission_id, staff_id, action, reason, created_at) VALUES
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Verified', 'Official registrar document confirmed and verified against portal records.', '2026-10-30 17:15:00+08'),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Verified', 'Document certified true copy verified.', '2026-10-26 09:00:00+08'),
('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Verified', 'Grade slip validated with registrar signature stamp.', '2026-10-26 14:00:00+08'),
('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Verified', 'Grade card verified accurately reflects student records.', '2026-10-27 11:30:00+08'),
('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Verified', 'Official late transcript verified.', '2026-10-31 09:00:00+08');

-- 7. Seed System Audit Logs
INSERT INTO audit_logs (actor_id, action_type, record_table, record_id, details, timestamp) VALUES
('00000000-0000-0000-0000-000000000001', 'SYSTEM_SEED', 'scholarship_programs', '00000000-0000-0000-0001-000000000001', '{"event": "Initialized Merit and Community Scholar policy thresholds"}', '2026-08-01 08:00:00+08'),
('00000000-0000-0000-0000-000000000001', 'SYSTEM_SEED', 'profiles', '00000000-0000-0000-0000-000000000001', '{"event": "Created Staff and 6 synthetic scholar records A01-A06"}', '2026-08-05 10:15:00+08');
