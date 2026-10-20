/**
 * Student Scholarship Monitoring and Academic Compliance System
 * Renewal Decision Workflow
 */

const Renewal = {
    async init() {
        const user = await window.AccessControl.guard(['staff']);
        if (!user) return;

        this.currentUser = user;
        await this.loadRenewalQueue();
        this.bindEvents();
    },

    async loadRenewalQueue() {
        const tbody = document.getElementById('renewal-table-body');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4">Loading renewal decision queue...</td></tr>`;

        const { data: submissions, error } = await window.dataClient
            .from('semester_submissions')
            .select('*')
            .order('submitted_at', { ascending: false });

        if (error || !submissions || submissions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 empty-state">No submissions found.</td></tr>`;
            return;
        }

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
            const cBadge = window.ScholarPortal.getComplianceBadge(sub.compliance_status);
            const rBadge = window.ScholarPortal.getRenewalBadge(sub.renewal_status);

            const canApprove = (sub.verification_status === 'Verified' && sub.compliance_status === 'Compliant');

            return `
                <tr>
                    <td>
                        <strong>${scholar ? scholar.full_name : 'Unknown'}</strong><br>
                        <small class="text-muted">${scholar ? (scholar.student_id || scholar.email) : ''}</small>
                    </td>
                    <td><span class="program-badge">${progName}</span></td>
                    <td>${sub.academic_year} - ${sub.semester}</td>
                    <td>${vBadge}</td>
                    <td>${cBadge}</td>
                    <td>${rBadge}</td>
                    <td>
                        <div class="btn-group-vertical">
                            ${canApprove ? `
                                <button class="btn btn-success btn-xs approve-btn" data-id="${sub.id}" data-scholar="${scholar ? scholar.full_name : ''}">Approve Renewal</button>
                            ` : `
                                <button class="btn btn-secondary btn-xs disabled" title="Cannot approve: Must be Verified and Compliant" onclick="alert('Approval Blocked: Submissions must be Verified and evaluated as Compliant before they can be approved for renewal.');">Approve (Blocked)</button>
                            `}
                            <button class="btn btn-warning btn-xs hold-btn mt-1" data-id="${sub.id}" data-scholar="${scholar ? scholar.full_name : ''}">Hold Renewal</button>
                            <a href="submission-details.html?id=${sub.id}" class="btn btn-outline btn-xs mt-1">Review Details</a>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        this.bindActionButtons();
    },

    bindActionButtons() {
        document.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const scholar = btn.getAttribute('data-scholar');
                this.promptApprove(id, scholar);
            });
        });

        document.querySelectorAll('.hold-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const scholar = btn.getAttribute('data-scholar');
                this.promptHold(id, scholar);
            });
        });
    },

    async promptApprove(submissionId, scholarName) {
        const notes = prompt(`Confirm Scholarship Renewal Approval for ${scholarName}.\n\nOptional staff notes:`, "All academic compliance criteria satisfied; renewal approved for succeeding semester.");
        if (notes === null) return;

        const { data, error } = await window.dataClient.rpc('record_renewal_decision', {
            p_submission_id: submissionId,
            p_decision: 'Approved',
            p_notes: notes
        });

        if (error) {
            alert("Approval failed: " + error.message);
        } else {
            alert(`Renewal successfully Approved for ${scholarName}!`);
            await this.loadRenewalQueue();
        }
    },

    promptHold(submissionId, scholarName) {
        const modal = document.getElementById('hold-modal');
        const modalScholarName = document.getElementById('modal-hold-scholar');
        const modalSubId = document.getElementById('modal-hold-id');
        const modalNotes = document.getElementById('modal-hold-notes');

        if (modal && modalSubId && modalNotes) {
            modalSubId.value = submissionId;
            if (modalScholarName) modalScholarName.innerText = scholarName;
            modalNotes.value = '';
            modal.classList.remove('hidden');
        } else {
            const notes = prompt(`Enter MANDATORY explanatory notes for placing ${scholarName}'s scholarship renewal on HOLD:`);
            if (notes === null) return;
            const val = window.Validation.validateRequiredText(notes, "Hold note");
            if (!val.valid) {
                alert(val.error);
                return;
            }
            this.executeHold(submissionId, val.value);
        }
    },

    async executeHold(submissionId, notes) {
        const val = window.Validation.validateRequiredText(notes, "Hold note");
        if (!val.valid) {
            alert(val.error);
            return;
        }

        const { data, error } = await window.dataClient.rpc('record_renewal_decision', {
            p_submission_id: submissionId,
            p_decision: 'Held',
            p_notes: val.value
        });

        if (error) {
            alert("Hold decision failed: " + error.message);
        } else {
            alert("Renewal decision recorded as HELD with explanatory staff notes.");
            const modal = document.getElementById('hold-modal');
            if (modal) modal.classList.add('hidden');
            await this.loadRenewalQueue();
        }
    },

    bindEvents() {
        const modal = document.getElementById('hold-modal');
        const closeBtn = document.getElementById('modal-hold-close');
        const cancelBtn = document.getElementById('modal-hold-cancel');
        const form = document.getElementById('modal-hold-form');

        if (closeBtn && modal) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
        if (cancelBtn && modal) cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const subId = document.getElementById('modal-hold-id').value;
                const notes = document.getElementById('modal-hold-notes').value;
                this.executeHold(subId, notes);
            });
        }
    }
};

window.Renewal = Renewal;
