-- ============================================================================
-- Student Scholarship Monitoring and Academic Compliance System
-- PostgreSQL Row Level Security (RLS) Policies for Supabase
-- ============================================================================

-- Enable RLS on all protected tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarship_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholar_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE semester_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE renewal_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper security functions
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

-- ----------------------------------------------------------------------------
-- 1. PROFILES POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT TO authenticated
    USING (is_owner(id) OR is_staff());

DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE TO authenticated
    USING (is_owner(id) OR is_staff())
    WITH CHECK (
        -- Scholars cannot promote themselves to staff
        (role = (SELECT role FROM profiles WHERE id = auth.uid())) OR is_staff()
    );

DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT TO authenticated
    WITH CHECK (is_owner(id) OR is_staff());

-- ----------------------------------------------------------------------------
-- 2. SCHOLARSHIP PROGRAMS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "programs_select_policy" ON scholarship_programs;
CREATE POLICY "programs_select_policy" ON scholarship_programs
    FOR SELECT TO authenticated
    USING (TRUE); -- Readable by all authenticated users (scholars & staff)

DROP POLICY IF EXISTS "programs_admin_modify" ON scholarship_programs;
CREATE POLICY "programs_admin_modify" ON scholarship_programs
    FOR ALL TO authenticated
    USING (is_staff())
    WITH CHECK (is_staff());

-- ----------------------------------------------------------------------------
-- 3. SCHOLAR ASSIGNMENTS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "assignments_select_policy" ON scholar_assignments;
CREATE POLICY "assignments_select_policy" ON scholar_assignments
    FOR SELECT TO authenticated
    USING (is_owner(scholar_id) OR is_staff());

DROP POLICY IF EXISTS "assignments_staff_manage" ON scholar_assignments;
CREATE POLICY "assignments_staff_manage" ON scholar_assignments
    FOR ALL TO authenticated
    USING (is_staff())
    WITH CHECK (is_staff());

-- ----------------------------------------------------------------------------
-- 4. SEMESTER SUBMISSIONS POLICIES
-- ----------------------------------------------------------------------------
-- Select: Scholars can only view their own; Staff can view all
DROP POLICY IF EXISTS "submissions_select_policy" ON semester_submissions;
CREATE POLICY "submissions_select_policy" ON semester_submissions
    FOR SELECT TO authenticated
    USING (is_owner(scholar_id) OR is_staff());

-- Insert: Scholars can only insert for their own account; Staff cannot insert as a scholar
DROP POLICY IF EXISTS "submissions_insert_policy" ON semester_submissions;
CREATE POLICY "submissions_insert_policy" ON semester_submissions
    FOR INSERT TO authenticated
    WITH CHECK (
        is_owner(scholar_id) AND
        verification_status = 'Pending' AND
        compliance_status = 'Not Evaluated' AND
        renewal_status = 'Pending'
    );

-- Update: Scholars can only update returned submissions via stored procedures; Staff can update statuses
DROP POLICY IF EXISTS "submissions_update_policy" ON semester_submissions;
CREATE POLICY "submissions_update_policy" ON semester_submissions
    FOR UPDATE TO authenticated
    USING (is_owner(scholar_id) OR is_staff())
    WITH CHECK (
        -- Staff can update any submission; Scholars can only update their own if Returned
        is_staff() OR (is_owner(scholar_id) AND verification_status = 'Returned')
    );

-- ----------------------------------------------------------------------------
-- 5. VERIFICATION HISTORY POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "verification_select_policy" ON verification_history;
CREATE POLICY "verification_select_policy" ON verification_history
    FOR SELECT TO authenticated
    USING (
        is_staff() OR EXISTS (
            SELECT 1 FROM semester_submissions sub
            WHERE sub.id = verification_history.submission_id AND sub.scholar_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "verification_insert_policy" ON verification_history;
CREATE POLICY "verification_insert_policy" ON verification_history
    FOR INSERT TO authenticated
    WITH CHECK (is_staff() OR action = 'Resubmitted');

-- ----------------------------------------------------------------------------
-- 6. COMPLIANCE EVALUATIONS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "evaluations_select_policy" ON compliance_evaluations;
CREATE POLICY "evaluations_select_policy" ON compliance_evaluations
    FOR SELECT TO authenticated
    USING (
        is_staff() OR EXISTS (
            SELECT 1 FROM semester_submissions sub
            WHERE sub.id = compliance_evaluations.submission_id AND sub.scholar_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "evaluations_staff_insert" ON compliance_evaluations;
CREATE POLICY "evaluations_staff_insert" ON compliance_evaluations
    FOR INSERT TO authenticated
    WITH CHECK (is_staff());

-- ----------------------------------------------------------------------------
-- 7. RENEWAL DECISIONS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "renewal_select_policy" ON renewal_decisions;
CREATE POLICY "renewal_select_policy" ON renewal_decisions
    FOR SELECT TO authenticated
    USING (
        is_staff() OR EXISTS (
            SELECT 1 FROM semester_submissions sub
            WHERE sub.id = renewal_decisions.submission_id AND sub.scholar_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "renewal_staff_insert" ON renewal_decisions;
CREATE POLICY "renewal_staff_insert" ON renewal_decisions
    FOR INSERT TO authenticated
    WITH CHECK (
        is_staff() AND (
            decision != 'Approved' OR EXISTS (
                SELECT 1 FROM semester_submissions sub
                WHERE sub.id = renewal_decisions.submission_id
                  AND sub.verification_status = 'Verified'
                  AND sub.compliance_status = 'Compliant'
            )
        )
    );

-- ----------------------------------------------------------------------------
-- 8. AUDIT LOGS POLICIES
-- ----------------------------------------------------------------------------
-- Only Staff can view audit logs
DROP POLICY IF EXISTS "audit_select_policy" ON audit_logs;
CREATE POLICY "audit_select_policy" ON audit_logs
    FOR SELECT TO authenticated
    USING (is_staff());

-- Any authenticated user's actions can be inserted, but NO direct modifications or deletions
DROP POLICY IF EXISTS "audit_insert_policy" ON audit_logs;
CREATE POLICY "audit_insert_policy" ON audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (TRUE);

-- Prevent ordinary edits or deletes to audit logs
DROP POLICY IF EXISTS "audit_no_update" ON audit_logs;
DROP POLICY IF EXISTS "audit_no_delete" ON audit_logs;
-- By default without UPDATE or DELETE policy, updates/deletes are denied to everyone except superuser.
