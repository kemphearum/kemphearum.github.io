import { describe, it, expect } from 'vitest';
import { normalizeSkill, validateSkill, SKILL_LEVELS } from './skillDomain';

describe('skillDomain', () => {
    describe('normalizeSkill()', () => {
        it('builds localized name + defaults', () => {
            const result = normalizeSkill({ nameEn: ' Threat Modeling ', category: ' Security ' });
            expect(result.name).toEqual({ en: 'Threat Modeling', km: '' });
            expect(result.category).toBe('Security');
            expect(result.level).toBe('intermediate');
            expect(result.slug).toBe('threat-modeling');
            expect(result.visible).toBe(true);
            expect(result.featured).toBe(false);
            expect(result.order).toBe(0);
        });

        it('keeps an explicit slug and valid level', () => {
            const result = normalizeSkill({ nameEn: 'X', slug: 'Custom Slug', level: 'expert' });
            expect(result.slug).toBe('custom-slug');
            expect(result.level).toBe('expert');
        });

        it('falls back to intermediate for unknown levels', () => {
            expect(normalizeSkill({ nameEn: 'X', level: 'wizard' }).level).toBe('intermediate');
            expect(SKILL_LEVELS).toContain('intermediate');
        });
    });

    describe('validateSkill()', () => {
        it('requires an English name', () => {
            expect(validateSkill({ name: { en: '' } })).toHaveProperty('nameEn');
            expect(validateSkill({ name: { en: 'Ok' } })).toBeNull();
        });
    });
});
