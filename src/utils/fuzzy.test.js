import { describe, it, expect } from 'vitest';
import { fuzzyScore, fuzzyMatch } from './fuzzy';

describe('fuzzy', () => {
    it('treats an empty query as a neutral match', () => {
        expect(fuzzyScore('', 'anything')).toBe(0);
        expect(fuzzyMatch('', 'anything')).toBe(true);
    });

    it('ranks a direct substring match above a subsequence match', () => {
        const substring = fuzzyScore('iso', 'iso 27001');
        const subsequence = fuzzyScore('io', 'information officer');
        expect(substring).toBeGreaterThan(subsequence);
    });

    it('matches non-contiguous subsequences', () => {
        expect(fuzzyMatch('isms', 'information security management system')).toBe(true);
        expect(fuzzyScore('isms', 'information security management system')).toBeGreaterThan(0);
    });

    it('returns -1 when characters are missing or out of order', () => {
        expect(fuzzyScore('xyz', 'abc')).toBe(-1);
        expect(fuzzyMatch('cba', 'abc')).toBe(false);
    });

    it('is case-insensitive', () => {
        expect(fuzzyMatch('CISSP', 'cissp certified')).toBe(true);
    });
});
