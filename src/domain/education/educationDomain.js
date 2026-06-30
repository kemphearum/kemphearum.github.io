import { buildLocalizedFieldFromInput, getLocalizedField } from '../../utils/localization';

export const getKhmerNumerals = (numStr) => {
    const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
    return numStr.toString().replace(/[0-9]/g, (d) => khmerDigits[d]);
};

/**
 * Formats a YYYY string or YYYY-MM string to YYYY.
 * Education typically just shows the year.
 * @param {string} dateStr 
 * @param {string} locale
 * @returns {string}
 */
export const formatEducationDate = (dateStr, locale = 'en') => {
    if (!dateStr || typeof dateStr !== 'string') return '';
    const yearStr = dateStr.substring(0, 4);
    return locale === 'km' ? getKhmerNumerals(yearStr) : yearStr;
};

/**
 * Normalizes education data for Firestore.
 * @param {Object} data - Raw form data
 * @returns {Object} Normalized data
 */
export const normalizeEducation = (data) => {
    const startLabelEn = formatEducationDate(data.startYear, 'en');
    const startLabelKm = formatEducationDate(data.startYear, 'km');
    const endLabelEn = data.current ? 'Present' : formatEducationDate(data.endYear, 'en');
    const endLabelKm = data.current ? 'បច្ចុប្បន្ន' : formatEducationDate(data.endYear, 'km');
    const school = buildLocalizedFieldFromInput(data, 'school');
    const degree = buildLocalizedFieldFromInput(data, 'degree');
    const fieldOfStudy = buildLocalizedFieldFromInput(data, 'fieldOfStudy');
    const description = buildLocalizedFieldFromInput(data, 'description');

    const getPeriod = (start, end) => {
        if (start && end) return start === end ? start : `${start} - ${end}`;
        if (start) return start;
        if (end) return end;
        return '';
    };

    return {
        type: (data.type || 'Degree').trim(),
        school,
        degree,
        fieldOfStudy,
        startDate: { en: startLabelEn, km: startLabelKm },
        startYear: data.startYear || '',
        endDate: { en: endLabelEn, km: endLabelKm },
        endYear: data.current ? '' : (data.endYear || ''),
        period: { 
            en: getPeriod(startLabelEn, endLabelEn),
            km: getPeriod(startLabelKm, endLabelKm)
        },
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
