import { describe, it, expect } from 'vitest';
import { jsonToCsv, csvToJson } from './csvUtils';

describe('csvUtils', () => {
    const mockData = [
        { id: 1, name: 'John Doe', bio: 'Hello "World"\nNew Line', tags: ['js', 'react'] },
        { id: 2, name: 'Jane Smith', bio: 'Bio without quotes', tags: ['node'] }
    ];

    describe('jsonToCsv', () => {
        it('should correctly convert JSON to CSV with quoted fields and escaped quotes', () => {
            const csv = jsonToCsv(mockData);
            
            // Header
            expect(csv).toContain('"id","name","bio","tags"');
            
            // Row 1 (handled escaped quotes and newlines)
            expect(csv).toContain('"1","John Doe"');
            expect(csv).toContain('"Hello ""World""\nNew Line"');
            expect(csv).toContain('"js, react"');
        });

        it('should use preferred headers if provided', () => {
            const csv = jsonToCsv(mockData, ['name', 'id']);
            expect(csv.split('\n')[0]).toBe('"name","id"');
        });

        it('should return empty string for empty data', () => {
            expect(jsonToCsv([])).toBe('');
            expect(jsonToCsv(null)).toBe('');
        });
    });

    describe('csvToJson', () => {
        it('should correctly parse CSV back to JSON, including multi-line fields', () => {
            const csv = jsonToCsv(mockData);
            const json = csvToJson(csv);
            
            expect(json.length).toBe(2);
            expect(json[0].name).toBe('John Doe');
            expect(json[0].bio).toBe('Hello "World"\nNew Line');
            expect(json[0].tags).toBe('js, react'); // Arrays converted to string
        });

        it('should handle CRLF and simple rows', () => {
            const csv = '"h1","h2"\r\n"v1","v2"';
            const json = csvToJson(csv);
            expect(json[0].h1).toBe('v1');
            expect(json[0].h2).toBe('v2');
        });

        it('should return empty array for invalid CSV', () => {
            expect(csvToJson('')).toEqual([]);
            expect(csvToJson('single_row_no_data')).toEqual([]);
        });
    });

    describe('Round-trip', () => {
        it('should maintain data integrity through a round-trip', () => {
            const original = [
                { a: '1', b: 'complex "value"', c: 'line1\nline2' }
            ];
            const csv = jsonToCsv(original);
            const result = csvToJson(csv);
            expect(result[0]).toEqual(original[0]);
        });
    });
});
