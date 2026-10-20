-- ============================================================================
-- Student Scholarship Monitoring and Academic Compliance System
-- PostgreSQL Schema for Supabase
-- ============================================================================

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if re-running (order matters for foreign keys)
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
