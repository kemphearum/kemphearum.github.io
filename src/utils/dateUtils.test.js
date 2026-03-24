import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTodayDateKey } from './dateUtils';

describe('dateUtils', () => {
    it('should return date in YYYY-MM-DD format', () => {
        // Mock date
        const mockDate = new Date('2023-05-20T10:00:00Z');
        vi.useFakeTimers();
        vi.setSystemTime(mockDate);
        
        const result = getTodayDateKey();
        expect(result).toBe('2023-05-20');
        
        vi.useRealTimers();
    });

    it('should pad month and day with zeros', () => {
        const mockDate = new Date('2023-01-05T10:00:00Z');
        vi.useFakeTimers();
        vi.setSystemTime(mockDate);
        
        const result = getTodayDateKey();
        expect(result).toBe('2023-01-05');
        
        vi.useRealTimers();
    });
});
