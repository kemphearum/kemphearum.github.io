import { buildLocalizedFieldFromInput, getLocalizedField } from '../../utils/localization';

export const getKhmerNumerals = (numStr) => {
    const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
    return numStr.toString().replace(/[0-9]/g, (d) => khmerDigits[d]);
};

/**
 * Formats a YYYY-MM string to MMM YYYY (e.g., "2023-05" -> "May 2023").
 * @param {string} yyyyMm 
 * @param {string} locale
 * @returns {string}
 */
export const formatExperienceDate = (yyyyMm, locale = 'en') => {
    if (!yyyyMm || typeof yyyyMm !== 'string' || !yyyyMm.includes('-')) return yyyyMm || '';
    const [year, month] = yyyyMm.split('-');
    const monthIndex = parseInt(month, 10) - 1;
    if (monthIndex < 0 || monthIndex > 11) return yyyyMm;
    
    if (locale === 'km') {
        const monthsKm = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
        return `${monthsKm[monthIndex]} ${getKhmerNumerals(year)}`;
    } else {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[monthIndex]} ${year}`;
    }
};

/**
 * Derives total years of experience from a set of experience records by spanning
 * the earliest start year to the latest end year (or the current year for any
 * "Present" role). Returns 0 when no usable dates are found.
 * @param {Array<Object>} experiences - Experience records (with `period`)
 * @returns {number}
 */
export const deriveYearsOfExperience = (experiences = []) => {
    if (!Array.isArray(experiences) || experiences.length === 0) return 0;
    let minYear = Infinity;
    let maxYear = 0;
    experiences.forEach((exp) => {
        let periodStr = typeof exp?.period === 'string' ? exp.period : (exp?.period?.en || '');
        if (!periodStr) return;
        const years = periodStr.match(/[12]\d{3}/g);
        if (years) {
            years.forEach((y) => {
                const n = Number(y);
                if (n < minYear) minYear = n;
                if (n > maxYear) maxYear = n;
            });
        }
        if (periodStr.toLowerCase().includes('present') || periodStr.includes('បច្ចុប្បន្ន')) {
            maxYear = new Date().getFullYear();
        }
    });
    if (!Number.isFinite(minYear) || maxYear === 0) return 0;
    return Math.max(0, maxYear - minYear);
};

/**
 * Normalizes experience data for Firestore.
 * @param {Object} data - Raw form data
 * @returns {Object} Normalized data
 */
export const normalizeExperience = (data) => {
    const startLabelEn = formatExperienceDate(data.startMonthYear, 'en');
    const startLabelKm = formatExperienceDate(data.startMonthYear, 'km');
    const endLabelEn = data.current ? 'Present' : formatExperienceDate(data.endMonthYear, 'en');
    const endLabelKm = data.current ? 'បច្ចុប្បន្ន' : formatExperienceDate(data.endMonthYear, 'km');
    const company = buildLocalizedFieldFromInput(data, 'company');
    const role = buildLocalizedFieldFromInput(data, 'role');
    const description = buildLocalizedFieldFromInput(data, 'description');
    const keyResponsibilities = buildLocalizedFieldFromInput(data, 'keyResponsibilities');
    const majorAchievements = buildLocalizedFieldFromInput(data, 'majorAchievements');

    return {
        company,
        role,
        companyLogoUrl: (data.companyLogoUrl || '').trim(),
        employmentType: (data.employmentType || '').trim(),
        location: (data.location || '').trim(),
        startDate: { en: startLabelEn, km: startLabelKm },
        startMonthYear: data.startMonthYear || '',
        endDate: { en: endLabelEn, km: endLabelKm },
        endMonthYear: data.current ? '' : (data.endMonthYear || ''),
        period: { 
            en: `${startLabelEn} - ${endLabelEn}`, 
            km: `${startLabelKm} - ${endLabelKm}` 
        },
        current: !!data.current,
        description,
        keyResponsibilities,
        majorAchievements,
        technologiesUsed: Array.isArray(data.technologiesUsed) 
            ? data.technologiesUsed.filter(Boolean) 
            : (typeof data.technologiesUsed === 'string' ? data.technologiesUsed.split(',').map(s => s.trim()).filter(Boolean) : []),
        relatedProjects: Array.isArray(data.relatedProjects) 
            ? data.relatedProjects.filter(Boolean) 
            : (typeof data.relatedProjects === 'string' ? data.relatedProjects.split(',').map(s => s.trim()).filter(Boolean) : []),
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
