/**
 * Student Scholarship Monitoring and Academic Compliance System
 * Grade Submissions, Detail View, and Resubmission Workflows
 */

const Submissions = {
    /**
     * Initialize Submit Grades Page
     */
    async initSubmissionForm() {
        const user = await window.AccessControl.guard(['scholar']);
        if (!user) return;

        // Load scholar program assignment
        const { data: assignments } = await window.dataClient
            .from('scholar_assignments')
            .select('*')
            .eq('scholar_id', user.id)
            .eq('assignment_status', 'Active');

        if (!assignments || assignments.length === 0) {
            alert("You do not have an active scholarship program assignment. You cannot submit grades at this time.");
            window.location.href = "scholar-dashboard.html";
            return;
        }

        const { data: program } = await window.dataClient
            .from('scholarship_programs')
            .select('*')
            .eq('id', assignments[0].scholarship_program_id)
            .single();

        const banner = document.getElementById('submission-program-banner');
        if (banner && program) {
            banner.innerHTML = `
                <div class="banner-content">
                    <div>
                        <span class="program-badge">${program.program_name}</span>
                        <h4>Official Submission Portal & Academic Guidelines</h4>
                        <p class="text-sm">Requirements: Max GWA <strong>${program.max_gwa.toFixed(2)}</strong> | Min Units: <strong>${program.min_enrolled_units}</strong> | Max Failed: <strong>${program.max_failed_subjects}</strong> | Max Incomplete: <strong>${program.max_incomplete_subjects}</strong> | Max Dropped: <strong>${program.max_dropped_subjects}</strong></p>
                    </div>
                    <div class="deadline-highlight">
                        <strong>Official Manila Deadline:</strong><br>
                        ${window.formatManilaDate(program.submission_deadline)}
                    </div>
                </div>
            `;
        }

        const form = document.getElementById('grade-submission-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmissionSubmit(e, user, program));
        }
    },

    /**
     * Handle Grade Submission Form Submission
     */
    async handleSubmissionSubmit(e, user, program) {
        e.preventDefault();

        const errorBox = document.getElementById('form-error-alert');
        const successBox = document.getElementById('form-success-alert');
        if (errorBox) errorBox.classList.add('hidden');
        if (successBox) successBox.classList.add('hidden');

        // Extract values
        const ay = document.getElementById('academic-year').value;
        const semester = document.getElementById('semester').value;
        const gwaInput = document.getElementById('gwa').value;
        const unitsInput = document.getElementById('enrolled-units').value;
        const failedInput = document.getElementById('failed-subjects').value;
        const incInput = document.getElementById('incomplete-subjects').value;
        const dropInput = document.getElementById('dropped-subjects').value;
        const evidenceInput = document.getElementById('evidence-reference').value;

        // Perform strict validation
        const valAY = window.Validation.validateAcademicYear(ay);
        if (!valAY.valid) return this.showError(valAY.error);

        const valSem = window.Validation.validateSemester(semester);
        if (!valSem.valid) return this.showError(valSem.error);

        const valGWA = window.Validation.validateGWA(gwaInput);
        if (!valGWA.valid) return this.showError(valGWA.error);

        const valUnits = window.Validation.validateEnrolledUnits(unitsInput);
        if (!valUnits.valid) return this.showError(valUnits.error);

        const valFailed = window.Validation.validateSubjectCount(failedInput, "Failed subjects");
        if (!valFailed.valid) return this.showError(valFailed.error);

        const valInc = window.Validation.validateSubjectCount(incInput, "Incomplete grades");
        if (!valInc.valid) return this.showError(valInc.error);

        const valDrop = window.Validation.validateSubjectCount(dropInput, "Dropped subjects");
        if (!valDrop.valid) return this.showError(valDrop.error);

        const valEvidence = window.Validation.validateEvidenceReference(evidenceInput);
        if (!valEvidence.valid) return this.showError(valEvidence.error);

        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = "Submitting Academic Summary...";
        }

        try {
            // Determine if late based on official deadline in Asia/Manila
            const nowIso = new Date().toISOString();
            const isLate = new Date(nowIso).getTime() > new Date(program.submission_deadline).getTime();

            const newRecord = {
                scholar_id: user.id,
                academic_year: valAY.value,
                semester: valSem.value,
                gwa: valGWA.value,
                enrolled_units: valUnits.value,
                failed_subjects: valFailed.value,
                incomplete_subjects: valInc.value,
                dropped_subjects: valDrop.value,
                evidence_reference: valEvidence.value,
                submitted_at: nowIso,
                is_late: isLate,
                verification_status: 'Pending',
                compliance_status: 'Not Evaluated',
                renewal_status: 'Pending'
            };

            const { data, error } = await window.dataClient
                .from('semester_submissions')
                .insert([newRecord]);

            if (error) {
                if (error.message && error.message.includes('unique constraint') || error.message.includes('uq_scholar_semester')) {
                    this.showError(`A submission for ${valAY.value}, ${valSem.value} already exists for your account. Duplicate semester submissions are rejected.`);
                } else {
                    this.showError(error.message || "Failed to submit academic summary.");
                }
                return;
            }

            // Success feedback
            if (successBox) {
                successBox.innerHTML = `
                    <h4>Submission Successful!</h4>
                    <p>Your academic summary for <strong>${valAY.value} - ${valSem.value}</strong> has been securely submitted with <strong>Pending</strong> verification status.</p>
                    <p class="text-sm">Submission Timestamp: ${window.formatManilaDate(nowIso)} ${isLate ? '<span class="badge badge-danger">Late Submission</span>' : '<span class="badge badge-success">On-Time</span>'}</p>
                    <div class="mt-3">
                        <a href="scholar-dashboard.html" class="btn btn-primary btn-sm">Return to Scholar Dashboard</a>
                    </div>
                `;
                successBox.classList.remove('hidden');
                form.reset();
            }
        } catch (err) {
            this.showError(err.message || "An unexpected error occurred.");
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = "Submit Academic Summary";
            }
        }
    },

    showError(msg) {
        const errorBox = document.getElementById('form-error-alert');
        if (errorBox) {
            errorBox.innerText = msg;
            errorBox.classList.remove('hidden');
            errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            alert(msg);
        }
    },

    /**
     * Initialize Submission Details Page
     */
    async initSubmissionDetails() {
        const user = await window.AccessControl.guard(['scholar', 'staff']);
        if (!user) return;

        const urlParams = new URLSearchParams(window.location.search);
        const submissionId = urlParams.get('id');

        if (!submissionId) {
            alert("No submission ID specified.");
            window.location.href = user.role === 'staff' ? 'staff-dashboard.html' : 'scholar-dashboard.html';
            return;
        }

        await this.loadSubmissionDetails(submissionId, user);
    },

    async loadSubmissionDetails(submissionId, user) {
        // Fetch submission
        const { data: submission, error } = await window.dataClient
            .from('semester_submissions')
            .select('*')
            .eq('id', submissionId)
            .single();

        if (error || !submission) {
            alert("Submission not found or unauthorized access.");
            window.location.href = user.role === 'staff' ? 'staff-dashboard.html' : 'scholar-dashboard.html';
            return;
        }

        // RLS check for Scholar role
        if (user.role === 'scholar' && submission.scholar_id !== user.id) {
            alert("Security Violation: You are not authorized to view another scholar's submission.");
            window.location.href = "scholar-dashboard.html";
            return;
        }

        // Load scholar profile
        const { data: scholarProfile } = await window.dataClient
            .from('profiles')
            .select('*')
            .eq('id', submission.scholar_id)
            .single();

        // Load scholar assignment & program
        const { data: assignments } = await window.dataClient
            .from('scholar_assignments')
            .select('*')
            .eq('scholar_id', submission.scholar_id)
            .eq('assignment_status', 'Active');

        let program = null;
        if (assignments && assignments.length > 0) {
            const { data: prog } = await window.dataClient
                .from('scholarship_programs')
                .select('*')
                .eq('id', assignments[0].scholarship_program_id)
                .single();
            program = prog;
        }

        // Fetch verification history
        const { data: verHistory } = await window.dataClient
            .from('verification_history')
            .select('*')
            .eq('submission_id', submissionId)
            .order('created_at', { ascending: false });

        // Fetch compliance evaluations
        const { data: evaluations } = await window.dataClient
            .from('compliance_evaluations')
            .select('*')
            .eq('submission_id', submissionId)
            .order('evaluated_at', { ascending: false });

        // Fetch renewal decisions
        const { data: renewals } = await window.dataClient
            .from('renewal_decisions')
            .select('*')
            .eq('submission_id', submissionId)
            .order('decided_at', { ascending: false });

        this.renderDetailsView({
            submission,
            scholarProfile,
            program,
            verHistory: verHistory || [],
            evaluations: evaluations || [],
            renewals: renewals || [],
            currentUser: user
        });
    },

    renderDetailsView({ submission, scholarProfile, program, verHistory, evaluations, renewals, currentUser }) {
        const container = document.getElementById('details-content');
        if (!container) return;

        const isReturned = submission.verification_status === 'Returned';
        const isScholar = currentUser.role === 'scholar';

        container.innerHTML = `
            <div class="details-grid">
                <!-- Academic & Scholar Information Card -->
                <div class="card">
                    <div class="card-header">
                        <h3>Academic Record Overview</h3>
                        <span class="program-badge">${program ? program.program_name : 'Scholarship'}</span>
                    </div>
                    <div class="card-body">
                        <div class="info-row">
                            <span class="info-label">Scholar Name:</span>
                            <span class="info-val"><strong>${scholarProfile ? scholarProfile.full_name : 'N/A'}</strong> (${scholarProfile ? scholarProfile.student_id : 'N/A'})</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Academic Period:</span>
                            <span class="info-val">${submission.academic_year} - ${submission.semester}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Submitted At:</span>
                            <span class="info-val">${window.formatManilaDate(submission.submitted_at)} ${submission.is_late ? '<span class="badge badge-danger">Late</span>' : '<span class="badge badge-success">On-Time</span>'}</span>
                        </div>
                        <hr class="my-3">
                        <div class="metrics-grid">
                            <div class="metric-box">
                                <span class="metric-num">${submission.gwa.toFixed(2)}</span>
                                <span class="metric-title">GWA</span>
                            </div>
                            <div class="metric-box">
                                <span class="metric-num">${submission.enrolled_units}</span>
                                <span class="metric-title">Units Enrolled</span>
                            </div>
                            <div class="metric-box">
                                <span class="metric-num">${submission.failed_subjects}</span>
                                <span class="metric-title">Failed</span>
                            </div>
                            <div class="metric-box">
                                <span class="metric-num">${submission.incomplete_subjects}</span>
                                <span class="metric-title">Incomplete</span>
                            </div>
                            <div class="metric-box">
                                <span class="metric-num">${submission.dropped_subjects}</span>
                                <span class="metric-title">Dropped</span>
                            </div>
                        </div>
                        <div class="evidence-box mt-3">
                            <strong>Supporting Document Reference:</strong>
                            <div class="doc-pill">
                                <code>${submission.evidence_reference}</code>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Triple Status Card -->
                <div class="card">
                    <div class="card-header">
                        <h3>Lifecycle Monitoring Statuses</h3>
                    </div>
                    <div class="card-body">
                        <div class="status-stage">
                            <div class="stage-header">
                                <span class="stage-title">1. Evidence Verification</span>
                                ${window.ScholarPortal.getVerificationBadge(submission.verification_status)}
                            </div>
                            <p class="text-sm text-muted">Verification determines whether official registrar documents substantiate the reported grades.</p>
                        </div>
                        <hr>
                        <div class="status-stage">
                            <div class="stage-header">
                                <span class="stage-title">2. Policy Compliance</span>
                                ${window.ScholarPortal.getComplianceBadge(submission.compliance_status)}
                            </div>
                            <p class="text-sm text-muted">Evaluation checks 7 academic thresholds against the program policy.</p>
                        </div>
                        <hr>
                        <div class="status-stage">
                            <div class="stage-header">
                                <span class="stage-title">3. Renewal Decision</span>
                                ${window.ScholarPortal.getRenewalBadge(submission.renewal_status)}
                            </div>
                            <p class="text-sm text-muted">Explicit decision by Scholarship Staff (Approved or Held).</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Resubmission Section (Visible when Returned and user is Scholar) -->
            ${isReturned && isScholar ? `
                <div id="resubmit-section" class="card card-warning mt-4">
                    <div class="card-header">
                        <h3><i class="icon">⚠️</i> Correct & Resubmit Returned Academic Summary</h3>
                    </div>
                    <div class="card-body">
                        <div class="alert alert-warning mb-3">
                            <strong>Staff Return Feedback:</strong>
                            <p>${verHistory.length > 0 && verHistory[0].reason ? verHistory[0].reason : 'Evidence requires correction as indicated by staff.'}</p>
                        </div>
                        <form id="resubmission-form">
                            <div class="form-row-grid">
                                <div class="form-group">
                                    <label for="resubmit-gwa">Corrected GWA (1.00 - 5.00)</label>
                                    <input type="number" id="resubmit-gwa" step="0.01" min="1.00" max="5.00" value="${submission.gwa.toFixed(2)}" required class="form-control">
                                </div>
                                <div class="form-group">
                                    <label for="resubmit-units">Enrolled Units</label>
                                    <input type="number" id="resubmit-units" min="1" value="${submission.enrolled_units}" required class="form-control">
                                </div>
                                <div class="form-group">
                                    <label for="resubmit-failed">Failed Subjects</label>
                                    <input type="number" id="resubmit-failed" min="0" value="${submission.failed_subjects}" required class="form-control">
                                </div>
                                <div class="form-group">
                                    <label for="resubmit-inc">Incomplete Grades</label>
                                    <input type="number" id="resubmit-inc" min="0" value="${submission.incomplete_subjects}" required class="form-control">
                                </div>
                                <div class="form-group">
                                    <label for="resubmit-dropped">Dropped Subjects</label>
                                    <input type="number" id="resubmit-dropped" min="0" value="${submission.dropped_subjects}" required class="form-control">
                                </div>
                            </div>
                            <div class="form-group mt-3">
                                <label for="resubmit-evidence">Corrected Document Reference</label>
                                <input type="text" id="resubmit-evidence" value="${submission.evidence_reference}" required class="form-control">
                            </div>
                            <button type="submit" class="btn btn-warning mt-3">Resubmit Corrected Summary</button>
                        </form>
                    </div>
                </div>
            ` : ''}

            <!-- Evaluation Results Breakdown (if evaluated) -->
            ${evaluations.length > 0 ? `
                <div class="card mt-4">
                    <div class="card-header">
                        <h3>Academic Policy Evaluation Breakdown</h3>
                        ${window.ScholarPortal.getComplianceBadge(evaluations[0].overall_result)}
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Policy Rule</th>
                                        <th>Reported Value</th>
                                        <th>Policy Threshold</th>
                                        <th>Check Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Maximum General Weighted Average (GWA)</td>
                                        <td>${evaluations[0].check_results.gwa_check ? evaluations[0].check_results.gwa_check.value.toFixed(2) : submission.gwa.toFixed(2)}</td>
                                        <td>&le; ${evaluations[0].policy_snapshot.max_gwa.toFixed(2)}</td>
                                        <td>${evaluations[0].check_results.gwa_check && evaluations[0].check_results.gwa_check.pass ? '<span class="badge badge-success">Passed</span>' : '<span class="badge badge-danger">Failed</span>'}</td>
                                    </tr>
                                    <tr>
                                        <td>Minimum Enrolled Units</td>
                                        <td>${evaluations[0].check_results.units_check ? evaluations[0].check_results.units_check.value : submission.enrolled_units} units</td>
                                        <td>&ge; ${evaluations[0].policy_snapshot.min_enrolled_units} units</td>
                                        <td>${evaluations[0].check_results.units_check && evaluations[0].check_results.units_check.pass ? '<span class="badge badge-success">Passed</span>' : '<span class="badge badge-danger">Failed</span>'}</td>
                                    </tr>
                                    <tr>
                                        <td>Maximum Failed Subjects</td>
                                        <td>${evaluations[0].check_results.failed_check ? evaluations[0].check_results.failed_check.value : submission.failed_subjects}</td>
                                        <td>&le; ${evaluations[0].policy_snapshot.max_failed_subjects}</td>
                                        <td>${evaluations[0].check_results.failed_check && evaluations[0].check_results.failed_check.pass ? '<span class="badge badge-success">Passed</span>' : '<span class="badge badge-danger">Failed</span>'}</td>
                                    </tr>
                                    <tr>
                                        <td>Maximum Incomplete Grades</td>
                                        <td>${evaluations[0].check_results.incomplete_check ? evaluations[0].check_results.incomplete_check.value : submission.incomplete_subjects}</td>
                                        <td>&le; ${evaluations[0].policy_snapshot.max_incomplete_subjects}</td>
                                        <td>${evaluations[0].check_results.incomplete_check && evaluations[0].check_results.incomplete_check.pass ? '<span class="badge badge-success">Passed</span>' : '<span class="badge badge-danger">Failed</span>'}</td>
                                    </tr>
                                    <tr>
                                        <td>Maximum Dropped Subjects</td>
                                        <td>${evaluations[0].check_results.dropped_check ? evaluations[0].check_results.dropped_check.value : submission.dropped_subjects}</td>
                                        <td>&le; ${evaluations[0].policy_snapshot.max_dropped_subjects}</td>
                                        <td>${evaluations[0].check_results.dropped_check && evaluations[0].check_results.dropped_check.pass ? '<span class="badge badge-success">Passed</span>' : '<span class="badge badge-danger">Failed</span>'}</td>
                                    </tr>
                                    <tr>
                                        <td>Grade Document Evidence Verification</td>
                                        <td>${evaluations[0].check_results.evidence_check ? evaluations[0].check_results.evidence_check.status : submission.verification_status}</td>
                                        <td>Verified</td>
                                        <td>${evaluations[0].check_results.evidence_check && evaluations[0].check_results.evidence_check.pass ? '<span class="badge badge-success">Passed</span>' : '<span class="badge badge-danger">Failed</span>'}</td>
                                    </tr>
                                    <tr>
                                        <td>Submission Deadline Compliance</td>
                                        <td>${window.formatManilaDate(submission.submitted_at)}</td>
                                        <td>&le; ${window.formatManilaDate(evaluations[0].policy_snapshot.submission_deadline)}</td>
                                        <td>${evaluations[0].check_results.deadline_check && evaluations[0].check_results.deadline_check.pass ? '<span class="badge badge-success">Passed</span>' : '<span class="badge badge-danger">Late</span>'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        ${evaluations[0].deficiency_reasons && evaluations[0].deficiency_reasons.length > 0 ? `
                            <div class="alert alert-danger mt-3">
                                <strong>Identified Academic Deficiencies:</strong>
                                <ul class="deficiency-list">
                                    ${evaluations[0].deficiency_reasons.map(r => `<li>${r}</li>`).join('')}
                                </ul>
                            </div>
                        ` : `
                            <div class="alert alert-success mt-3">
                                <strong>All Policy Criteria Satisfied:</strong> Scholar complies with all academic and documentary requirements for ${evaluations[0].policy_snapshot.program_name}.
                            </div>
                        `}
                    </div>
                </div>
            ` : ''}

            <!-- Renewal Decision Note (if decided) -->
            ${renewals.length > 0 ? `
                <div class="card mt-4">
                    <div class="card-header">
                        <h3>Renewal Decision Record</h3>
                        ${window.ScholarPortal.getRenewalBadge(renewals[0].decision)}
                    </div>
                    <div class="card-body">
                        <div class="info-row">
                            <span class="info-label">Staff Decision:</span>
                            <span class="info-val"><strong>${renewals[0].decision}</strong></span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Decision Date:</span>
                            <span class="info-val">${window.formatManilaDate(renewals[0].decided_at)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Staff Notes / Instructions:</span>
                            <span class="info-val"><em>${renewals[0].notes || 'None provided.'}</em></span>
                        </div>
                    </div>
                </div>
            ` : ''}

            <!-- Verification History Trail -->
            <div class="card mt-4">
                <div class="card-header">
                    <h3>Document Verification History Trail</h3>
                </div>
                <div class="card-body">
                    ${verHistory.length === 0 ? '<p class="text-muted">No verification actions recorded yet.</p>' : `
                        <div class="timeline">
                            ${verHistory.map(h => `
                                <div class="timeline-item">
                                    <span class="timeline-time">${window.formatManilaDate(h.created_at)}</span>
                                    <span class="timeline-badge">${h.action}</span>
                                    <p class="timeline-desc">${h.reason || 'Verification record confirmed.'}</p>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;

        // Bind resubmission form if rendered
        const resubmitForm = document.getElementById('resubmission-form');
        if (resubmitForm) {
            resubmitForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const gwa = parseFloat(document.getElementById('resubmit-gwa').value);
                const units = parseInt(document.getElementById('resubmit-units').value);
                const failed = parseInt(document.getElementById('resubmit-failed').value);
                const inc = parseInt(document.getElementById('resubmit-inc').value);
                const dropped = parseInt(document.getElementById('resubmit-dropped').value);
                const evidence = document.getElementById('resubmit-evidence').value;

                const { data, error } = await window.dataClient.rpc('resubmit_semester_submission', {
                    p_submission_id: submission.id,
                    p_gwa: gwa,
                    p_enrolled_units: units,
                    p_failed_subjects: failed,
                    p_incomplete_subjects: inc,
                    p_dropped_subjects: dropped,
                    p_evidence_reference: evidence
                });

                if (error) {
                    alert("Resubmission error: " + error.message);
                } else {
                    alert("Submission successfully corrected and resubmitted! Verification status is now Pending.");
                    window.location.reload();
                }
            });
        }
    }
};

window.Submissions = Submissions;
