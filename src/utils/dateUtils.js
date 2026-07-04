/**
 * Returns a string formatted as "YYYY-MM-DD" describing the current date.
 */
export const getTodayDateKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

/**
 * Formats a date string using Intl.DateTimeFormat
 * @param {string|Date} dateString - The date to format
 * @param {string} locale - Locale string (default 'en')
 * @param {Object} options - Intl.DateTimeFormat options
 */
export const formatDate = (dateString, locale = 'en', options = {}) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat(locale, options).format(date);
    } catch {
        return dateString;
    }
};
