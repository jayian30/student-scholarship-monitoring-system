/**
 * Student Scholarship Monitoring and Academic Compliance System
 * Academic Compliance Evaluation Engine
 */

const Compliance = {
    async init() {
        const user = await window.AccessControl.guard(['staff']);
        if (!user) return;

        this.currentUser = user;
        await this.loadSubmissionsForEvaluation();
        this.bindEvents();
    },

    async loadSubmissionsForEvaluation() {
        const tbody = document.getElementById('compliance-table-body');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4">Loading submissions for compliance evaluation...</td></tr>`;

        const { data: submissions, error } = await window.dataClient
            .from('semester_submissions')
            .select('*')
            .order('submitted_at', { ascending: false });

        if (error || !submissions || submissions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 empty-state">No submissions found.</td></tr>`;
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

            const isVerified = sub.verification_status === 'Verified';
            const cBadge = window.ScholarPortal.getComplianceBadge(sub.compliance_status);
            const vBadge = window.ScholarPortal.getVerificationBadge(sub.verification_status);

            return `
                <tr>
                    <td>
                        <strong>${scholar ? scholar.full_name : 'Unknown'}</strong><br>
                        <small class="text-muted">${scholar ? (scholar.student_id || scholar.email) : ''}</small>
                    </td>
                    <td><span class="program-badge">${progName}</span></td>
                    <td>${sub.academic_year} - ${sub.semester}</td>
                    <td><strong>${sub.gwa.toFixed(2)}</strong></td>
                    <td>${sub.enrolled_units} units</td>
                    <td>
                        <span class="text-xs">F: ${sub.failed_subjects} | INC: ${sub.incomplete_subjects} | D: ${sub.dropped_subjects}</span>
                    </td>
                    <td>${vBadge}</td>
                    <td>${cBadge}</td>
                    <td>
                        ${isVerified ? `
                            <button class="btn btn-primary btn-xs evaluate-btn" data-id="${sub.id}" data-scholar="${scholar ? scholar.full_name : ''}">Evaluate Compliance</button>
                        ` : `
                            <button class="btn btn-secondary btn-xs disabled" title="Evaluation strictly blocked: Evidence must be Verified first" onclick="alert('Evaluation Blocked: Evidence is ${sub.verification_status}. Submissions must be Verified by staff before compliance evaluation can proceed.');">Blocked (Unverified)</button>
                        `}
                        <a href="submission-details.html?id=${sub.id}" class="btn btn-outline btn-xs mt-1">Review</a>
                    </td>
                </tr>
            `;
        }).join('');

        this.bindActionButtons();
    },

    bindActionButtons() {
        document.querySelectorAll('.evaluate-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const scholar = btn.getAttribute('data-scholar');
                this.executeEvaluation(id, scholar);
            });
        });
    },

    async executeEvaluation(submissionId, scholarName) {
        const { data, error } = await window.dataClient.rpc('evaluate_submission_compliance', {
            p_submission_id: submissionId
        });

        if (error) {
            alert(`Compliance Evaluation Failed:\n\n${error.message}`);
            return;
        }

        const checks = data.checks;
        const reasons = data.deficiency_reasons || [];
        const result = data.overall_result;

        // Render evaluation modal or alert with 7 check breakdown
        this.showEvaluationResultModal(scholarName, result, checks, reasons);
        await this.loadSubmissionsForEvaluation();
    },

    showEvaluationResultModal(scholarName, overallResult, checks, reasons) {
        const modal = document.getElementById('eval-result-modal');
        const modalBody = document.getElementById('eval-result-content');
        if (!modal || !modalBody) {
            // Fallback alert
            alert(`Evaluation Result for ${scholarName}: ${overallResult}\n\nDeficiencies: ${reasons.length > 0 ? reasons.join('\n- ') : 'None. All criteria passed.'}`);
            return;
        }

        const badgeClass = overallResult === 'Compliant' ? 'badge-success' : 'badge-danger';

        modalBody.innerHTML = `
            <div class="eval-summary-header">
                <h4>Evaluation Result for <strong>${scholarName}</strong></h4>
                <span class="badge ${badgeClass} text-lg">${overallResult}</span>
            </div>
            <p class="text-sm text-muted mt-1">Evaluated against active scholarship program thresholds. Detailed 7-point policy check breakdown below:</p>

            <table class="table table-bordered mt-3">
                <thead>
                    <tr>
                        <th>Policy Check</th>
                        <th>Observed Value</th>
                        <th>Threshold</th>
                        <th>Result</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>1. General Weighted Average (GWA)</td>
                        <td>${checks.gwa_check.value.toFixed(2)}</td>
                        <td>&le; ${checks.gwa_check.threshold.toFixed(2)}</td>
                        <td>${checks.gwa_check.pass ? '<span class="badge badge-success">Passed</span>' : '<span class="badge badge-danger">Failed</span>'}</td>
                    </tr>
                    <tr>
                        <td>2. Enrolled Units</td>
                        <td>${checks.units_check.value} units</td>
                        <td>&ge; ${checks.units_check.threshold} units</td>
                        <td>${checks.units_check.pass ? '<span class="badge badge-success">Passed</span>' : '<span class="badge badge-danger">Failed</span>'}</td>
                    </tr>
                    <tr>
                        <td>3. Failed Subjects</td>
                        <td>${checks.failed_check.value}</td>
                        <td>&le; ${checks.failed_check.threshold}</td>
                        <td>${checks.failed_check.pass ? '<span class="badge badge-success">Passed</span>' : '<span class="badge badge-danger">Failed</span>'}</td>
                    </tr>
                    <tr>
                        <td>4. Incomplete Grades</td>
                        <td>${checks.incomplete_check.value}</td>
                        <td>&le; ${checks.incomplete_check.threshold}</td>
                        <td>${checks.incomplete_check.pass ? '<span class="badge badge-success">Passed</span>' : '<span class="badge badge-danger">Failed</span>'}</td>
                    </tr>
                    <tr>
                        <td>5. Dropped Subjects</td>
                        <td>${checks.dropped_check.value}</td>
                        <td>&le; ${checks.dropped_check.threshold}</td>
                        <td>${checks.dropped_check.pass ? '<span class="badge badge-success">Passed</span>' : '<span class="badge badge-danger">Failed</span>'}</td>
                    </tr>
                    <tr>
                        <td>6. Evidence Verification</td>
                        <td>${checks.evidence_check.status}</td>
                        <td>Verified</td>
                        <td>${checks.evidence_check.pass ? '<span class="badge badge-success">Passed</span>' : '<span class="badge badge-danger">Failed</span>'}</td>
                    </tr>
                    <tr>
                        <td>7. Submission Deadline</td>
                        <td>${checks.deadline_check.is_late ? 'Late Submission' : 'On-Time'}</td>
                        <td>On or before deadline</td>
                        <td>${checks.deadline_check.pass ? '<span class="badge badge-success">Passed</span>' : '<span class="badge badge-danger">Late</span>'}</td>
                    </tr>
                </tbody>
            </table>

            ${reasons.length > 0 ? `
                <div class="alert alert-danger mt-3">
                    <strong>Recorded Deficiency Reasons:</strong>
                    <ul>
                        ${reasons.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>
            ` : `
                <div class="alert alert-success mt-3">
                    <strong>All Criteria Met:</strong> The scholar is fully compliant with all program regulations.
                </div>
            `}
        `;

        modal.classList.remove('hidden');
    },

    bindEvents() {
        const modal = document.getElementById('eval-result-modal');
        const closeBtn = document.getElementById('eval-modal-close-btn');
        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
        }
    }
};

window.Compliance = Compliance;
