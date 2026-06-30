import { describe, it, expect } from 'vitest';
import { normalizeAward, validateAward } from './awardDomain';

describe('awardDomain', () => {
    describe('normalizeAward()', () => {
        it('should normalize basic award data', () => {
            const rawData = {
                title: { en: ' Best Developer ', km: '' },
                organization: ' Tech Corp ',
                issueDate: '2023-05'
            };
            const result = normalizeAward(rawData);

            expect(result.title).toEqual({ en: 'Best Developer', km: '' });
            expect(result.organization).toEqual({ en: 'Tech Corp', km: '' });
            expect(result.issueDate).toBe('2023-05');
        });

        it('should default order to 0 and featured to false', () => {
            const result = normalizeAward({});
            expect(result.order).toBe(0);
            expect(result.featured).toBe(false);
        });
    });

    describe('validateAward()', () => {
        it('should return null for valid data', () => {
            const errors = validateAward({ 
                title: { en: 'Valid Title', km: '' }, 
                organization: 'Tech Corp', 
                issueDate: '2023-05' 
            });
            expect(errors).toBeNull();
        });

        it('should return errors for missing required fields', () => {
            const errors = validateAward({
                title: { en: '', km: '' },
                organization: '',
                issueDate: ''
            });
            expect(errors.titleEn).toBe('English Title is required');
        });
    });
});
