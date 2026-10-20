/**
 * Student Scholarship Monitoring and Academic Compliance System
 * Staff Dashboard, Metrics, and Multi-Criteria Filtering
 */

const Dashboard = {
    async init() {
        const user = await window.AccessControl.guard(['staff']);
        if (!user) return;

        this.currentUser = user;
        this.allSubmissions = [];
        this.profileMap = new Map();
        this.programMap = new Map();
        this.assignmentMap = new Map();

        await this.loadAllData();
        this.bindFilters();
    },

    async loadAllData() {
        // Fetch profiles
        const { data: profiles } = await window.dataClient.from('profiles').select('*');
        (profiles || []).forEach(p => this.profileMap.set(p.id, p));

        // Fetch programs
        const { data: programs } = await window.dataClient.from('scholarship_programs').select('*');
        (programs || []).forEach(p => this.programMap.set(p.id, p));

        // Fetch assignments
        const { data: assignments } = await window.dataClient.from('scholar_assignments').select('*');
        (assignments || []).forEach(a => this.assignmentMap.set(a.scholar_id, a));

        // Fetch submissions
        const { data: submissions } = await window.dataClient
            .from('semester_submissions')
            .select('*')
            .order('submitted_at', { ascending: false });

        this.allSubmissions = submissions || [];

        this.updateMetricCounters();
        this.renderRecentActivities();
        this.renderFilteredSubmissions();
    },

    updateMetricCounters() {
        // 1. Total assigned scholars (active assignments)
        const totalScholars = Array.from(this.assignmentMap.values()).filter(a => a.assignment_status === 'Active').length;
        
        // 2. Pending verification count
        const pendingVer = this.allSubmissions.filter(s => s.verification_status === 'Pending').length;

        // 3. Compliant count
        const compliantCount = this.allSubmissions.filter(s => s.compliance_status === 'Compliant').length;

        // 4. With Deficiency count
        const deficiencyCount = this.allSubmissions.filter(s => s.compliance_status === 'With Deficiency').length;

        const elTotal = document.getElementById('stat-total-scholars');
        const elPending = document.getElementById('stat-pending-verification');
        const elCompliant = document.getElementById('stat-compliant-count');
        const elDeficiency = document.getElementById('stat-deficiency-count');

        if (elTotal) elTotal.innerText = totalScholars;
        if (elPending) elPending.innerText = pendingVer;
        if (elCompliant) elCompliant.innerText = compliantCount;
        if (elDeficiency) elDeficiency.innerText = deficiencyCount;
    },

    async renderRecentActivities() {
        // Recent Verifications
        const verContainer = document.getElementById('recent-verifications-list');
        if (verContainer) {
            const { data: verHistory } = await window.dataClient
                .from('verification_history')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (!verHistory || verHistory.length === 0) {
                verContainer.innerHTML = `<li class="text-muted text-sm py-2">No verification actions recorded yet.</li>`;
            } else {
                verContainer.innerHTML = verHistory.map(h => {
                    const sub = this.allSubmissions.find(s => s.id === h.submission_id);
                    const scholar = sub ? this.profileMap.get(sub.scholar_id) : null;
                    return `
                        <li class="activity-item">
                            <span class="activity-badge badge-${h.action === 'Verified' ? 'success' : 'warning'}">${h.action}</span>
                            <div class="activity-details">
                                <strong>${scholar ? scholar.full_name : 'Scholar'}</strong> - ${sub ? sub.academic_year : ''}
                                <span class="activity-time">${window.formatManilaDate(h.created_at)}</span>
                            </div>
                        </li>
                    `;
                }).join('');
            }
        }

        // Recent Renewal Decisions
        const renContainer = document.getElementById('recent-renewals-list');
        if (renContainer) {
            const { data: renewals } = await window.dataClient
                .from('renewal_decisions')
                .select('*')
                .order('decided_at', { ascending: false })
                .limit(5);

            if (!renewals || renewals.length === 0) {
                renContainer.innerHTML = `<li class="text-muted text-sm py-2">No renewal decisions recorded yet.</li>`;
            } else {
                renContainer.innerHTML = renewals.map(r => {
                    const sub = this.allSubmissions.find(s => s.id === r.submission_id);
                    const scholar = sub ? this.profileMap.get(sub.scholar_id) : null;
                    return `
                        <li class="activity-item">
                            <span class="activity-badge badge-${r.decision === 'Approved' ? 'success' : 'danger'}">${r.decision}</span>
                            <div class="activity-details">
                                <strong>${scholar ? scholar.full_name : 'Scholar'}</strong> (${scholar ? scholar.student_id : ''})
                                <span class="activity-time">${window.formatManilaDate(r.decided_at)}</span>
                            </div>
                        </li>
                    `;
                }).join('');
            }
        }
    },

    renderFilteredSubmissions() {
        const tbody = document.getElementById('submissions-table-body');
        if (!tbody) return;

        const searchVal = (document.getElementById('search-query')?.value || '').toLowerCase().trim();
        const progFilter = document.getElementById('filter-program')?.value || 'all';
        const semFilter = document.getElementById('filter-semester')?.value || 'all';
        const verFilter = document.getElementById('filter-verification')?.value || 'all';
        const compFilter = document.getElementById('filter-compliance')?.value || 'all';

        let filtered = this.allSubmissions.filter(sub => {
            const scholar = this.profileMap.get(sub.scholar_id);
            const assign = this.assignmentMap.get(sub.scholar_id);
            const prog = assign ? this.programMap.get(assign.scholarship_program_id) : null;

            // Search by Student ID or Name
            if (searchVal) {
                const name = (scholar?.full_name || '').toLowerCase();
                const id = (scholar?.student_id || '').toLowerCase();
                const email = (scholar?.email || '').toLowerCase();
                if (!name.includes(searchVal) && !id.includes(searchVal) && !email.includes(searchVal)) {
                    return false;
                }
            }

            // Program Filter
            if (progFilter !== 'all' && prog?.id !== progFilter) return false;

            // Semester Filter
            if (semFilter !== 'all' && sub.semester !== semFilter) return false;

            // Verification Filter
            if (verFilter !== 'all' && sub.verification_status !== verFilter) return false;

            // Compliance Filter
            if (compFilter !== 'all' && sub.compliance_status !== compFilter) return false;

            return true;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-5 empty-state">
                        <p class="text-muted">No scholar submissions match your current search or filter criteria.</p>
                        <button class="btn btn-outline btn-xs mt-2" onclick="Dashboard.resetFilters()">Reset All Filters</button>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtered.map(sub => {
            const scholar = this.profileMap.get(sub.scholar_id);
            const assign = this.assignmentMap.get(sub.scholar_id);
            const prog = assign ? this.programMap.get(assign.scholarship_program_id) : null;

            const vBadge = window.ScholarPortal.getVerificationBadge(sub.verification_status);
            const cBadge = window.ScholarPortal.getComplianceBadge(sub.compliance_status);
            const rBadge = window.ScholarPortal.getRenewalBadge(sub.renewal_status);

            return `
                <tr>
                    <td>
                        <strong>${scholar ? scholar.full_name : 'Unknown'}</strong><br>
                        <small class="text-muted">${scholar ? (scholar.student_id || scholar.email) : ''}</small>
                    </td>
                    <td><span class="program-badge">${prog ? prog.program_name : 'Scholarship'}</span></td>
                    <td>${sub.academic_year}<br><small class="text-muted">${sub.semester}</small></td>
                    <td><strong>${sub.gwa.toFixed(2)}</strong></td>
                    <td>${sub.enrolled_units} u.</td>
                    <td>${vBadge}</td>
                    <td>${cBadge}</td>
                    <td>${rBadge}</td>
                    <td>
                        <a href="submission-details.html?id=${sub.id}" class="btn btn-outline btn-xs">View Review</a>
                    </td>
                </tr>
            `;
        }).join('');
    },

    bindFilters() {
        ['search-query', 'filter-program', 'filter-semester', 'filter-verification', 'filter-compliance'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => this.renderFilteredSubmissions());
                el.addEventListener('change', () => this.renderFilteredSubmissions());
            }
        });
    },

    resetFilters() {
        if (document.getElementById('search-query')) document.getElementById('search-query').value = '';
        if (document.getElementById('filter-program')) document.getElementById('filter-program').value = 'all';
        if (document.getElementById('filter-semester')) document.getElementById('filter-semester').value = 'all';
        if (document.getElementById('filter-verification')) document.getElementById('filter-verification').value = 'all';
        if (document.getElementById('filter-compliance')) document.getElementById('filter-compliance').value = 'all';
        this.renderFilteredSubmissions();
    }
};

window.Dashboard = Dashboard;
