/**
 * Student Scholarship Monitoring and Academic Compliance System
 * Scholar Dashboard & Portal Logic
 */

const ScholarPortal = {
    async init() {
        const user = await window.AccessControl.guard(['scholar']);
        if (!user) return;

        const submissions = await this.loadSubmissions(user);
        await this.loadScholarProfileAndAssignment(user, submissions[0] || null);
    },

    async loadScholarProfileAndAssignment(user, latestSubmission) {
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
            const variant = window.ProgramTheme.variantOf(program.program_name);
            programContainer.className = `program-card program-card--${variant} scholar-program`;
            programContainer.removeAttribute('style');
            programContainer.innerHTML = this.renderProgramDashboard(program, latestSubmission);
        }
    },

    /**
     * Themed program card with each requirement checked against the
     * scholar's latest submission (preview only; staff evaluation is official)
     */
    renderProgramDashboard(program, sub) {
        const { variantOf, styles, escapeHtml } = window.ProgramTheme;
        const style = styles[variantOf(program.program_name)];

        // Deadline countdown
        const deadlineMs = new Date(program.submission_deadline).getTime();
        const msLeft = deadlineMs - Date.now();
        const daysLeft = Math.ceil(msLeft / 86400000);
        const countdown = msLeft <= 0
            ? 'Submission closed'
            : daysLeft <= 1 ? 'Closes within 24 hours' : `${daysLeft} days left`;

        // Requirement rules: [label, requirement text, scholar value, passes?]
        const limitText = n => Number(n) === 0 ? 'None allowed' : `Max ${n}`;
        const rules = [
            ['Max GWA', Number(program.max_gwa).toFixed(2), sub && Number(sub.gwa).toFixed(2), sub && Number(sub.gwa) <= Number(program.max_gwa)],
            ['Min Units', `${program.min_enrolled_units} units`, sub && `${sub.enrolled_units} units`, sub && sub.enrolled_units >= program.min_enrolled_units],
            ['Failed Subjects', limitText(program.max_failed_subjects), sub && sub.failed_subjects, sub && sub.failed_subjects <= program.max_failed_subjects],
            ['Incomplete (INC)', limitText(program.max_incomplete_subjects), sub && sub.incomplete_subjects, sub && sub.incomplete_subjects <= program.max_incomplete_subjects],
            ['Dropped Subjects', limitText(program.max_dropped_subjects), sub && sub.dropped_subjects, sub && sub.dropped_subjects <= program.max_dropped_subjects],
            ['Evidence', escapeHtml(program.evidence_required), sub && (sub.evidence_reference ? 'Submitted' : 'Missing'), sub && !!sub.evidence_reference]
        ];

        const tiles = rules.map(([label, requirement, yours, pass]) => {
            const state = !sub ? 'neutral' : pass ? 'pass' : 'fail';
            const yoursRow = !sub ? '' : `
                <div class="req-tile__yours">
                    <span>Yours: <strong>${escapeHtml(yours)}</strong></span>
                    <span class="req-tile__mark">${pass ? '✓' : '✗'}</span>
                </div>`;
            return `
                <div class="req-tile req-tile--${state}">
                    <span class="req-tile__label">${label}</span>
                    <span class="req-tile__value">${requirement}</span>
                    ${yoursRow}
                </div>`;
        }).join('');

        const failed = sub ? rules.filter(r => !r[3]).length : 0;
        const summary = !sub
            ? `<div class="req-summary req-summary--neutral">No submission yet. Submit your semester academic summary to see how you meet each requirement.</div>`
            : `<div class="req-summary req-summary--${failed ? 'fail' : 'pass'}">
                    <strong>${failed ? `${failed} requirement${failed > 1 ? 's' : ''} not met` : 'All requirements met'}</strong>
                    based on your latest submission (${escapeHtml(sub.academic_year)}, ${escapeHtml(sub.semester)}).
                    This is a preview only. The official result comes from the Scholarship Office's compliance evaluation.
               </div>`;

        return `
            <header class="program-card__header scholar-program__header">
                <div class="program-card__icon" aria-hidden="true">${style.icon}</div>
                <div class="scholar-program__title">
                    <span class="program-card__eyebrow">Your Scholarship Program</span>
                    <h3 class="program-card__title">${escapeHtml(program.program_name)}</h3>
                    <span class="scholar-program__desc">${style.description}</span>
                </div>
                <div class="scholar-program__deadline">
                    <span class="program-card__eyebrow">AY ${escapeHtml(CONFIG.CURRENT_ACADEMIC_YEAR)} ${escapeHtml(CONFIG.CURRENT_SEMESTER)} Deadline</span>
                    <strong>${escapeHtml(window.formatManilaDate(program.submission_deadline))}</strong>
                    <span class="scholar-program__countdown">⏰ ${countdown}</span>
                </div>
            </header>
            <div class="program-card__body">
                <div class="req-grid">${tiles}</div>
                ${summary}
            </div>
        `;
    },

    async loadSubmissions(user) {
        const container = document.getElementById('submissions-table-body');
        if (!container) return [];

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
            return [];
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
        return submissions;
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
