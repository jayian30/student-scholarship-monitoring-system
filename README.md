# Student Scholarship Monitoring and Academic Compliance System (SSMAS)
### ITPC111 – Systems Analysis and Design Midterm Laboratory Examination
**Academic Year**: 2026–2027 &bull; **Timezone**: Asia/Manila (UTC+08:00)

---

## 1. Project Overview
The **Student Scholarship Monitoring and Academic Compliance System (SSMAS)** is a centralized, responsive, role-based administrative web application designed to replace spreadsheet-based scholarship monitoring. It administers two scholarship programs:
1. **Merit Scholar**
2. **Community Scholar**

The system coordinates the submission of semester academic performance summaries by scholars, documentary evidence substantiation by Scholarship Staff, rule-based academic compliance evaluations against persisted database thresholds, explicit staff renewal decisions, and immutable audit logging.

Official grades originate solely from the University Registrar. The system does not modify official Registrar records or disburse monetary stipends.

---

## 2. Key Features and User Roles

### A. Scholar Role
- **Secure Authentication**: Protected sign-in/sign-out with cryptographic session management.
- **Assigned Policy Overview**: Real-time display of assigned program rules, unit requirements, and Manila submission deadlines.
- **Academic Summary Submission**: Input of GWA (1.00–5.00), enrolled units, failed, incomplete, and dropped counts, and supporting grade-document references.
- **Duplicate & Validation Guard**: Instant rejection of invalid numbers, negative counts, or duplicate semester submissions.
- **Lifecycle Status Tracking**: Separate visibility into Verification Status (`Pending`, `Verified`, `Returned`), Compliance Status (`Not Evaluated`, `Compliant`, `With Deficiency`), and Renewal Status (`Pending`, `Approved`, `Held`).
- **Correction & Resubmission**: View detailed staff return reasons and resubmit corrected academic data, returning verification status to `Pending` while preserving history.
- **Data Privacy**: Restricted strictly to viewing only own records.

### B. Scholarship Staff Role
- **Administrative Command Dashboard**: Live metrics for Total Active Scholars, Pending Verifications, Compliant Submissions, and With Deficiency counts; recent activity feeds; and multi-criteria search and filters.
- **Scholar Directory Management**: Search scholars by Student ID or Name, inspect student profiles, and assign scholars to Merit or Community programs.
- **Documentary Verification Queue**: Review submitted grade references, certify evidence as `Verified`, or return submissions with mandatory explanatory instructions.
- **Automated Compliance Engine**: Execute 7-point policy evaluations strictly blocked until evidence is verified, outputting itemized check results and deficiency reasons.
- **Renewal Decision Station**: Record explicit `Approved` or `Held` renewal decisions. Strict enforcement: approval requires `Verified` evidence and `Compliant` evaluation.
- **Audit History Trail**: Inspect immutable system logs capturing every actor, action type, affected table, and timestamp.

---

## 3. Technology Stack
- **Frontend**: Vanilla HTML5, modern CSS3 (Custom Design System, Responsive Flexbox/Grid), and ES6+ JavaScript.
- **Backend & Database**: Supabase PostgreSQL (or any standard PostgreSQL 14+ instance).
- **Authentication**: Supabase Auth with Row Level Security (RLS) integration.
- **Database Security**: PostgreSQL Row Level Security (RLS) policies, triggers, and stored procedures (`resubmit_semester_submission`, `verify_submission`, `evaluate_submission_compliance`, `record_renewal_decision`).
- **Dual-Mode Data Architecture**: Dual client (`js/supabase-client.js`) capable of connecting to live Supabase while offering a zero-dependency in-browser local database simulation engine for 100% reliable offline testing and evaluation.
- **Standard Timezone**: `Asia/Manila` (UTC+08:00) for all deadline comparisons and displayed timestamps.

---

## 4. Project Structure

```
student-scholarship-monitoring-system/
├── index.html                   # System landing portal and program overview
├── login.html                   # Unified authentication & synthetic profile switcher
├── scholar-dashboard.html       # Scholar home & submission tracker
├── submit-grades.html           # Semester grade submission form with live validation
├── submission-details.html      # Detailed review, deficiency breakdown & resubmission form
├── staff-dashboard.html         # Staff dashboard with live counters, search & filters
├── scholars.html                # Scholar directory & program assignment module
├── verification.html            # Evidence verification queue & return modal
├── compliance.html              # Academic compliance evaluation station
├── renewal.html                 # Renewal decision workflow (Approved / Held)
├── policies.html                # Persisted scholarship policy thresholds viewer
├── audit-history.html           # System-wide audit history explorer
├── css/
│   └── styles.css               # Main responsive academic design system
├── js/
│   ├── config.js                # System configuration & Manila timezone helpers
│   ├── supabase-client.js       # Dual-mode data client (Supabase API + Local Engine)
│   ├── validation.js            # Input validation library (GWA, units, counts, reasons)
│   ├── auth.js                  # Authentication & session service
│   ├── access-control.js        # Role-based route guard and header user profile pill
│   ├── scholar.js               # Scholar portal controllers & data binding
│   ├── submissions.js           # Submissions CRUD, deadline check, resubmission
│   ├── verification.js          # Staff verification queue actions & modal logic
│   ├── compliance.js            # 7-rule compliance evaluation engine runner
│   ├── renewal.js               # Renewal decision workflow and precondition gate
│   └── dashboard.js             # Staff metrics aggregation, search, and filtering
├── supabase/
│   ├── schema.sql               # PostgreSQL tables, constraints, foreign keys, indexes
│   ├── seed.sql                 # Persisted policy records & 6 synthetic scholars (A01–A06)
│   ├── rls-policies.sql         # Row Level Security policies for Scholar & Staff roles
│   └── functions.sql            # Stored procedures, triggers, audit logging, server-time checks
├── tests/
│   ├── runner.html              # Interactive browser-based test suite executing TC01–TC10
│   ├── test-plan.md             # Formal software test plan
│   └── test-results.md          # Traceable test results matrix with verified outcomes
├── ANALYSIS_AND_DESIGN.md       # Complete SAD Midterm documentation (Sections A1–A6)
├── README.md                    # Setup guide, local testing instructions, deployment
└── .gitignore                   # Version control ignore definitions
```

---

## 5. Prerequisites
- Any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).
- A lightweight local web server (e.g., VS Code *Live Server* extension, Python's `python -m http.server 8000`, Node's `npx serve`, or direct file opening).
- *(Optional for live Supabase integration)*: A free [Supabase](https://supabase.com) account.

---

## 6. How to Run Locally (Zero-Config Offline Mode)

The application includes an integrated **Local Database Simulation Engine** that mirrors PostgreSQL constraints, foreign keys, RLS isolation, and stored procedures in the browser. You can test the application immediately without an active internet connection:

1. Clone or open the project folder in VS Code:
   ```bash
   cd student-scholarship-monitoring-system
   ```
2. Start any local web server:
   - **Using Python**:
     ```bash
     python -m http.server 8080
     ```
   - **Using Node**:
     ```bash
     npx serve .
     ```
   - **Using VS Code**: Right-click `index.html` $\rightarrow$ *"Open with Live Server"*.
3. Open `http://localhost:8080` (or the port indicated by your server) in your browser.
4. Navigate to `login.html`.
5. Click any of the **Synthetic Test Accounts** (e.g. *Director Maria Santos* for Staff, or *Juan Dela Cruz (A01)* for Scholar) to immediately sign in and evaluate!

---

## 7. How to Connect a Live Supabase PostgreSQL Project

If you wish to run the system against a live cloud Supabase database:

### Step 1: Create a Supabase Project
1. Log in to [database.new](https://database.new) and create a new project.
2. Note your **Project URL** and **Publishable/Anon API Key** from *Project Settings $\rightarrow$ API*.

### Step 2: Execute SQL Scripts
Open the **SQL Editor** in the Supabase Dashboard and run the files in the following order:
1. `supabase/schema.sql` (Creates tables, unique constraints, foreign keys, and indexes).
2. `supabase/functions.sql` (Creates stored procedures: `resubmit_semester_submission`, `verify_submission`, `evaluate_submission_compliance`, `record_renewal_decision`).
3. `supabase/rls-policies.sql` (Enables RLS on all tables and creates granular scholar/staff security policies).
4. `supabase/seed.sql` (Inserts the two policy thresholds and six synthetic test scenarios A01–A06).

### Step 3: Configure Frontend Credentials
Open `js/config.js` and input your project credentials (or enter them in localStorage via browser console):
```javascript
DEFAULT_SUPABASE_URL: "https://your-project-id.supabase.co",
DEFAULT_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
```
*Security Note: Never put the service-role key or database password in frontend code. The anon key is safe when RLS policies are enabled.*

---

## 8. Synthetic Scholar Profiles (AY 2026–2027, Sem 1)

The system is pre-seeded with six synthetic scholar records reflecting the examination test matrix:

| ID | Scholar Name | Student ID | Program | GWA | Units | Failed | INC | DRP | Special Condition | Expected Result |
|:---:|:---|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---|:---|
| **A01** | Juan Dela Cruz | `2026-A01` | Merit | 1.75 | 18 | 0 | 0 | 0 | Submitted exactly at deadline (17:00:00 PHT); verified | **Compliant** |
| **A02** | Maria Clara | `2026-A02` | Merit | 1.76 | 18 | 0 | 0 | 0 | Verified; submitted before deadline | **With Deficiency** (GWA > 1.75) |
| **A03** | Antonio Luna | `2026-A03` | Community | 2.25 | 15 | 0 | 0 | 1 | Verified; submitted before deadline | **Compliant** (1 drop permitted) |
| **A04** | Gabriela Silang | `2026-A04` | Community | 2.25 | 14 | 0 | 1 | 0 | Verified; submitted before deadline | **With Deficiency** (Units < 15, INC > 0) |
| **A05** | Jose Rizal | `2026-A05` | Merit | 1.50 | 18 | 1 | 0 | 0 | Submitted 1 min late (17:01:00 PHT); verified | **With Deficiency** (Failed > 0, Late) |
| **A06** | Melchora Aquino | `2026-A06` | Community | 2.00 | 15 | 0 | 0 | 0 | Submitted on time; evidence **Pending** | **Evaluation Blocked** |

---

## 9. How to Execute the Mandatory Tests (TC01–TC10)

1. Navigate to `http://localhost:8080/tests/runner.html` in your browser.
2. Click the **"▶ Run All Functional Tests"** button.
3. The automated test engine will execute all 10 test cases against the data client:
   - **TC01**: Valid boundary evaluation (A01) $\rightarrow$ **PASS**
   - **TC02**: GWA above limit evaluation (A02) $\rightarrow$ **PASS**
   - **TC03**: Program variation (A03 with 1 dropped) $\rightarrow$ **PASS**
   - **TC04**: Multiple deficiencies (A04) $\rightarrow$ **PASS**
   - **TC05**: Failure and lateness (A05) $\rightarrow$ **PASS**
   - **TC06**: Verification precondition gate (A06) $\rightarrow$ **PASS**
   - **TC07**: Duplicate submission and invalid input rejection $\rightarrow$ **PASS**
   - **TC08**: Role isolation and unauthorized access prevention $\rightarrow$ **PASS**
   - **TC09**: Return for correction, resubmission, and history $\rightarrow$ **PASS**
   - **TC10**: Renewal decision authority and rule constraints $\rightarrow$ **PASS**
4. View real-time outputs, debug traces, and pass badges directly on screen.
5. Refer to `tests/test-plan.md` and `tests/test-results.md` for full formal test documentation.

---

## 10. Demonstrating Backend Role Isolation & Security

To demonstrate that security is enforced at the database level rather than through hidden UI buttons:
1. Log in as **Scholar A01** (`juan.a01@student.edu.ph`).
2. Open the browser Developer Tools Console (`F12`).
3. Attempt to query another scholar's submissions:
   ```javascript
   const res = await window.dataClient.from('semester_submissions').select('*').eq('scholar_id', '10000000-0000-0000-0000-000000000002');
   console.log(res.data); // Returns [] (0 records) due to RLS!
   ```
4. Attempt to execute an unauthorized administrative verification RPC:
   ```javascript
   const hack = await window.dataClient.rpc('verify_submission', { p_submission_id: '30000000-0000-0000-0000-000000000001', p_action: 'Verified' });
   console.log(hack.error.message); // "Unauthorized: Only scholarship staff can verify submissions."
   ```
5. Attempt to approve a renewal decision as a Scholar:
   ```javascript
   const unauth = await window.dataClient.rpc('record_renewal_decision', { p_submission_id: '30000000-0000-0000-0000-000000000001', p_decision: 'Approved', p_notes: 'Hacked' });
   console.log(unauth.error.message); // "Unauthorized: Only scholarship staff can record renewal decisions."
   ```

---

## 11. Deployment (GitHub Pages)
1. Push this repository to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Complete Student Scholarship Monitoring System implementation"
   git remote add origin https://github.com/your-username/student-scholarship-monitoring-system.git
   git push -u origin main
   ```
2. In GitHub, navigate to *Settings $\rightarrow$ Pages*.
3. Under *Branch*, select `main` and `/ (root)`, then click *Save*.
4. GitHub Pages will publish the static frontend. The frontend uses client-side routing, vanilla JavaScript, and connects to Supabase via HTTPS (or runs in local mode), functioning without custom build steps.

---

## 12. Known Limitations
1. In local sandbox mode, state is persisted in browser `localStorage`. Resetting browser cookies/storage resets data to seed state (a "Reset Seed Data" button is provided on `login.html`).
2. Official grade documents are referenced via tracking codes or URLs; direct multi-gigabyte document OCR processing is out of scope.
