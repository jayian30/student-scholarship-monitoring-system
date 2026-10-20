/**
 * Student Scholarship Monitoring and Academic Compliance System
 * System Configuration & Timezone Constants
 */

const CONFIG = {
    APP_NAME: "Student Scholarship Monitoring and Academic Compliance System",
    TIMEZONE: "Asia/Manila",
    TIMEZONE_OFFSET_HOURS: 8,
    
    // Default Supabase Connection Parameters
    // Can be dynamically set or overridden in local storage via the UI
    DEFAULT_SUPABASE_URL: window.localStorage.getItem('SCHOLARSHIP_SUPABASE_URL') || "https://hvrnijdbwyumdsrenbtn.supabase.co",
    DEFAULT_SUPABASE_ANON_KEY: window.localStorage.getItem('SCHOLARSHIP_SUPABASE_ANON_KEY') || "sb_publishable_5XEXQdDcr84BnN5IEcQXHg_1tMcy8Px",

    // System Date Bounds & Fallbacks
    CURRENT_ACADEMIC_YEAR: "2026-2027",
    CURRENT_SEMESTER: "Semester 1",
    
    // Official Manila Deadline for AY 2026-2027 Sem 1
    // October 30, 2026 at 5:00:00 PM Manila Time (UTC+8)
    OFFICIAL_DEADLINE_ISO: "2026-10-30T17:00:00+08:00",
    OFFICIAL_DEADLINE_MS: new Date("2026-10-30T17:00:00+08:00").getTime(),

    // Policy Threshold Defaults (Mirrors database seed)
    PROGRAMS: {
        MERIT: {
            name: "Merit Scholar",
            max_gwa: 1.75,
            min_enrolled_units: 18,
            max_failed_subjects: 0,
            max_incomplete_subjects: 0,
            max_dropped_subjects: 0,
            evidence_required: "Grade-document reference",
            submission_deadline: "2026-10-30T17:00:00+08:00"
        },
        COMMUNITY: {
            name: "Community Scholar",
            max_gwa: 2.25,
            min_enrolled_units: 15,
            max_failed_subjects: 0,
            max_incomplete_subjects: 0,
            max_dropped_subjects: 1,
            evidence_required: "Grade-document reference",
            submission_deadline: "2026-10-30T17:00:00+08:00"
        }
    }
};

/**
 * Format a timestamp into Asia/Manila display string
 * e.g. "Oct 30, 2026, 05:00 PM PHT"
 */
function formatManilaDate(dateInput) {
    if (!dateInput) return "N/A";
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "Invalid Date";

    try {
        return new Intl.DateTimeFormat('en-PH', {
            timeZone: 'Asia/Manila',
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        }).format(date) + " (PHT)";
    } catch (e) {
        // Fallback
        return date.toLocaleString() + " (PHT)";
    }
}

/**
 * Get current Manila ISO string
 */
function getManilaCurrentISO() {
    return new Date().toISOString();
}

window.CONFIG = CONFIG;
window.formatManilaDate = formatManilaDate;
window.getManilaCurrentISO = getManilaCurrentISO;
