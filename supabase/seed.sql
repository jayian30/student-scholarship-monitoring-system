-- ============================================================================
-- Student Scholarship Monitoring and Academic Compliance System
-- Synthetic Test Data & Seed Records
-- Academic Year 2026-2027, Semester 1
-- All timestamps calibrated for Asia/Manila (UTC+8)
-- ============================================================================

-- Clean existing data
DELETE FROM audit_logs;
DELETE FROM renewal_decisions;
DELETE FROM compliance_evaluations;
DELETE FROM verification_history;
DELETE FROM semester_submissions;
DELETE FROM scholar_assignments;
DELETE FROM scholarship_programs;
DELETE FROM profiles;

-- 1. SEED SCHOLARSHIP PROGRAMS
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

-- 2. SEED STAFF AND SCHOLAR USER PROFILES
-- Staff Profile
INSERT INTO profiles (id, full_name, student_id, email, role, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Director Maria Santos',
    NULL,
    'staff.santos@scholarship.edu.ph',
    'staff',
    '2026-08-01 08:00:00+08'
);

-- Six Synthetic Scholars (A01 - A06)
INSERT INTO profiles (id, full_name, student_id, email, role, created_at) VALUES
(
    '10000000-0000-0000-0000-000000000001',
    'Juan Dela Cruz',
    '2026-A01',
    'juan.a01@student.edu.ph',
    'scholar',
    '2026-08-05 09:00:00+08'
),
(
    '10000000-0000-0000-0000-000000000002',
    'Maria Clara',
    '2026-A02',
    'clara.a02@student.edu.ph',
    'scholar',
    '2026-08-05 09:15:00+08'
),
(
    '10000000-0000-0000-0000-000000000003',
    'Antonio Luna',
    '2026-A03',
    'antonio.a03@student.edu.ph',
    'scholar',
    '2026-08-05 09:30:00+08'
),
(
    '10000000-0000-0000-0000-000000000004',
    'Gabriela Silang',
    '2026-A04',
    'gabriela.a04@student.edu.ph',
    'scholar',
    '2026-08-05 09:45:00+08'
),
(
    '10000000-0000-0000-0000-000000000005',
    'Jose Rizal',
    '2026-A05',
    'jose.a05@student.edu.ph',
    'scholar',
    '2026-08-05 10:00:00+08'
),
(
    '10000000-0000-0000-0000-000000000006',
    'Melchora Aquino',
    '2026-A06',
    'melchora.a06@student.edu.ph',
    'scholar',
    '2026-08-05 10:15:00+08'
);

-- 3. SEED SCHOLAR ASSIGNMENTS
INSERT INTO scholar_assignments (id, scholar_id, scholarship_program_id, assigned_by, assigned_at, assignment_status) VALUES
-- A01 -> Merit Scholar
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', '2026-08-10 10:00:00+08', 'Active'),
-- A02 -> Merit Scholar
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', '2026-08-10 10:00:00+08', 'Active'),
-- A03 -> Community Scholar
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', '2026-08-10 10:00:00+08', 'Active'),
-- A04 -> Community Scholar
('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', '2026-08-10 10:00:00+08', 'Active'),
-- A05 -> Merit Scholar
('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', '2026-08-10 10:00:00+08', 'Active'),
-- A06 -> Community Scholar
('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', '2026-08-10 10:00:00+08', 'Active');

-- 4. SEED SUBMISSIONS WITH THE 6 REQUIRED SCENARIOS
-- A01: Merit, GWA 1.75, Units 18, 0 fail, 0 inc, 0 drop. Submitted EXACTLY at deadline (17:00:00). Evidence verified.
INSERT INTO semester_submissions (
    id, scholar_id, academic_year, semester, gwa, enrolled_units, failed_subjects, incomplete_subjects, dropped_subjects,
    evidence_reference, submitted_at, is_late, verification_status, compliance_status, renewal_status, created_at, updated_at
) VALUES (
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '2026-2027',
    'Semester 1',
    1.75,
    18,
    0,
    0,
    0,
    'DOC-REG-2026-A01-OFFICIAL_GRADE_TRANSCRIPT.pdf',
    '2026-10-30 17:00:00+08',
    FALSE,
    'Verified',
    'Not Evaluated',
    'Pending',
    '2026-10-30 17:00:00+08',
    '2026-10-30 17:00:00+08'
);

-- A02: Merit, GWA 1.76, Units 18, 0 fail, 0 inc, 0 drop. Submitted before deadline. Evidence verified.
INSERT INTO semester_submissions (
    id, scholar_id, academic_year, semester, gwa, enrolled_units, failed_subjects, incomplete_subjects, dropped_subjects,
    evidence_reference, submitted_at, is_late, verification_status, compliance_status, renewal_status, created_at, updated_at
) VALUES (
    '30000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    '2026-2027',
    'Semester 1',
    1.76,
    18,
    0,
    0,
    0,
    'DOC-REG-2026-A02-CERTIFIED_TRUE_COPY.pdf',
    '2026-10-25 14:30:00+08',
    FALSE,
    'Verified',
    'Not Evaluated',
    'Pending',
    '2026-10-25 14:30:00+08',
    '2026-10-25 14:30:00+08'
);

-- A03: Community, GWA 2.25, Units 15, 0 fail, 0 inc, 1 drop. Submitted before deadline. Evidence verified.
INSERT INTO semester_submissions (
    id, scholar_id, academic_year, semester, gwa, enrolled_units, failed_subjects, incomplete_subjects, dropped_subjects,
    evidence_reference, submitted_at, is_late, verification_status, compliance_status, renewal_status, created_at, updated_at
) VALUES (
    '30000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000003',
    '2026-2027',
    'Semester 1',
    2.25,
    15,
    0,
    0,
    1,
    'DOC-REG-2026-A03-PORTAL_GRADE_SLIP.pdf',
    '2026-10-26 11:15:00+08',
    FALSE,
    'Verified',
    'Not Evaluated',
    'Pending',
    '2026-10-26 11:15:00+08',
    '2026-10-26 11:15:00+08'
);

-- A04: Community, GWA 2.25, Units 14, 0 fail, 1 inc, 0 drop. Submitted before deadline. Evidence verified.
INSERT INTO semester_submissions (
    id, scholar_id, academic_year, semester, gwa, enrolled_units, failed_subjects, incomplete_subjects, dropped_subjects,
    evidence_reference, submitted_at, is_late, verification_status, compliance_status, renewal_status, created_at, updated_at
) VALUES (
    '30000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000004',
    '2026-2027',
    'Semester 1',
    2.25,
    14,
    0,
    1,
    0,
    'DOC-REG-2026-A04-OFFICIAL_GRADE_CARD.pdf',
    '2026-10-27 09:45:00+08',
    FALSE,
    'Verified',
    'Not Evaluated',
    'Pending',
    '2026-10-27 09:45:00+08',
    '2026-10-27 09:45:00+08'
);

-- A05: Merit, GWA 1.50, Units 18, 1 fail, 0 inc, 0 drop. Submitted ONE MINUTE LATE (17:01:00). Evidence verified.
INSERT INTO semester_submissions (
    id, scholar_id, academic_year, semester, gwa, enrolled_units, failed_subjects, incomplete_subjects, dropped_subjects,
    evidence_reference, submitted_at, is_late, verification_status, compliance_status, renewal_status, created_at, updated_at
) VALUES (
    '30000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000005',
    '2026-2027',
    'Semester 1',
    1.50,
    18,
    1,
    0,
    0,
    'DOC-REG-2026-A05-LATE_SUBMISSION_TRANSCRIPT.pdf',
    '2026-10-30 17:01:00+08',
    TRUE,
    'Verified',
    'Not Evaluated',
    'Pending',
    '2026-10-30 17:01:00+08',
    '2026-10-30 17:01:00+08'
);

-- A06: Community, GWA 2.00, Units 15, 0 fail, 0 inc, 0 drop. Submitted before deadline. Evidence PENDING VERIFICATION.
INSERT INTO semester_submissions (
    id, scholar_id, academic_year, semester, gwa, enrolled_units, failed_subjects, incomplete_subjects, dropped_subjects,
    evidence_reference, submitted_at, is_late, verification_status, compliance_status, renewal_status, created_at, updated_at
) VALUES (
    '30000000-0000-0000-0000-000000000006',
    '10000000-0000-0000-0000-000000000006',
    '2026-2027',
    'Semester 1',
    2.00,
    15,
    0,
    0,
    0,
    'DOC-REG-2026-A06-PENDING_REVIEW_DOCUMENT.pdf',
    '2026-10-28 16:00:00+08',
    FALSE,
    'Pending',
    'Not Evaluated',
    'Pending',
    '2026-10-28 16:00:00+08',
    '2026-10-28 16:00:00+08'
);

-- 5. SEED VERIFICATION HISTORY FOR PRE-VERIFIED SCENARIOS
INSERT INTO verification_history (id, submission_id, staff_id, action, reason, created_at) VALUES
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Verified', 'Official registrar document confirmed and verified against portal records.', '2026-10-30 17:15:00+08'),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Verified', 'Document certified true copy verified.', '2026-10-26 09:00:00+08'),
('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Verified', 'Grade slip validated with registrar signature stamp.', '2026-10-26 14:00:00+08'),
('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Verified', 'Grade card verified accurately reflects student records.', '2026-10-27 11:30:00+08'),
('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Verified', 'Official late transcript verified.', '2026-10-31 09:00:00+08');

-- 6. AUDIT LOGS FOR INITIAL SEED
INSERT INTO audit_logs (actor_id, action_type, record_table, record_id, details, timestamp) VALUES
('00000000-0000-0000-0000-000000000001', 'SYSTEM_SEED', 'scholarship_programs', '00000000-0000-0000-0001-000000000001', '{"event": "Initialized Merit and Community Scholar policy thresholds"}', '2026-08-01 08:00:00+08'),
('00000000-0000-0000-0000-000000000001', 'SYSTEM_SEED', 'profiles', '00000000-0000-0000-0000-000000000001', '{"event": "Created Staff and 6 synthetic scholar records A01-A06"}', '2026-08-05 10:15:00+08');
