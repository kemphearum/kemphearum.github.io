import { describe, it, expect } from 'vitest';
import { normalizeSpeaking, validateSpeaking } from './speakingDomain';

describe('speakingDomain', () => {
    describe('normalizeSpeaking()', () => {
        it('should normalize basic speaking data', () => {
            const rawData = {
                title: { en: ' My Talk ', km: '' },
                eventName: ' Tech Conf ',
                date: '2023-05'
            };
            const result = normalizeSpeaking(rawData);

            expect(result.title).toEqual({ en: 'My Talk', km: '' });
            expect(result.eventName).toEqual({ en: 'Tech Conf', km: '' });
            expect(result.date).toBe('2023-05');
        });

        it('should default order to 0 and featured to false', () => {
            const result = normalizeSpeaking({});
            expect(result.order).toBe(0);
            expect(result.featured).toBe(false);
        });
    });

    describe('validateSpeaking()', () => {
        it('should return null for valid data', () => {
            const errors = validateSpeaking({ 
                title: { en: 'Valid Title', km: '' }, 
                eventName: 'Tech Conf', 
                date: '2023-05' 
            });
            expect(errors).toBeNull();
        });

        it('should return errors for missing required fields', () => {
            const errors = validateSpeaking({
                title: { en: '', km: '' },
                eventName: '',
                date: ''
            });
            expect(errors.titleEn).toBe('English Title is required');
        });
    });
});
