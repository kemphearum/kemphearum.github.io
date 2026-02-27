export const sortData = (data, sortState) => {
    if (!sortState.field) return data;
    return [...data].sort((a, b) => {
        let aVal = a[sortState.field];
        let bVal = b[sortState.field];

        // Handle Firestore Timestamps
        if (aVal && typeof aVal === 'object' && 'seconds' in aVal) aVal = aVal.seconds;
        if (bVal && typeof bVal === 'object' && 'seconds' in bVal) bVal = bVal.seconds;

        // Handle booleans
        if (typeof aVal === 'boolean') aVal = aVal ? 1 : 0;
        if (typeof bVal === 'boolean') bVal = bVal ? 1 : 0;

        // Handle nulls/undefined
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        // String comparison
        if (typeof aVal === 'string' && typeof bVal === 'string') {
            return sortState.dir === 'asc'
                ? aVal.localeCompare(bVal)
                : bVal.localeCompare(aVal);
        }

        // Numeric comparison
        return sortState.dir === 'asc' ? aVal - bVal : bVal - aVal;
    });
};
