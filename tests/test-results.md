# Software Test Results Matrix
## Student Scholarship Monitoring and Academic Compliance System
### ITPC111 – Systems Analysis and Design Midterm Laboratory Examination

---

## 1. Test Execution Summary

- **Total Test Cases**: 10
- **Passed**: 10
- **Failed**: 0
- **Pass Rate**: 100%
- **Execution Date**: Academic Year 2026–2027 (Evaluation Session)
- **Timezone**: Asia/Manila (UTC+08:00)
- **Test Runner**: `tests/runner.html`

---

## 2. Test Results Table

| Test ID | Input or Action | Expected Result | Actual Result | Pass / Fail | Evidence / Reference | Defect Notes |
|:---:|:---|:---|:---|:---:|:---|:---|
| **TC01** | Evaluate Merit Scholar A01 (GWA 1.75, 18 units, 0 F/I/D, submitted exactly at deadline `2026-10-30 17:00:00+08`). | `compliance_status = 'Compliant'`. All 7 policy checks pass. | Evaluated as `Compliant`. Checks: GWA 1.75 $\le$ 1.75 (Pass); Units 18 $\ge$ 18 (Pass); Exact deadline (Pass). | **PASS** | `compliance.html` / `runner.html#TC01` | None. Boundary condition validated. |
| **TC02** | Evaluate Merit Scholar A02 (GWA 1.76, 18 units, 0 F/I/D, on-time, verified). | `compliance_status = 'With Deficiency'`. GWA deficiency reason generated. | Evaluated as `With Deficiency`. Deficiency reason: *"GWA (1.76) exceeds the maximum permitted 1.75 for Merit Scholar."* | **PASS** | `compliance.html` / `runner.html#TC02` | None. Strict GWA ceiling enforced. |
| **TC03** | Evaluate Community Scholar A03 (GWA 2.25, 15 units, 0 F, 0 INC, 1 DRP, on-time, verified). | `compliance_status = 'Compliant'`. 1 dropped subject permitted under Community Scholar rules. | Evaluated as `Compliant`. Policy check confirms 1 dropped subject $\le$ 1 permitted for Community Scholar. | **PASS** | `compliance.html` / `runner.html#TC03` | None. Program-specific variation verified. |
| **TC04** | Evaluate Community Scholar A04 (GWA 2.25, 14 units, 0 F, 1 INC, 0 DRP, on-time, verified). | `compliance_status = 'With Deficiency'`. Identifies unit deficiency and incomplete grade. | Evaluated as `With Deficiency`. Reasons: (1) *"Enrolled units (14) are below the required 15 units."*; (2) *"Incomplete grades (1) exceed the permitted limit (maximum 0)."* | **PASS** | `compliance.html` / `runner.html#TC04` | None. Multiple deficiencies correctly captured. |
| **TC05** | Evaluate Merit Scholar A05 (GWA 1.50, 18 units, 1 Failed, 0 INC, 0 DRP, submitted at `17:01:00+08` [1 min late]). | `compliance_status = 'With Deficiency'`. Identifies failed subject and late submission. | Evaluated as `With Deficiency`. Reasons: (1) *"One or more failed subjects (1) are not permitted (maximum 0)."*; (2) *"Submission was received after the deadline (late submission)."* | **PASS** | `compliance.html` / `runner.html#TC05` | None. Manila deadline comparison verified. |
| **TC06** | Attempt evaluation and renewal approval on Community Scholar A06 (evidence status = `Pending`). | Both actions strictly blocked with clear error messages. | Compliance evaluation blocked: *"Evaluation blocked: Submission evidence status is 'Pending'... cannot proceed until evidence is verified."* Renewal approval blocked: *"Approval blocked: Submission evidence is 'Pending', but must be Verified."* | **PASS** | `verification.html` / `compliance.html` / `runner.html#TC06` | None. Mandatory verification gate active. |
| **TC07** | (1) Insert duplicate semester submission for A01 (`2026-2027, Sem 1`); (2) Submit GWA 0.50; (3) Submit -2 failed subjects. | All operations rejected with descriptive validation / constraint errors. | Database constraint rejected duplicate: *"duplicate key value violates unique constraint 'uq_scholar_semester'"*. Validation rejected GWA: *"GWA must be between 1.00 and 5.00"*. Validation rejected count: *"Subject count cannot be negative"*. | **PASS** | `submit-grades.html` / `runner.html#TC07` | None. Frontend and database constraints verified. |
| **TC08** | Authenticate as Scholar A01; attempt to query Scholar A02's records; attempt to call `verify_submission`. | Database/RLS denies access to foreign records; unauthorized verification blocked. | Scholar A01 query for A02 submissions returned 0 records (RLS enforced). Verification RPC returned error: *"Unauthorized: Only scholarship staff can verify submissions."* | **PASS** | `js/supabase-client.js` / `runner.html#TC08` | None. Complete role isolation maintained. |
| **TC09** | Staff returns submission A02 with reason; Scholar A02 resubmits with GWA 1.70; refresh database state. | Corrected record persists, verification resets to `Pending`, prior history preserved. | Submission A02 updated to GWA 1.70; verification status reset to `Pending`; `verification_history` retains both `Returned` and `Resubmitted` entries. | **PASS** | `submission-details.html` / `runner.html#TC09` | None. Lifecycle loop and persistence confirmed. |
| **TC10** | Staff approves compliant A01; Staff holds deficient A05 with notes; Scholar attempts unauthorized renewal update. | Staff decisions persist; scholar attempt denied with authorization error. | A01 updated to `Approved`; A05 updated to `Held` with notes stored in `renewal_decisions`; Scholar modification denied: *"Unauthorized: Only scholarship staff can record renewal decisions."* | **PASS** | `renewal.html` / `runner.html#TC10` | None. Renewal authority strictly enforced. |

---

## 3. Defect Analysis & Verification Conclusion
Across all 10 mandatory test cases, zero defects were encountered. All business rules (BR01 through BR06) and non-functional requirements operate as designed in both local database mode and connected Supabase PostgreSQL configurations.
