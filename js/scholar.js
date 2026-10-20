/**
 * Student Scholarship Monitoring and Academic Compliance System
 * Scholar Dashboard & Portal Logic
 */

const ScholarPortal = {
    async init() {
        const user = await window.AccessControl.guard(['scholar']);
        if (!user) return;

        await this.loadScholarProfileAndAssignment(user);
        await this.loadSubmissions(user);
    },

    async loadScholarProfileAndAssignment(user) {
        // Load assigned scholarship program
        const { data: assignments, error } = await window.dataClient
            .from('scholar_assignments')
            .select('*')
            .eq('scholar_id', user.id)
            .eq('assignment_status', 'Active');

        const programContainer = document.getElementById('assigned-program-card');
        if (!programContainer) return;

        if (error || !assignments || assignments.length === 0) {
            programContainer.innerHTML = `
                <div class="alert alert-warning">
                    <strong>No Active Scholarship Program:</strong> You currently have no active scholarship program assigned. Please contact the Scholarship Office.
                </div>
            `;
            return;
        }

        const assignment = assignments[0];
        const { data: program } = await window.dataClient
            .from('scholarship_programs')
            .select('*')
            .eq('id', assignment.scholarship_program_id)
            .single();

        if (program) {
            window.currentScholarProgram = program;
            programContainer.innerHTML = `
                <div class="program-header">
                    <div class="program-title-area">
                        <span class="program-badge">${program.program_name}</span>
                        <h3>Academic Requirements & Compliance Rules</h3>
                    </div>
                    <div class="deadline-pill">
                        <span class="deadline-label">AY 2026-2027 Sem 1 Deadline:</span>
                        <span class="deadline-val">${window.formatManilaDate(program.submission_deadline)}</span>
                    </div>
                </div>
                <div class="policy-grid">
                    <div class="policy-item">
                        <span class="policy-label">Max Permitted GWA</span>
                        <span class="policy-val">${program.max_gwa.toFixed(2)}</span>
                    </div>
                    <div class="policy-item">
                        <span class="policy-label">Min Enrolled Units</span>
                        <span class="policy-val">${program.min_enrolled_units} units</span>
                    </div>
                    <div class="policy-item">
                        <span class="policy-label">Max Failed Subjects</span>
                        <span class="policy-val">${program.max_failed_subjects}</span>
                    </div>
                    <div class="policy-item">
                        <span class="policy-label">Max Incomplete Grades</span>
                        <span class="policy-val">${program.max_incomplete_subjects}</span>
                    </div>
                    <div class="policy-item">
                        <span class="policy-label">Max Dropped Subjects</span>
                        <span class="policy-val">${program.max_dropped_subjects}</span>
                    </div>
                    <div class="policy-item">
                        <span class="policy-label">Required Evidence</span>
                        <span class="policy-val">${program.evidence_required}</span>
                    </div>
                </div>
            `;
        }
    },

    async loadSubmissions(user) {
        const container = document.getElementById('submissions-table-body');
        if (!container) return;

        container.innerHTML = `<tr><td colspan="8" class="text-center py-4">Loading submissions...</td></tr>`;

        const { data: submissions, error } = await window.dataClient
            .from('semester_submissions')
            .select('*')
            .eq('scholar_id', user.id)
            .order('submitted_at', { ascending: false });

        if (error || !submissions || submissions.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4 empty-state">
                        <p>No semester submissions found.</p>
                        <a href="submit-grades.html" class="btn btn-primary btn-sm mt-2">Submit Semester Academic Summary</a>
                    </td>
                </tr>
            `;
            return;
        }

        container.innerHTML = submissions.map(sub => {
            const vBadge = this.getVerificationBadge(sub.verification_status);
            const cBadge = this.getComplianceBadge(sub.compliance_status);
            const rBadge = this.getRenewalBadge(sub.renewal_status);
            const lateBadge = sub.is_late ? `<span class="badge badge-danger">Late</span>` : `<span class="badge badge-success">On-Time</span>`;

            return `
                <tr>
                    <td><strong>${sub.academic_year}</strong><br><small class="text-muted">${sub.semester}</small></td>
                    <td><strong>${sub.gwa.toFixed(2)}</strong></td>
                    <td>${sub.enrolled_units}</td>
                    <td>
                        <span class="text-xs">F: ${sub.failed_subjects} | INC: ${sub.incomplete_subjects} | D: ${sub.dropped_subjects}</span>
                    </td>
                    <td>
                        <span class="text-xs block">${window.formatManilaDate(sub.submitted_at)}</span>
                        ${lateBadge}
                    </td>
                    <td>${vBadge}</td>
                    <td>${cBadge}</td>
                    <td>${rBadge}</td>
                    <td>
                        <a href="submission-details.html?id=${sub.id}" class="btn btn-outline btn-xs">View Details</a>
                        ${sub.verification_status === 'Returned' ? `<a href="submission-details.html?id=${sub.id}#resubmit" class="btn btn-warning btn-xs mt-1">Correct & Resubmit</a>` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    },

    getVerificationBadge(status) {
        switch (status) {
            case 'Verified': return `<span class="badge badge-success">Verified</span>`;
            case 'Returned': return `<span class="badge badge-warning">Returned for Correction</span>`;
            default: return `<span class="badge badge-secondary">Pending Verification</span>`;
        }
    },

    getComplianceBadge(status) {
        switch (status) {
            case 'Compliant': return `<span class="badge badge-success">Compliant</span>`;
            case 'With Deficiency': return `<span class="badge badge-danger">With Deficiency</span>`;
            default: return `<span class="badge badge-neutral">Not Evaluated</span>`;
        }
    },

    getRenewalBadge(status) {
        switch (status) {
            case 'Approved': return `<span class="badge badge-success">Approved</span>`;
            case 'Held': return `<span class="badge badge-danger">Held</span>`;
            default: return `<span class="badge badge-secondary">Pending Decision</span>`;
        }
    }
};

window.ScholarPortal = ScholarPortal;
