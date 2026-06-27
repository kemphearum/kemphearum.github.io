import { describe, it, expect } from 'vitest';
import { getSearchProviders } from './searchRegistry';
import { fuzzyScore } from '../utils/fuzzy';

describe('searchRegistry', () => {
    it('derives a provider per searchable content type', () => {
        const keys = getSearchProviders().map((provider) => provider.key);
        expect(keys).toEqual(expect.arrayContaining(['projects', 'blog', 'experience', 'skills', 'certificates']));
    });

    it('each provider exposes service + text/title builders', () => {
        getSearchProviders().forEach((provider) => {
            expect(typeof provider.service.fetchPaginated).toBe('function');
            expect(typeof provider.text).toBe('function');
            expect(typeof provider.title).toBe('function');
            expect(provider.module).toBeTruthy();
            expect(provider.icon).toBeTruthy();
        });
    });

    it('builds searchable text across localized + scalar fields', () => {
        const blog = getSearchProviders().find((provider) => provider.key === 'blog');
        const item = { title: { en: 'Zero Trust', km: '' }, excerpt: { en: 'Network security', km: '' }, tags: ['security'], slug: 'zero-trust' };
        const text = blog.text(item);
        expect(text).toContain('Zero Trust');
        expect(text).toContain('security');
        expect(fuzzyScore('zero trust', text)).toBeGreaterThan(0);
    });

    it('builds the display title from the localized name field', () => {
        const skills = getSearchProviders().find((provider) => provider.key === 'skills');
        expect(skills.title({ name: { en: 'Risk Assessment', km: '' } }, 'en')).toBe('Risk Assessment');
    });
});
