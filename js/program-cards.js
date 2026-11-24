/**
 * Student Scholarship Monitoring and Academic Compliance System
 * Shared renderer for the Merit / Community scholarship program cards
 * (used by index.html and policies.html)
 */

(function () {
    const PROGRAM_STYLES = {
        merit: {
            icon: '🏅',
            description: 'For top academic achievers who keep excellent grades, carry a full load, and maintain a clean academic record.'
        },
        community: {
            icon: '🤝',
            description: 'For scholars active in civic and community service, with a lighter unit load and one permitted dropped subject.'
        }
    };

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function variantOf(programName) {
        return /community/i.test(programName || '') ? 'community' : 'merit';
    }

    function limitChip(max) {
        const n = Number(max) || 0;
        if (n === 0) return '<span class="rule-chip rule-chip--strict">None allowed</span>';
        return `<span class="rule-chip rule-chip--allowed">Up to ${n} allowed</span>`;
    }

    /**
     * @param {object} program  scholarship_programs row (or CONFIG.PROGRAMS entry with program_name)
     * @param {object} [options]
     * @param {boolean} [options.showMeta]  show record ID + last updated footer
     */
    function renderProgramCard(program, options = {}) {
        const variant = variantOf(program.program_name);
        const style = PROGRAM_STYLES[variant];
        const deadline = window.formatManilaDate
            ? window.formatManilaDate(program.submission_deadline)
            : program.submission_deadline;

        const meta = options.showMeta ? `
            <div class="program-card__meta">
                Program Record ID: <code>${escapeHtml(program.id)}</code><br>
                Last Updated: ${escapeHtml(window.formatManilaDate(program.updated_at))}
            </div>` : '';

        return `
        <article class="program-card program-card--${variant}">
            <header class="program-card__header">
                <div class="program-card__icon" aria-hidden="true">${style.icon}</div>
                <div>
                    <span class="program-card__eyebrow">Scholarship Program</span>
                    <h3 class="program-card__title">${escapeHtml(program.program_name)}</h3>
                </div>
            </header>
            <div class="program-card__body">
                <p class="program-card__desc">${style.description}</p>

                <div class="program-stats">
                    <div class="program-stat">
                        <span class="program-stat__label">Max GWA</span>
                        <span class="program-stat__value">${Number(program.max_gwa).toFixed(2)}</span>
                        <span class="program-stat__hint">or better (lower is better)</span>
                    </div>
                    <div class="program-stat">
                        <span class="program-stat__label">Min Units</span>
                        <span class="program-stat__value">${Number(program.min_enrolled_units)}</span>
                        <span class="program-stat__hint">enrolled per semester</span>
                    </div>
                </div>

                <ul class="program-rules">
                    <li><span class="program-rules__name">Failed subjects</span>${limitChip(program.max_failed_subjects)}</li>
                    <li><span class="program-rules__name">Incomplete grades (INC)</span>${limitChip(program.max_incomplete_subjects)}</li>
                    <li><span class="program-rules__name">Dropped subjects</span>${limitChip(program.max_dropped_subjects)}</li>
                    <li><span class="program-rules__name">Required evidence</span><span class="rule-chip rule-chip--info">${escapeHtml(program.evidence_required)}</span></li>
                </ul>

                <div class="program-card__deadline">
                    <span aria-hidden="true">⏰</span>
                    <div>
                        <strong>Submission Deadline</strong>
                        ${escapeHtml(deadline)}
                    </div>
                </div>
                ${meta}
            </div>
        </article>`;
    }

    window.renderProgramCard = renderProgramCard;
})();
