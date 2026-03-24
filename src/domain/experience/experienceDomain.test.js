import { describe, it, expect } from 'vitest';
import { normalizeExperience, validateExperience, formatExperienceDate } from './experienceDomain';

describe('experienceDomain', () => {
    describe('formatExperienceDate()', () => {
        it('should format YYYY-MM to MMM YYYY', () => {
            expect(formatExperienceDate('2023-05')).toBe('May 2023');
            expect(formatExperienceDate('2020-12')).toBe('Dec 2020');
        });

        it('should return original value if invalid format', () => {
            expect(formatExperienceDate('invalid')).toBe('invalid');
            expect(formatExperienceDate('')).toBe('');
        });
    });

    describe('normalizeExperience()', () => {
        it('should normalize basic experience data', () => {
            const rawData = {
                company: ' Google ',
                role: ' Dev ',
                startMonthYear: '2020-01',
                endMonthYear: '2021-01',
                current: false
            };
            const result = normalizeExperience(rawData);

            expect(result.company).toEqual({ en: 'Google', km: '' });
            expect(result.role).toEqual({ en: 'Dev', km: '' });
            expect(result.startDate).toBe('Jan 2020');
            expect(result.endDate).toBe('Jan 2021');
            expect(result.period).toBe('Jan 2020 - Jan 2021');
        });

        it('should handle current=true correctly', () => {
            const rawData = {
                startMonthYear: '2020-01',
                current: true
            };
            const result = normalizeExperience(rawData);

            expect(result.endDate).toBe('Present');
            expect(result.endMonthYear).toBe('');
            expect(result.period).toBe('Jan 2020 - Present');
        });

        it('should default order to 0', () => {
            const result = normalizeExperience({});
            expect(result.order).toBe(0);
        });

        it('should handle order as string', () => {
            const result = normalizeExperience({ order: '5' });
            expect(result.order).toBe(5);
        });
    });

    describe('validateExperience()', () => {
        it('should return null for valid data', () => {
            const errors = validateExperience({ 
                company: { en: 'A', km: '' }, 
                role: { en: 'B', km: '' }, 
                startMonthYear: '2020-01' 
            });
            expect(errors).toBeNull();
        });

        it('should return errors for missing fields', () => {
            const errors = validateExperience({
                company: { en: '', km: '' },
                role: { en: '', km: '' },
                startMonthYear: ''
            });
            expect(errors.companyEn).toBe('English company is required');
            expect(errors.roleEn).toBe('English role is required');
            expect(errors.startMonthYear).toBe('Start date is required');
        });
    });
});
