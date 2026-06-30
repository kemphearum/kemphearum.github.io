import { describe, it, expect } from 'vitest';
import { normalizePublication, validatePublication } from './publicationDomain';

describe('publicationDomain', () => {
    describe('normalizePublication()', () => {
        it('should normalize basic publication data', () => {
            const rawData = {
                title: { en: ' My Book ', km: '' },
                publisher: ' Tech Press ',
                publishDate: '2023-05'
            };
            const result = normalizePublication(rawData);

            expect(result.title).toEqual({ en: 'My Book', km: '' });
            expect(result.publisher).toEqual({ en: 'Tech Press', km: '' });
            expect(result.publishDate).toBe('2023-05');
        });

        it('should default order to 0 and featured to false', () => {
            const result = normalizePublication({});
            expect(result.order).toBe(0);
            expect(result.featured).toBe(false);
        });
    });

    describe('validatePublication()', () => {
        it('should return null for valid data', () => {
            const errors = validatePublication({ 
                title: { en: 'Valid Title', km: '' }, 
                publisher: 'Tech Press', 
                publishDate: '2023-05' 
            });
            expect(errors).toBeNull();
        });

        it('should return errors for missing required fields', () => {
            const errors = validatePublication({
                title: { en: '', km: '' },
                publisher: '',
                publishDate: ''
            });
            expect(errors.titleEn).toBe('English Title is required');
        });
    });
});
