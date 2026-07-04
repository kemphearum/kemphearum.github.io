export function calculatePreviousRange(currentRange) {
    if (!currentRange || !currentRange.start || !currentRange.end) return currentRange;
    
    const start = new Date(currentRange.start);
    const end = new Date(currentRange.end);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - diffDays + 1);

    return {
        start: prevStart.toISOString().split('T')[0],
        end: prevEnd.toISOString().split('T')[0]
    };
}
