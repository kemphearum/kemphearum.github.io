import { describe, it, expect } from 'vitest';
import { sortData } from './sortData';

describe('sortData util', () => {
    it('returns original data if no sort field is provided', () => {
        const data = [{ name: 'A' }, { name: 'B' }];
        const result = sortData(data, { field: null, dir: 'asc' });
        expect(result).toEqual(data);
    });

    it('sorts strings ascending', () => {
        const data = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }];
        const result = sortData(data, { field: 'name', dir: 'asc' });
        expect(result).toEqual([{ name: 'Alice' }, { name: 'Bob' }, { name: 'Charlie' }]);
    });

    it('sorts strings descending', () => {
        const data = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }];
        const result = sortData(data, { field: 'name', dir: 'desc' });
        expect(result).toEqual([{ name: 'Charlie' }, { name: 'Bob' }, { name: 'Alice' }]);
    });

    it('sorts numbers ascending', () => {
        const data = [{ age: 30 }, { age: 20 }, { age: 40 }];
        const result = sortData(data, { field: 'age', dir: 'asc' });
        expect(result).toEqual([{ age: 20 }, { age: 30 }, { age: 40 }]);
    });

    it('sorts numbers descending', () => {
        const data = [{ age: 30 }, { age: 20 }, { age: 40 }];
        const result = sortData(data, { field: 'age', dir: 'desc' });
        expect(result).toEqual([{ age: 40 }, { age: 30 }, { age: 20 }]);
    });

    it('sorts booleans ascending', () => {
        const data = [{ active: true, id: 1 }, { active: false, id: 2 }];
        const result = sortData(data, { field: 'active', dir: 'asc' });
        expect(result).toEqual([{ active: false, id: 2 }, { active: true, id: 1 }]);
    });

    it('sorts booleans descending', () => {
        const data = [{ active: false, id: 1 }, { active: true, id: 2 }];
        const result = sortData(data, { field: 'active', dir: 'desc' });
        expect(result).toEqual([{ active: true, id: 2 }, { active: false, id: 1 }]);
    });

    it('sorts Firestore-like timestamps descending', () => {
        const data = [
            { date: { seconds: 1600000000, nanoseconds: 0 }, id: 1 },
            { date: { seconds: 1700000000, nanoseconds: 0 }, id: 2 },
            { date: { seconds: 1500000000, nanoseconds: 0 }, id: 3 }
        ];
        const result = sortData(data, { field: 'date', dir: 'desc' });
        expect(result).toEqual([
            { date: { seconds: 1700000000, nanoseconds: 0 }, id: 2 },
            { date: { seconds: 1600000000, nanoseconds: 0 }, id: 1 },
            { date: { seconds: 1500000000, nanoseconds: 0 }, id: 3 }
        ]);
    });

    it('handles null values', () => {
        const data = [{ name: 'A' }, { name: null }, { name: 'B' }];
        const result = sortData(data, { field: 'name', dir: 'asc' });
        expect(result[result.length - 1]).toEqual({ name: null });
    });
});
