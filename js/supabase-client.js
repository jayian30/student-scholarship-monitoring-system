/**
 * Student Scholarship Monitoring and Academic Compliance System
 * Dual-Mode Data Client (Supabase PostgreSQL + Local Simulated Engine)
 */

class LocalDatabaseEngine {
    constructor() {
        this.STORAGE_KEY = 'SSMAS_LOCAL_DATABASE_V1';
        this.SESSION_KEY = 'SSMAS_CURRENT_SESSION_V1';
        this.init();
    }

    init() {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            this.resetToSeed();
        }
    }

    getDB() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || {};
        } catch (e) {
            console.error("Error reading local DB, resetting to seed", e);
            this.resetToSeed();
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY));
        }
    }

    saveDB(db) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(db));
    }

    resetToSeed() {
        const seedData = {
            profiles: [
                {
                    id: '00000000-0000-0000-0000-000000000001',
                    full_name: 'Director Maria Santos',
                    student_id: null,
                    email: 'staff.santos@scholarship.edu.ph',
                    role: 'staff',
                    created_at: '2026-08-01T08:00:00+08:00'
                },
                {
                    id: '10000000-0000-0000-0000-000000000001',
                    full_name: 'Juan Dela Cruz',
                    student_id: '2026-A01',
                    email: 'juan.a01@student.edu.ph',
                    role: 'scholar',
                    created_at: '2026-08-05T09:00:00+08:00'
                },
                {
                    id: '10000000-0000-0000-0000-000000000002',
                    full_name: 'Maria Clara',
                    student_id: '2026-A02',
                    email: 'clara.a02@student.edu.ph',
                    role: 'scholar',
                    created_at: '2026-08-05T09:15:00+08:00'
                },
                {
                    id: '10000000-0000-0000-0000-000000000003',
                    full_name: 'Antonio Luna',
                    student_id: '2026-A03',
                    email: 'antonio.a03@student.edu.ph',
                    role: 'scholar',
                    created_at: '2026-08-05T09:30:00+08:00'
                },
                {
                    id: '10000000-0000-0000-0000-000000000004',
                    full_name: 'Gabriela Silang',
                    student_id: '2026-A04',
                    email: 'gabriela.a04@student.edu.ph',
                    role: 'scholar',
                    created_at: '2026-08-05T09:45:00+08:00'
                },
                {
                    id: '10000000-0000-0000-0000-000000000005',
                    full_name: 'Jose Rizal',
                    student_id: '2026-A05',
                    email: 'jose.a05@student.edu.ph',
                    role: 'scholar',
                    created_at: '2026-08-05T10:00:00+08:00'
                },
                {
                    id: '10000000-0000-0000-0000-000000000006',
                    full_name: 'Melchora Aquino',
                    student_id: '2026-A06',
                    email: 'melchora.a06@student.edu.ph',
                    role: 'scholar',
                    created_at: '2026-08-05T10:15:00+08:00'
                }
            ],
            scholarship_programs: [
                {
                    id: '00000000-0000-0000-0001-000000000001',
                    program_name: 'Merit Scholar',
                    max_gwa: 1.75,
                    min_enrolled_units: 18,
                    max_failed_subjects: 0,
                    max_incomplete_subjects: 0,
                    max_dropped_subjects: 0,
                    evidence_required: 'Grade-document reference',
                    submission_deadline: '2026-10-30T17:00:00+08:00',
                    created_at: '2026-08-01T08:00:00+08:00',
                    updated_at: '2026-08-01T08:00:00+08:00'
                },
                {
                    id: '00000000-0000-0000-0001-000000000002',
                    program_name: 'Community Scholar',
                    max_gwa: 2.25,
                    min_enrolled_units: 15,
                    max_failed_subjects: 0,
                    max_incomplete_subjects: 0,
                    max_dropped_subjects: 1,
                    evidence_required: 'Grade-document reference',
                    submission_deadline: '2026-10-30T17:00:00+08:00',
                    created_at: '2026-08-01T08:00:00+08:00',
                    updated_at: '2026-08-01T08:00:00+08:00'
                }
            ],
            scholar_assignments: [
                {
                    id: '20000000-0000-0000-0000-000000000001',
                    scholar_id: '10000000-0000-0000-0000-000000000001',
                    scholarship_program_id: '00000000-0000-0000-0001-000000000001',
                    assigned_by: '00000000-0000-0000-0000-000000000001',
                    assigned_at: '2026-08-10T10:00:00+08:00',
                    assignment_status: 'Active'
                },
                {
                    id: '20000000-0000-0000-0000-000000000002',
                    scholar_id: '10000000-0000-0000-0000-000000000002',
                    scholarship_program_id: '00000000-0000-0000-0001-000000000001',
                    assigned_by: '00000000-0000-0000-0000-000000000001',
                    assigned_at: '2026-08-10T10:00:00+08:00',
                    assignment_status: 'Active'
                },
                {
                    id: '20000000-0000-0000-0000-000000000003',
                    scholar_id: '10000000-0000-0000-0000-000000000003',
                    scholarship_program_id: '00000000-0000-0000-0001-000000000002',
                    assigned_by: '00000000-0000-0000-0000-000000000001',
                    assigned_at: '2026-08-10T10:00:00+08:00',
                    assignment_status: 'Active'
                },
                {
                    id: '20000000-0000-0000-0000-000000000004',
                    scholar_id: '10000000-0000-0000-0000-000000000004',
                    scholarship_program_id: '00000000-0000-0000-0001-000000000002',
                    assigned_by: '00000000-0000-0000-0000-000000000001',
                    assigned_at: '2026-08-10T10:00:00+08:00',
                    assignment_status: 'Active'
                },
                {
                    id: '20000000-0000-0000-0000-000000000005',
                    scholar_id: '10000000-0000-0000-0000-000000000005',
                    scholarship_program_id: '00000000-0000-0000-0001-000000000001',
                    assigned_by: '00000000-0000-0000-0000-000000000001',
                    assigned_at: '2026-08-10T10:00:00+08:00',
                    assignment_status: 'Active'
                },
                {
                    id: '20000000-0000-0000-0000-000000000006',
                    scholar_id: '10000000-0000-0000-0000-000000000006',
                    scholarship_program_id: '00000000-0000-0000-0001-000000000002',
                    assigned_by: '00000000-0000-0000-0000-000000000001',
                    assigned_at: '2026-08-10T10:00:00+08:00',
                    assignment_status: 'Active'
                }
            ],
            semester_submissions: [
                {
                    id: '30000000-0000-0000-0000-000000000001',
                    scholar_id: '10000000-0000-0000-0000-000000000001',
                    academic_year: '2026-2027',
                    semester: 'Semester 1',
                    gwa: 1.75,
                    enrolled_units: 18,
                    failed_subjects: 0,
                    incomplete_subjects: 0,
                    dropped_subjects: 0,
                    evidence_reference: 'DOC-REG-2026-A01-OFFICIAL_GRADE_TRANSCRIPT.pdf',
                    submitted_at: '2026-10-30T17:00:00+08:00',
                    is_late: false,
                    verification_status: 'Verified',
                    compliance_status: 'Not Evaluated',
                    renewal_status: 'Pending',
                    created_at: '2026-10-30T17:00:00+08:00',
                    updated_at: '2026-10-30T17:00:00+08:00'
                },
                {
                    id: '30000000-0000-0000-0000-000000000002',
                    scholar_id: '10000000-0000-0000-0000-000000000002',
                    academic_year: '2026-2027',
                    semester: 'Semester 1',
                    gwa: 1.76,
                    enrolled_units: 18,
                    failed_subjects: 0,
                    incomplete_subjects: 0,
                    dropped_subjects: 0,
                    evidence_reference: 'DOC-REG-2026-A02-CERTIFIED_TRUE_COPY.pdf',
                    submitted_at: '2026-10-25T14:30:00+08:00',
                    is_late: false,
                    verification_status: 'Verified',
                    compliance_status: 'Not Evaluated',
                    renewal_status: 'Pending',
                    created_at: '2026-10-25T14:30:00+08:00',
                    updated_at: '2026-10-25T14:30:00+08:00'
                },
                {
                    id: '30000000-0000-0000-0000-000000000003',
                    scholar_id: '10000000-0000-0000-0000-000000000003',
                    academic_year: '2026-2027',
                    semester: 'Semester 1',
                    gwa: 2.25,
                    enrolled_units: 15,
                    failed_subjects: 0,
                    incomplete_subjects: 0,
                    dropped_subjects: 1,
                    evidence_reference: 'DOC-REG-2026-A03-PORTAL_GRADE_SLIP.pdf',
                    submitted_at: '2026-10-26T11:15:00+08:00',
                    is_late: false,
                    verification_status: 'Verified',
                    compliance_status: 'Not Evaluated',
                    renewal_status: 'Pending',
                    created_at: '2026-10-26T11:15:00+08:00',
                    updated_at: '2026-10-26T11:15:00+08:00'
                },
                {
                    id: '30000000-0000-0000-0000-000000000004',
                    scholar_id: '10000000-0000-0000-0000-000000000004',
                    academic_year: '2026-2027',
                    semester: 'Semester 1',
                    gwa: 2.25,
                    enrolled_units: 14,
                    failed_subjects: 0,
                    incomplete_subjects: 1,
                    dropped_subjects: 0,
                    evidence_reference: 'DOC-REG-2026-A04-OFFICIAL_GRADE_CARD.pdf',
                    submitted_at: '2026-10-27T09:45:00+08:00',
                    is_late: false,
                    verification_status: 'Verified',
                    compliance_status: 'Not Evaluated',
                    renewal_status: 'Pending',
                    created_at: '2026-10-27T09:45:00+08:00',
                    updated_at: '2026-10-27T09:45:00+08:00'
                },
                {
                    id: '30000000-0000-0000-0000-000000000005',
                    scholar_id: '10000000-0000-0000-0000-000000000005',
                    academic_year: '2026-2027',
                    semester: 'Semester 1',
                    gwa: 1.50,
                    enrolled_units: 18,
                    failed_subjects: 1,
                    incomplete_subjects: 0,
                    dropped_subjects: 0,
                    evidence_reference: 'DOC-REG-2026-A05-LATE_SUBMISSION_TRANSCRIPT.pdf',
                    submitted_at: '2026-10-30T17:01:00+08:00',
                    is_late: true,
                    verification_status: 'Verified',
                    compliance_status: 'Not Evaluated',
                    renewal_status: 'Pending',
                    created_at: '2026-10-30T17:01:00+08:00',
                    updated_at: '2026-10-30T17:01:00+08:00'
                },
                {
                    id: '30000000-0000-0000-0000-000000000006',
                    scholar_id: '10000000-0000-0000-0000-000000000006',
                    academic_year: '2026-2027',
                    semester: 'Semester 1',
                    gwa: 2.00,
                    enrolled_units: 15,
                    failed_subjects: 0,
                    incomplete_subjects: 0,
                    dropped_subjects: 0,
                    evidence_reference: 'DOC-REG-2026-A06-PENDING_REVIEW_DOCUMENT.pdf',
                    submitted_at: '2026-10-28T16:00:00+08:00',
                    is_late: false,
                    verification_status: 'Pending',
                    compliance_status: 'Not Evaluated',
                    renewal_status: 'Pending',
                    created_at: '2026-10-28T16:00:00+08:00',
                    updated_at: '2026-10-28T16:00:00+08:00'
                }
            ],
            verification_history: [
                {
                    id: '40000000-0000-0000-0000-000000000001',
                    submission_id: '30000000-0000-0000-0000-000000000001',
                    staff_id: '00000000-0000-0000-0000-000000000001',
                    action: 'Verified',
                    reason: 'Official registrar document confirmed and verified against portal records.',
                    created_at: '2026-10-30T17:15:00+08:00'
                },
                {
                    id: '40000000-0000-0000-0000-000000000002',
                    submission_id: '30000000-0000-0000-0000-000000000002',
                    staff_id: '00000000-0000-0000-0000-000000000001',
                    action: 'Verified',
                    reason: 'Document certified true copy verified.',
                    created_at: '2026-10-26T09:00:00+08:00'
                },
                {
                    id: '40000000-0000-0000-0000-000000000003',
                    submission_id: '30000000-0000-0000-0000-000000000003',
                    staff_id: '00000000-0000-0000-0000-000000000001',
                    action: 'Verified',
                    reason: 'Grade slip validated with registrar signature stamp.',
                    created_at: '2026-10-26T14:00:00+08:00'
                },
                {
                    id: '40000000-0000-0000-0000-000000000004',
                    submission_id: '30000000-0000-0000-0000-000000000004',
                    staff_id: '00000000-0000-0000-0000-000000000001',
                    action: 'Verified',
                    reason: 'Grade card verified accurately reflects student records.',
                    created_at: '2026-10-27T11:30:00+08:00'
                },
                {
                    id: '40000000-0000-0000-0000-000000000005',
                    submission_id: '30000000-0000-0000-0000-000000000005',
                    staff_id: '00000000-0000-0000-0000-000000000001',
                    action: 'Verified',
                    reason: 'Official late transcript verified.',
                    created_at: '2026-10-31T09:00:00+08:00'
                }
            ],
            compliance_evaluations: [],
            renewal_decisions: [],
            audit_logs: [
                {
                    id: '50000000-0000-0000-0000-000000000001',
                    actor_id: '00000000-0000-0000-0000-000000000001',
                    action_type: 'SYSTEM_SEED',
                    record_table: 'scholarship_programs',
                    record_id: '00000000-0000-0000-0001-000000000001',
                    details: { event: 'Initialized Merit and Community Scholar policy thresholds' },
                    timestamp: '2026-08-01T08:00:00+08:00'
                },
                {
                    id: '50000000-0000-0000-0000-000000000002',
                    actor_id: '00000000-0000-0000-0000-000000000001',
                    action_type: 'SYSTEM_SEED',
                    record_table: 'profiles',
                    record_id: '00000000-0000-0000-0000-000000000001',
                    details: { event: 'Created Staff and 6 synthetic scholar records A01-A06' },
                    timestamp: '2026-08-05T10:15:00+08:00'
                }
            ]
        };

        this.saveDB(seedData);
        return seedData;
    }

    getCurrentUser() {
        const sessionRaw = localStorage.getItem(this.SESSION_KEY);
        if (!sessionRaw) return null;
        try {
            return JSON.parse(sessionRaw);
        } catch (e) {
            return null;
        }
    }

    setCurrentUser(user) {
        if (!user) {
            localStorage.removeItem(this.SESSION_KEY);
        } else {
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
        }
    }
}

/**
 * Fluent Query Builder mimicking PostgREST
 */
class LocalQueryBuilder {
    constructor(engine, tableName) {
        this.engine = engine;
        this.tableName = tableName;
        this.filters = [];
        this.sortFields = [];
        this.limitCount = null;
        this.isSingle = false;
    }

    select(fields = '*') {
        this.selectedFields = fields;
        return this;
    }

    eq(column, value) {
        this.filters.push((row) => row[column] === value);
        return this;
    }

    neq(column, value) {
        this.filters.push((row) => row[column] !== value);
        return this;
    }

    in(column, values) {
        this.filters.push((row) => values.includes(row[column]));
        return this;
    }

    order(column, { ascending = true } = {}) {
        this.sortFields.push({ column, ascending });
        return this;
    }

    limit(count) {
        this.limitCount = count;
        return this;
    }

    single() {
        this.isSingle = true;
        return this;
    }

    async execute() {
        const db = this.engine.getDB();
        const table = db[this.tableName] || [];
        const currentUser = this.engine.getCurrentUser();

        // Simulate Row Level Security (RLS)
        let filtered = table.filter(row => {
            // Unauthenticated users cannot read private scholar data
            if (!currentUser && this.tableName !== 'scholarship_programs') {
                return false;
            }

            // Scholar isolation rules
            if (currentUser && currentUser.role === 'scholar') {
                if (this.tableName === 'profiles') {
                    return row.id === currentUser.id;
                }
                if (this.tableName === 'scholar_assignments') {
                    return row.scholar_id === currentUser.id;
                }
                if (this.tableName === 'semester_submissions') {
                    return row.scholar_id === currentUser.id;
                }
                if (this.tableName === 'verification_history' || this.tableName === 'compliance_evaluations' || this.tableName === 'renewal_decisions') {
                    const submissions = db['semester_submissions'] || [];
                    const sub = submissions.find(s => s.id === row.submission_id);
                    return sub && sub.scholar_id === currentUser.id;
                }
                if (this.tableName === 'audit_logs') {
                    return false; // scholars cannot view audit logs
                }
            }

            // Staff can read all tables
            return true;
        });

        // Apply explicit query filters
        for (const f of this.filters) {
            filtered = filtered.filter(f);
        }

        // Apply sorting
        if (this.sortFields.length > 0) {
            filtered.sort((a, b) => {
                for (const { column, ascending } of this.sortFields) {
                    const valA = a[column];
                    const valB = b[column];
                    if (valA < valB) return ascending ? -1 : 1;
                    if (valA > valB) return ascending ? 1 : -1;
                }
                return 0;
            });
        }

        if (this.limitCount !== null) {
            filtered = filtered.slice(0, this.limitCount);
        }

        if (this.isSingle) {
            if (filtered.length === 0) {
                return { data: null, error: { message: "JSON object requested, multiple (or no) rows returned" } };
            }
            return { data: JSON.parse(JSON.stringify(filtered[0])), error: null };
        }

        return { data: JSON.parse(JSON.stringify(filtered)), error: null };
    }

    then(onfulfilled, onrejected) {
        return this.execute().then(onfulfilled, onrejected);
    }

    // Insert operation
    async insert(records) {
        const db = this.engine.getDB();
        if (!db[this.tableName]) db[this.tableName] = [];
        const table = db[this.tableName];
        const currentUser = this.engine.getCurrentUser();

        const rowsToInsert = Array.isArray(records) ? records : [records];
        const insertedRows = [];

        for (const row of rowsToInsert) {
            const newRow = { ...row };
            if (!newRow.id) {
                newRow.id = 'gen-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            }

            // Enforce constraints on semester_submissions
            if (this.tableName === 'semester_submissions') {
                // RLS Check: Scholar can only insert for their own account
                if (currentUser && currentUser.role === 'scholar' && newRow.scholar_id !== currentUser.id) {
                    return { data: null, error: { message: "Row-level security violation: cannot submit for another user." } };
                }

                // Database unique constraint: (scholar_id, academic_year, semester)
                const exists = table.some(r => 
                    r.scholar_id === newRow.scholar_id && 
                    r.academic_year === newRow.academic_year && 
                    r.semester === newRow.semester
                );
                if (exists) {
                    return { 
                        data: null, 
                        error: { 
                            message: `duplicate key value violates unique constraint "uq_scholar_semester" for scholar ${newRow.scholar_id}, ${newRow.academic_year}, ${newRow.semester}` 
                        } 
                    };
                }

                // Check constraints
                if (newRow.gwa < 1.00 || newRow.gwa > 5.00) {
                    return { data: null, error: { message: "check constraint violation: gwa must be between 1.00 and 5.00." } };
                }
                if (newRow.enrolled_units < 0 || newRow.failed_subjects < 0 || newRow.incomplete_subjects < 0 || newRow.dropped_subjects < 0) {
                    return { data: null, error: { message: "check constraint violation: enrolled units and subject counts must be non-negative integers." } };
                }

                // Timezone deadline check
                const nowTime = new Date().getTime();
                newRow.submitted_at = newRow.submitted_at || new Date().toISOString();
                const submissionTime = new Date(newRow.submitted_at).getTime();
                
                // Compare with official deadline
                const deadlineTime = CONFIG.OFFICIAL_DEADLINE_MS;
                newRow.is_late = submissionTime > deadlineTime;

                // Force status separation and default pending
                newRow.verification_status = 'Pending';
                newRow.compliance_status = 'Not Evaluated';
                newRow.renewal_status = 'Pending';
                newRow.created_at = newRow.submitted_at;
                newRow.updated_at = newRow.submitted_at;
            }

            table.push(newRow);
            insertedRows.push(newRow);

            // Create automatic audit log
            if (this.tableName !== 'audit_logs') {
                db['audit_logs'].push({
                    id: 'gen-audit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                    actor_id: currentUser ? currentUser.id : null,
                    action_type: 'INSERT_' + this.tableName.toUpperCase(),
                    record_table: this.tableName,
                    record_id: newRow.id,
                    details: newRow,
                    timestamp: new Date().toISOString()
                });
            }
        }

        this.engine.saveDB(db);
        return { data: this.isSingle ? insertedRows[0] : insertedRows, error: null };
    }

    // Update operation
    async update(values) {
        const db = this.engine.getDB();
        const table = db[this.tableName] || [];
        const currentUser = this.engine.getCurrentUser();

        let targetRows = table.filter(row => {
            for (const f of this.filters) {
                if (!f(row)) return false;
            }
            return true;
        });

        if (targetRows.length === 0) {
            return { data: [], error: null };
        }

        // RLS Checks
        if (currentUser && currentUser.role === 'scholar') {
            if (this.tableName === 'semester_submissions') {
                for (const row of targetRows) {
                    if (row.scholar_id !== currentUser.id) {
                        return { data: null, error: { message: "RLS violation: cannot modify submissions of other scholars." } };
                    }
                    if (row.verification_status !== 'Returned') {
                        return { data: null, error: { message: "RLS violation: only Returned submissions can be updated by scholars." } };
                    }
                }
            }
        }

        for (const row of targetRows) {
            Object.assign(row, values);
            row.updated_at = new Date().toISOString();

            if (this.tableName !== 'audit_logs') {
                db['audit_logs'].push({
                    id: 'gen-audit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                    actor_id: currentUser ? currentUser.id : null,
                    action_type: 'UPDATE_' + this.tableName.toUpperCase(),
                    record_table: this.tableName,
                    record_id: row.id,
                    details: values,
                    timestamp: new Date().toISOString()
                });
            }
        }

        this.engine.saveDB(db);
        return { data: targetRows, error: null };
    }
}

/**
 * Universal Supabase Client Wrapper
 */
class SupabaseWrapper {
    constructor() {
        this.localEngine = new LocalDatabaseEngine();
        this.useRemote = false;
        this.supabaseClient = null;

        this.initClient();
    }

    initClient() {
        const url = CONFIG.DEFAULT_SUPABASE_URL;
        const key = CONFIG.DEFAULT_SUPABASE_ANON_KEY;

        if (url && key && window.supabase && typeof window.supabase.createClient === 'function') {
            try {
                this.supabaseClient = window.supabase.createClient(url, key);
                this.useRemote = true;
                console.log("[DataClient] Configured for Remote Supabase PostgreSQL.");
            } catch (e) {
                console.warn("[DataClient] Remote client failed to initialize, falling back to Local Database Engine:", e);
                this.useRemote = false;
            }
        } else {
            this.useRemote = false;
            console.log("[DataClient] Operating in Local Database Engine (Offline & Reliable Test Mode).");
        }
    }

    from(tableName) {
        if (this.useRemote && this.supabaseClient) {
            return this.supabaseClient.from(tableName);
        }
        return new LocalQueryBuilder(this.localEngine, tableName);
    }

    get auth() {
        if (this.useRemote && this.supabaseClient) {
            return this.supabaseClient.auth;
        }

        const self = this;
        return {
            async signInWithPassword({ email, password }) {
                const db = self.localEngine.getDB();
                const profile = db.profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
                if (!profile) {
                    return { data: { user: null, session: null }, error: { message: "Invalid login credentials." } };
                }

                const user = {
                    id: profile.id,
                    email: profile.email,
                    role: profile.role,
                    user_metadata: {
                        full_name: profile.full_name,
                        student_id: profile.student_id,
                        role: profile.role
                    }
                };
                self.localEngine.setCurrentUser(user);
                return { data: { user, session: { access_token: 'local-token-' + user.id, user } }, error: null };
            },

            async signOut() {
                self.localEngine.setCurrentUser(null);
                return { error: null };
            },

            async getUser() {
                const user = self.localEngine.getCurrentUser();
                return { data: { user }, error: null };
            },

            async getSession() {
                const user = self.localEngine.getCurrentUser();
                if (!user) return { data: { session: null }, error: null };
                return { data: { session: { access_token: 'local-token-' + user.id, user } }, error: null };
            }
        };
    }

    /**
     * Stored Procedures (RPCs)
     */
    async rpc(functionName, params = {}) {
        if (this.useRemote && this.supabaseClient) {
            return await this.supabaseClient.rpc(functionName, params);
        }

        // Local execution of stored procedures
        const db = this.localEngine.getDB();
        const currentUser = this.localEngine.getCurrentUser();

        // 1. resubmit_semester_submission
        if (functionName === 'resubmit_semester_submission') {
            const { p_submission_id, p_gwa, p_enrolled_units, p_failed_subjects, p_incomplete_subjects, p_dropped_subjects, p_evidence_reference } = params;
            const sub = db.semester_submissions.find(s => s.id === p_submission_id);
            if (!sub) return { data: null, error: { message: "Submission not found." } };
            
            if (currentUser && currentUser.role === 'scholar' && sub.scholar_id !== currentUser.id) {
                return { data: null, error: { message: "Access denied. You can only resubmit your own submissions." } };
            }
            if (sub.verification_status !== 'Returned') {
                return { data: null, error: { message: "Only submissions with Returned status can be resubmitted." } };
            }

            sub.gwa = p_gwa;
            sub.enrolled_units = p_enrolled_units;
            sub.failed_subjects = p_failed_subjects;
            sub.incomplete_subjects = p_incomplete_subjects;
            sub.dropped_subjects = p_dropped_subjects;
            sub.evidence_reference = p_evidence_reference.trim();
            sub.verification_status = 'Pending';
            sub.compliance_status = 'Not Evaluated';
            sub.renewal_status = 'Pending';
            sub.updated_at = new Date().toISOString();

            db.verification_history.push({
                id: 'gen-hist-' + Date.now(),
                submission_id: p_submission_id,
                staff_id: currentUser ? currentUser.id : null,
                action: 'Resubmitted',
                reason: 'Corrected by scholar and resubmitted for verification',
                created_at: new Date().toISOString()
            });

            db.audit_logs.push({
                id: 'gen-audit-' + Date.now(),
                actor_id: currentUser ? currentUser.id : null,
                action_type: 'RESUBMIT',
                record_table: 'semester_submissions',
                record_id: p_submission_id,
                details: { gwa: p_gwa, units: p_enrolled_units, evidence: p_evidence_reference },
                timestamp: new Date().toISOString()
            });

            this.localEngine.saveDB(db);
            return { data: { success: true, message: "Submission resubmitted successfully." }, error: null };
        }

        // 2. verify_submission
        if (functionName === 'verify_submission') {
            const { p_submission_id, p_action, p_reason } = params;
            if (!currentUser || currentUser.role !== 'staff') {
                return { data: null, error: { message: "Unauthorized: Only scholarship staff can verify submissions." } };
            }
            if (!['Verified', 'Returned'].includes(p_action)) {
                return { data: null, error: { message: "Action must be either Verified or Returned." } };
            }
            if (p_action === 'Returned' && (!p_reason || p_reason.trim() === '')) {
                return { data: null, error: { message: "A non-empty reason is strictly required when returning evidence for correction." } };
            }

            const sub = db.semester_submissions.find(s => s.id === p_submission_id);
            if (!sub) return { data: null, error: { message: "Submission not found." } };

            sub.verification_status = p_action;
            sub.updated_at = new Date().toISOString();

            db.verification_history.push({
                id: 'gen-hist-' + Date.now(),
                submission_id: p_submission_id,
                staff_id: currentUser.id,
                action: p_action,
                reason: p_reason ? p_reason.trim() : null,
                created_at: new Date().toISOString()
            });

            db.audit_logs.push({
                id: 'gen-audit-' + Date.now(),
                actor_id: currentUser.id,
                action_type: 'VERIFICATION_' + p_action.toUpperCase(),
                record_table: 'semester_submissions',
                record_id: p_submission_id,
                details: { action: p_action, reason: p_reason },
                timestamp: new Date().toISOString()
            });

            this.localEngine.saveDB(db);
            return { data: { success: true, status: p_action }, error: null };
        }

        // 3. evaluate_submission_compliance
        if (functionName === 'evaluate_submission_compliance') {
            const { p_submission_id } = params;
            if (!currentUser || currentUser.role !== 'staff') {
                return { data: null, error: { message: "Unauthorized: Only scholarship staff can evaluate compliance." } };
            }

            const sub = db.semester_submissions.find(s => s.id === p_submission_id);
            if (!sub) return { data: null, error: { message: "Submission not found." } };

            // Mandatory gate: Evidence status MUST be Verified
            if (sub.verification_status !== 'Verified') {
                return {
                    data: null,
                    error: {
                        message: `Evaluation blocked: Submission evidence status is "${sub.verification_status}". Final evaluation cannot proceed until evidence is verified.`
                    }
                };
            }

            // Get scholar's assigned program
            const assignment = db.scholar_assignments.find(a => a.scholar_id === sub.scholar_id && a.assignment_status === 'Active');
            if (!assignment) return { data: null, error: { message: "Active scholarship assignment not found." } };
            const program = db.scholarship_programs.find(p => p.id === assignment.scholarship_program_id);
            if (!program) return { data: null, error: { message: "Scholarship program policy not found." } };

            // Run the 7 Policy Checks
            const reasons = [];
            const checks = {};

            // Check 1: GWA
            const gwaPass = sub.gwa <= program.max_gwa;
            checks.gwa_check = { pass: gwaPass, value: sub.gwa, threshold: program.max_gwa };
            if (!gwaPass) {
                reasons.push(`GWA (${sub.gwa.toFixed(2)}) exceeds the maximum permitted ${program.max_gwa.toFixed(2)} for ${program.program_name}.`);
            }

            // Check 2: Enrolled units
            const unitsPass = sub.enrolled_units >= program.min_enrolled_units;
            checks.units_check = { pass: unitsPass, value: sub.enrolled_units, threshold: program.min_enrolled_units };
            if (!unitsPass) {
                reasons.push(`Enrolled units (${sub.enrolled_units}) are below the required ${program.min_enrolled_units} units.`);
            }

            // Check 3: Failed subjects
            const failedPass = sub.failed_subjects <= program.max_failed_subjects;
            checks.failed_check = { pass: failedPass, value: sub.failed_subjects, threshold: program.max_failed_subjects };
            if (!failedPass) {
                reasons.push(`One or more failed subjects (${sub.failed_subjects}) are not permitted (maximum ${program.max_failed_subjects}).`);
            }

            // Check 4: Incomplete subjects
            const incPass = sub.incomplete_subjects <= program.max_incomplete_subjects;
            checks.incomplete_check = { pass: incPass, value: sub.incomplete_subjects, threshold: program.max_incomplete_subjects };
            if (!incPass) {
                reasons.push(`Incomplete grades (${sub.incomplete_subjects}) exceed the permitted limit (maximum ${program.max_incomplete_subjects}).`);
            }

            // Check 5: Dropped subjects
            const dropPass = sub.dropped_subjects <= program.max_dropped_subjects;
            checks.dropped_check = { pass: dropPass, value: sub.dropped_subjects, threshold: program.max_dropped_subjects };
            if (!dropPass) {
                reasons.push(`Dropped subjects (${sub.dropped_subjects}) exceed the permitted limit (maximum ${program.max_dropped_subjects}).`);
            }

            // Check 6: Required evidence verified
            const evidencePass = (sub.verification_status === 'Verified' && !!sub.evidence_reference && sub.evidence_reference.trim().length > 0);
            checks.evidence_check = { pass: evidencePass, status: sub.verification_status };
            if (!evidencePass) {
                reasons.push("Required grade-document reference evidence is missing or unverified.");
            }

            // Check 7: Submitted on or before deadline
            const deadlinePass = !sub.is_late;
            checks.deadline_check = { pass: deadlinePass, is_late: sub.is_late, submitted_at: sub.submitted_at };
            if (!deadlinePass) {
                reasons.push("Submission was received after the deadline (late submission).");
            }

            const overall_result = (reasons.length === 0) ? 'Compliant' : 'With Deficiency';

            const evalRecord = {
                id: 'gen-eval-' + Date.now(),
                submission_id: p_submission_id,
                program_id: program.id,
                overall_result,
                policy_snapshot: { ...program },
                check_results: checks,
                deficiency_reasons: reasons,
                evaluator_id: currentUser.id,
                evaluated_at: new Date().toISOString()
            };

            db.compliance_evaluations.push(evalRecord);
            sub.compliance_status = overall_result;
            sub.updated_at = new Date().toISOString();

            db.audit_logs.push({
                id: 'gen-audit-' + Date.now(),
                actor_id: currentUser.id,
                action_type: 'COMPLIANCE_EVALUATION',
                record_table: 'semester_submissions',
                record_id: p_submission_id,
                details: { result: overall_result, deficiency_reasons: reasons },
                timestamp: new Date().toISOString()
            });

            this.localEngine.saveDB(db);
            return {
                data: {
                    success: true,
                    overall_result,
                    checks,
                    deficiency_reasons: reasons
                },
                error: null
            };
        }

        // 4. record_renewal_decision
        if (functionName === 'record_renewal_decision') {
            const { p_submission_id, p_decision, p_notes } = params;
            if (!currentUser || currentUser.role !== 'staff') {
                return { data: null, error: { message: "Unauthorized: Only scholarship staff can record renewal decisions." } };
            }
            if (!['Approved', 'Held'].includes(p_decision)) {
                return { data: null, error: { message: "Renewal decision must be either Approved or Held." } };
            }

            const sub = db.semester_submissions.find(s => s.id === p_submission_id);
            if (!sub) return { data: null, error: { message: "Submission not found." } };

            // Approval Rule Checks
            if (p_decision === 'Approved') {
                if (sub.verification_status !== 'Verified') {
                    return {
                        data: null,
                        error: { message: `Approval blocked: Submission evidence is "${sub.verification_status}", but must be Verified.` }
                    };
                }
                if (sub.compliance_status !== 'Compliant') {
                    return {
                        data: null,
                        error: { message: `Approval blocked: Compliance status is "${sub.compliance_status}". Only Compliant submissions can be approved.` }
                    };
                }
            }

            // Held Rule Check
            if (p_decision === 'Held' && (!p_notes || p_notes.trim() === '')) {
                return { data: null, error: { message: "A Held decision requires explanatory staff notes." } };
            }

            const renewalRecord = {
                id: 'gen-ren-' + Date.now(),
                submission_id: p_submission_id,
                decision: p_decision,
                notes: p_notes ? p_notes.trim() : null,
                staff_id: currentUser.id,
                decided_at: new Date().toISOString()
            };

            db.renewal_decisions.push(renewalRecord);
            sub.renewal_status = p_decision;
            sub.updated_at = new Date().toISOString();

            db.audit_logs.push({
                id: 'gen-audit-' + Date.now(),
                actor_id: currentUser.id,
                action_type: 'RENEWAL_' + p_decision.toUpperCase(),
                record_table: 'semester_submissions',
                record_id: p_submission_id,
                details: { decision: p_decision, notes: p_notes },
                timestamp: new Date().toISOString()
            });

            this.localEngine.saveDB(db);
            return { data: { success: true, decision: p_decision }, error: null };
        }

        return { data: null, error: { message: `Unknown RPC function: ${functionName}` } };
    }
}

// Global instance
window.dataClient = new SupabaseWrapper();
