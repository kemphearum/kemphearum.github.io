/**
 * Lightweight fuzzy matcher (no dependencies).
 *
 * Returns a score where higher is a better match, or -1 when the query does not
 * match at all. A direct substring match ranks above a subsequence match, and
 * earlier / more contiguous matches score higher.
 */
export const fuzzyScore = (query, text) => {
    const q = String(query || '').toLowerCase().trim();
    if (!q) return 0;
    const t = String(text || '').toLowerCase();
    if (!t) return -1;

    const idx = t.indexOf(q);
    if (idx !== -1) return 1000 - Math.min(idx, 900);

    let qi = 0;
    let score = 0;
    let prev = -2;
    for (let i = 0; i < t.length && qi < q.length; i += 1) {
        if (t[i] === q[qi]) {
            score += i === prev + 1 ? 6 : 1;
            prev = i;
            qi += 1;
        }
    }
    return qi === q.length ? score : -1;
};

export const fuzzyMatch = (query, text) => fuzzyScore(query, text) >= 0;
