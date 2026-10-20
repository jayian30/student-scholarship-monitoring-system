/**
 * Student Scholarship Monitoring and Academic Compliance System
 * Input Validation Library
 */

const Validation = {
    /**
     * Validates GWA (General Weighted Average)
     * Valid range: 1.00 through 5.00 inclusive.
     */
    validateGWA(gwa) {
        if (gwa === null || gwa === undefined || gwa === '') {
            return { valid: false, error: "General Weighted Average (GWA) is required." };
        }
        const val = parseFloat(gwa);
        if (isNaN(val)) {
            return { valid: false, error: "GWA must be a valid decimal number." };
        }
        if (val < 1.00 || val > 5.00) {
            return { valid: false, error: `GWA must be between 1.00 and 5.00 (entered: ${val.toFixed(2)}).` };
        }
        return { valid: true, value: parseFloat(val.toFixed(2)) };
    },

    /**
     * Validates Enrolled Units
     * Must be a non-negative integer >= 0.
     */
    validateEnrolledUnits(units) {
        if (units === null || units === undefined || units === '') {
            return { valid: false, error: "Enrolled units is required." };
        }
        const val = Number(units);
        if (!Number.isInteger(val) || isNaN(val)) {
            return { valid: false, error: "Enrolled units must be a whole integer." };
        }
        if (val < 0) {
            return { valid: false, error: "Enrolled units cannot be negative." };
        }
        if (val === 0) {
            return { valid: false, error: "Enrolled units must be greater than zero." };
        }
        return { valid: true, value: val };
    },

    /**
     * Validates Subject Counts (Failed, Incomplete, Dropped)
     * Must be non-negative integers >= 0.
     */
    validateSubjectCount(count, fieldName = "Subject count") {
        if (count === null || count === undefined || count === '') {
            return { valid: false, error: `${fieldName} is required.` };
        }
        const val = Number(count);
        if (!Number.isInteger(val) || isNaN(val)) {
            return { valid: false, error: `${fieldName} must be an integer.` };
        }
        if (val < 0) {
            return { valid: false, error: `${fieldName} cannot be negative.` };
        }
        return { valid: true, value: val };
    },

    /**
     * Validates Evidence Reference
     * Must be a non-empty string or valid reference identifier / URL.
     */
    validateEvidenceReference(ref) {
        if (!ref || typeof ref !== 'string' || ref.trim().length === 0) {
            return { valid: false, error: "Supporting grade-document reference is required." };
        }
        if (ref.trim().length < 5) {
            return { valid: false, error: "Grade-document reference must be at least 5 characters long." };
        }
        return { valid: true, value: ref.trim() };
    },

    /**
     * Validates Non-empty Reason / Notes (e.g. for Return or Hold actions)
     */
    validateRequiredText(text, fieldName = "Reason") {
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return { valid: false, error: `A non-empty ${fieldName.toLowerCase()} is required.` };
        }
        if (text.trim().length < 5) {
            return { valid: false, error: `${fieldName} must provide sufficient detail (at least 5 characters).` };
        }
        return { valid: true, value: text.trim() };
    },

    /**
     * Validates Academic Year (e.g. '2026-2027')
     */
    validateAcademicYear(ay) {
        const regex = /^\d{4}-\d{4}$/;
        if (!ay || !regex.test(ay.trim())) {
            return { valid: false, error: "Academic Year must follow the format YYYY-YYYY (e.g., 2026-2027)." };
        }
        const [y1, y2] = ay.trim().split('-').map(Number);
        if (y2 !== y1 + 1) {
            return { valid: false, error: "Second year in Academic Year must be exactly one year after the first." };
        }
        return { valid: true, value: ay.trim() };
    },

    /**
     * Validates Semester
     */
    validateSemester(sem) {
        const validSemesters = ['Semester 1', 'Semester 2', 'Summer'];
        if (!validSemesters.includes(sem)) {
            return { valid: false, error: "Invalid semester selection. Choose Semester 1, Semester 2, or Summer." };
        }
        return { valid: true, value: sem };
    }
};

window.Validation = Validation;
