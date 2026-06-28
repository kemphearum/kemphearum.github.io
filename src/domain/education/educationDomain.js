import { buildLocalizedFieldFromInput, getLocalizedField } from '../../utils/localization';

/**
 * Formats a YYYY string or YYYY-MM string to YYYY.
 * Education typically just shows the year.
 * @param {string} dateStr 
 * @returns {string}
 */
export const formatEducationDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return '';
    return dateStr.substring(0, 4);
};

/**
 * Normalizes education data for Firestore.
 * @param {Object} data - Raw form data
 * @returns {Object} Normalized data
 */
export const normalizeEducation = (data) => {
    const startLabel = formatEducationDate(data.startYear);
    const endLabel = data.current ? 'Present' : formatEducationDate(data.endYear);
    const school = buildLocalizedFieldFromInput(data, 'school');
    const degree = buildLocalizedFieldFromInput(data, 'degree');
    const fieldOfStudy = buildLocalizedFieldFromInput(data, 'fieldOfStudy');
    const description = buildLocalizedFieldFromInput(data, 'description');

    let period = '';
    if (startLabel && endLabel) {
        period = startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
    } else if (startLabel) {
        period = startLabel;
    } else if (endLabel) {
        period = endLabel;
    }

    return {
        school,
        degree,
        fieldOfStudy,
        startDate: startLabel,
        startYear: data.startYear || '',
        endDate: endLabel,
        endYear: data.current ? '' : (data.endYear || ''),
        period,
        current: !!data.current,
        description,
        visible: data.visible !== false,
        order: Number(data.order) || 0
    };
};

/**
 * Validates education data.
 * @param {Object} data - Normalized or raw data
 * @returns {Object|null} Error object { field: message } or null
 */
export const validateEducation = (data) => {
    const errors = {};
    const school = getLocalizedField(data.school, 'en');
    const degree = getLocalizedField(data.degree, 'en');
    
    if (!school || !school.trim()) {
        errors.schoolEn = 'English school name is required';
    }

    if (!degree || !degree.trim()) {
        errors.degreeEn = 'English degree is required';
    }

    if (!data.startYear) {
        errors.startYear = 'Start year is required';
    }

    return Object.keys(errors).length > 0 ? errors : null;
};
