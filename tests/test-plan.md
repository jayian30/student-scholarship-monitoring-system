# Software Test Plan (STP)
## Student Scholarship Monitoring and Academic Compliance System
### ITPC111 – Systems Analysis and Design Midterm Laboratory Examination

---

## 1. Test Objectives & Scope
The objective of this test plan is to thoroughly evaluate the functional correctness, role-based security isolation, business rule enforcement, and persistence of the **Student Scholarship Monitoring and Academic Compliance System**.

### Scope
- **Grade Summary Submissions**: Range validation, negative count rejection, Manila timezone deadline comparison, duplicate semester submission rejection.
- **Evidence Verification**: Staff verification workflow, mandatory rationale on returns, scholar notification and resubmission.
- **Compliance Evaluation Engine**: 7-point policy check evaluation against persisted database thresholds for Merit Scholar and Community Scholar programs.
- **Renewal Workflow**: Explicit staff decision gates (Approved vs. Held), precondition verification, explanatory notes requirement.
- **Security & Authorization**: Row Level Security (RLS) enforcement, cross-scholar isolation, staff role protection.

---

## 2. Test Environment
- **Platform**: Browser-based web application (HTML5, CSS3, ES6+ JavaScript).
- **Timezone**: Asia/Manila (UTC+08:00).
- **Backend / Storage**: Supabase PostgreSQL with local database simulation engine (`LocalDatabaseClient`) mirroring PostgreSQL schemas, unique constraints, and stored procedures (`resubmit_semester_submission`, `verify_submission`, `evaluate_submission_compliance`, `record_renewal_decision`).
- **Test Automation Suite**: Interactive test runner located at `tests/runner.html`.

---

## 3. Synthetic Test Profiles (AY 2026–2027, Semester 1)

| Code | Scholar Name | Student ID | Assigned Program | Reported GWA | Enrolled Units | Failed | INC | DRP | Special Condition | Expected Compliance |
|:---:|:---|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---|:---|
| **A01** | Juan Dela Cruz | `2026-A01` | Merit Scholar | 1.75 | 18 | 0 | 0 | 0 | Submitted exactly at deadline (17:00:00 PHT); verified | **Compliant** |
| **A02** | Maria Clara | `2026-A02` | Merit Scholar | 1.76 | 18 | 0 | 0 | 0 | Verified; submitted before deadline | **With Deficiency** (GWA > 1.75) |
| **A03** | Antonio Luna | `2026-A03` | Community Scholar | 2.25 | 15 | 0 | 0 | 1 | Verified; submitted before deadline | **Compliant** (1 drop allowed) |
| **A04** | Gabriela Silang | `2026-A04` | Community Scholar | 2.25 | 14 | 0 | 1 | 0 | Verified; submitted before deadline | **With Deficiency** (Units < 15, INC > 0) |
| **A05** | Jose Rizal | `2026-A05` | Merit Scholar | 1.50 | 18 | 1 | 0 | 0 | Submitted 1 min late (17:01:00 PHT); verified | **With Deficiency** (Failed > 0, Late) |
| **A06** | Melchora Aquino | `2026-A06` | Community Scholar | 2.00 | 15 | 0 | 0 | 0 | Submitted on time; evidence **Pending** | **Evaluation Blocked** |

---

## 4. Test Case Specifications (TC01–TC10)

### TC01 – Valid Boundary
- **Objective**: Verify that boundary conditions for Merit Scholar (GWA exactly 1.75, minimum 18 units, exact deadline) evaluate to Compliant.
- **Input**: Submission `30000000-0000-0000-0000-000000000001` (A01).
- **Expected Outcome**: `compliance_status = 'Compliant'`. No deficiency reasons generated.

### TC02 – GWA Above Limit
- **Objective**: Verify that GWA slightly above boundary (1.76 > 1.75) generates With Deficiency.
- **Input**: Submission `30000000-0000-0000-0000-000000000002` (A02).
- **Expected Outcome**: `compliance_status = 'With Deficiency'`. Specific reason: GWA exceeds 1.75.

### TC03 – Program Variation
- **Objective**: Verify program-specific rules where Community Scholar allows 1 dropped subject.
- **Input**: Submission `30000000-0000-0000-0000-000000000003` (A03).
- **Expected Outcome**: `compliance_status = 'Compliant'`. Dropped subject check passes.

### TC04 – Multiple Deficiencies
- **Objective**: Verify simultaneous identification of deficient units and incomplete grades.
- **Input**: Submission `30000000-0000-0000-0000-000000000004` (A04).
- **Expected Outcome**: `compliance_status = 'With Deficiency'`. Both unit shortage (14 < 15) and INC (1 > 0) listed.

### TC05 – Failure and Lateness
- **Objective**: Verify subject failure and Manila timezone late submission detection.
- **Input**: Submission `30000000-0000-0000-0000-000000000005` (A05).
- **Expected Outcome**: `compliance_status = 'With Deficiency'`. Both failed subject and late submission listed.

### TC06 – Verification Gate
- **Objective**: Ensure unverified submissions cannot be evaluated or approved for renewal.
- **Input**: Submission `30000000-0000-0000-0000-000000000006` (A06).
- **Expected Outcome**: Operations blocked with error messages stating evidence is not verified.

### TC07 – Duplicate and Invalid Input
- **Objective**: Verify database constraint `UNIQUE(scholar_id, academic_year, semester)` and check constraints.
- **Input**: Attempt duplicate submission for A01 (AY 2026-2027, Sem 1); GWA 0.50; Failed count -2.
- **Expected Outcome**: Duplicate rejected; invalid GWA and negative counts rejected by validation rules.

### TC08 – Role Isolation
- **Objective**: Verify Row Level Security: Scholar A cannot view Scholar B's records; Scholar cannot verify evidence.
- **Input**: Scholar A01 session attempts reading A02 submissions and calling `verify_submission`.
- **Expected Outcome**: 0 records returned; RPC rejected as Unauthorized.

### TC09 – Persistence and Correction
- **Objective**: Return evidence with reason, resubmit corrected data, verify reset to Pending and history persistence.
- **Input**: Return A02 submission; Scholar resubmits with GWA 1.70; refresh database state.
- **Expected Outcome**: Corrected values persist, verification resets to Pending, verification history shows both actions.

### TC10 – Renewal Authority
- **Objective**: Verify staff can Approve compliant and Hold deficient submissions, and scholars cannot make renewal decisions.
- **Input**: Staff approves A01, holds A05 with notes; Scholar attempts to approve A05.
- **Expected Outcome**: Staff decisions persist; scholar attempt denied as Unauthorized.
