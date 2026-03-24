/**
 * Formats a YYYY-MM string to MMM YYYY (e.g., "2023-05" -> "May 2023").
 * @param {string} yyyyMm 
 * @returns {string}
 */
export const formatExperienceDate = (yyyyMm) => {
    if (!yyyyMm || typeof yyyyMm !== 'string' || !yyyyMm.includes('-')) return yyyyMm || '';
    const [year, month] = yyyyMm.split('-');
    const monthIndex = parseInt(month, 10) - 1;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (monthIndex < 0 || monthIndex > 11) return yyyyMm;
    return `${months[monthIndex]} ${year}`;
};

/**
 * Normalizes experience data for Firestore.
 * @param {Object} data - Raw form data
 * @returns {Object} Normalized data
 */
export const normalizeExperience = (data) => {
    const startLabel = formatExperienceDate(data.startMonthYear);
    const endLabel = data.current ? 'Present' : formatExperienceDate(data.endMonthYear);

    return {
        company: (data.company || '').trim(),
        role: (data.role || '').trim(),
        startDate: startLabel,
        startMonthYear: data.startMonthYear || '',
        endDate: endLabel,
        endMonthYear: data.current ? '' : (data.endMonthYear || ''),
        period: `${startLabel} - ${endLabel}`,
        current: !!data.current,
        description: (data.description || '').trim(),
        visible: data.visible !== false,
        order: Number(data.order) || 0
    };
};

/**
 * Validates experience data.
 * @param {Object} data - Normalized or raw data
 * @returns {Object|null} Error object { field: message } or null
 */
export const validateExperience = (data) => {
    const errors = {};
    
    if (!data.company || !data.company.trim()) {
        errors.company = 'Company is required';
    }

    if (!data.role || !data.role.trim()) {
        errors.role = 'Role is required';
    }

    if (!data.startMonthYear) {
        errors.startMonthYear = 'Start date is required';
    }

    return Object.keys(errors).length > 0 ? errors : null;
};
