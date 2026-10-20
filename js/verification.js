/**
 * Student Scholarship Monitoring and Academic Compliance System
 * Staff Verification Workflow
 */

const Verification = {
    async init() {
        const user = await window.AccessControl.guard(['staff']);
        if (!user) return;

        this.currentUser = user;
        await this.loadQueue();
        this.bindEvents();
    },

    async loadQueue(filterStatus = 'all') {
        const tbody = document.getElementById('verification-table-body');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4">Loading verification queue...</td></tr>`;

        // Load submissions
        let query = window.dataClient
            .from('semester_submissions')
            .select('*')
            .order('submitted_at', { ascending: false });

        if (filterStatus !== 'all') {
            query = query.eq('verification_status', filterStatus);
        }

        const { data: submissions, error } = await query;
        if (error || !submissions || submissions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 empty-state">No submissions found matching criteria.</td></tr>`;
            return;
        }

        // Fetch profiles & programs for rich display
        const { data: profiles } = await window.dataClient.from('profiles').select('*');
        const { data: assignments } = await window.dataClient.from('scholar_assignments').select('*');
        const { data: programs } = await window.dataClient.from('scholarship_programs').select('*');

        const profileMap = new Map((profiles || []).map(p => [p.id, p]));
        const progMap = new Map((programs || []).map(p => [p.id, p]));
        const assignMap = new Map((assignments || []).map(a => [a.scholar_id, a]));

        tbody.innerHTML = submissions.map(sub => {
            const scholar = profileMap.get(sub.scholar_id);
            const assign = assignMap.get(sub.scholar_id);
            const prog = assign ? progMap.get(assign.scholarship_program_id) : null;
            const progName = prog ? prog.program_name : 'Scholarship';

            const vBadge = window.ScholarPortal.getVerificationBadge(sub.verification_status);
            const lateBadge = sub.is_late ? `<span class="badge badge-danger">Late</span>` : `<span class="badge badge-success">On-Time</span>`;

            return `
                <tr>
                    <td>
                        <strong>${scholar ? scholar.full_name : 'Unknown'}</strong><br>
                        <small class="text-muted">${scholar ? (scholar.student_id || scholar.email) : ''}</small>
                    </td>
                    <td><span class="program-badge">${progName}</span></td>
                    <td>${sub.academic_year}<br><small class="text-muted">${sub.semester}</small></td>
                    <td><strong>${sub.gwa.toFixed(2)}</strong> (${sub.enrolled_units} u.)</td>
                    <td>
                        <span class="text-xs">F: ${sub.failed_subjects} | INC: ${sub.incomplete_subjects} | D: ${sub.dropped_subjects}</span>
                    </td>
                    <td>
                        <div class="evidence-preview" title="${sub.evidence_reference}">
                            <code>${sub.evidence_reference}</code>
                        </div>
                    </td>
                    <td>
                        <span class="text-xs block">${window.formatManilaDate(sub.submitted_at)}</span>
                        ${lateBadge}
                    </td>
                    <td>${vBadge}</td>
                    <td>
                        <div class="btn-group-vertical">
                            ${sub.verification_status !== 'Verified' ? `
                                <button class="btn btn-success btn-xs verify-btn" data-id="${sub.id}" data-scholar="${scholar ? scholar.full_name : ''}">Verify</button>
                            ` : `<span class="text-xs text-success">&#10003; Verified</span>`}
                            ${sub.verification_status !== 'Returned' ? `
                                <button class="btn btn-warning btn-xs return-btn mt-1" data-id="${sub.id}" data-scholar="${scholar ? scholar.full_name : ''}">Return</button>
                            ` : `<span class="text-xs text-warning">&#9888; Returned</span>`}
                            <a href="submission-details.html?id=${sub.id}" class="btn btn-outline btn-xs mt-1">Details</a>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        this.bindActionButtons();
    },

    bindActionButtons() {
        document.querySelectorAll('.verify-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const scholar = btn.getAttribute('data-scholar');
                this.promptVerify(id, scholar);
            });
        });

        document.querySelectorAll('.return-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const scholar = btn.getAttribute('data-scholar');
                this.promptReturn(id, scholar);
            });
        });
    },

    async promptVerify(id, scholar) {
        if (!confirm(`Confirm Verification for scholar: ${scholar}?\n\nThis will mark evidence as verified and substantiate official grades.`)) {
            return;
        }

        const { data, error } = await window.dataClient.rpc('verify_submission', {
            p_submission_id: id,
            p_action: 'Verified',
            p_reason: 'Official registrar document confirmed and verified against portal records.'
        });

        if (error) {
            alert("Verification failed: " + error.message);
        } else {
            alert(`Evidence successfully verified for ${scholar}!`);
            const filter = document.getElementById('verification-filter') ? document.getElementById('verification-filter').value : 'all';
            this.loadQueue(filter);
        }
    },

    promptReturn(id, scholar) {
        const modal = document.getElementById('return-modal');
        const modalScholarName = document.getElementById('modal-scholar-name');
        const modalSubId = document.getElementById('modal-sub-id');
        const modalReason = document.getElementById('modal-return-reason');

        if (modal && modalSubId && modalReason) {
            modalSubId.value = id;
            if (modalScholarName) modalScholarName.innerText = scholar;
            modalReason.value = '';
            modal.classList.remove('hidden');
        } else {
            // Fallback prompt
            const reason = prompt(`Enter mandatory reason for returning ${scholar}'s evidence for correction:`);
            if (reason === null) return;
            const val = window.Validation.validateRequiredText(reason, "Return reason");
            if (!val.valid) {
                alert(val.error);
                return;
            }
            this.executeReturn(id, val.value);
        }
    },

    async executeReturn(submissionId, reason) {
        const val = window.Validation.validateRequiredText(reason, "Return reason");
        if (!val.valid) {
            alert(val.error);
            return;
        }

        const { data, error } = await window.dataClient.rpc('verify_submission', {
            p_submission_id: submissionId,
            p_action: 'Returned',
            p_reason: val.value
        });

        if (error) {
            alert("Return action failed: " + error.message);
        } else {
            alert("Submission successfully returned for correction with documented instructions.");
            const modal = document.getElementById('return-modal');
            if (modal) modal.classList.add('hidden');
            const filter = document.getElementById('verification-filter') ? document.getElementById('verification-filter').value : 'all';
            this.loadQueue(filter);
        }
    },

    bindEvents() {
        const filterSelect = document.getElementById('verification-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.loadQueue(e.target.value);
            });
        }

        const modalClose = document.getElementById('modal-close-btn');
        const modalCancel = document.getElementById('modal-cancel-btn');
        const modal = document.getElementById('return-modal');
        const returnForm = document.getElementById('modal-return-form');

        if (modalClose && modal) modalClose.addEventListener('click', () => modal.classList.add('hidden'));
        if (modalCancel && modal) modalCancel.addEventListener('click', () => modal.classList.add('hidden'));

        if (returnForm) {
            returnForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const subId = document.getElementById('modal-sub-id').value;
                const reason = document.getElementById('modal-return-reason').value;
                this.executeReturn(subId, reason);
            });
        }
    }
};

window.Verification = Verification;
