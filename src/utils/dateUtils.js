/**
 * Returns a string formatted as "YYYY-MM-DD" describing the current date.
 */
export const getTodayDateKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
