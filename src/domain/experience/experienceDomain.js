import { buildLocalizedFieldFromInput, getLocalizedField } from '../../utils/localization';

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
    const company = buildLocalizedFieldFromInput(data, 'company');
    const role = buildLocalizedFieldFromInput(data, 'role');
    const description = buildLocalizedFieldFromInput(data, 'description');

    return {
        company,
        role,
        startDate: startLabel,
        startMonthYear: data.startMonthYear || '',
        endDate: endLabel,
        endMonthYear: data.current ? '' : (data.endMonthYear || ''),
        period: `${startLabel} - ${endLabel}`,
        current: !!data.current,
        description,
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
    const company = getLocalizedField(data.company, 'en');
    const role = getLocalizedField(data.role, 'en');
    
    if (!company || !company.trim()) {
        errors.companyEn = 'English company is required';
    }

    if (!role || !role.trim()) {
        errors.roleEn = 'English role is required';
    }

    if (!data.startMonthYear) {
        errors.startMonthYear = 'Start date is required';
    }

    return Object.keys(errors).length > 0 ? errors : null;
};
