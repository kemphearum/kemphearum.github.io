import { describe, it, expect, vi } from 'vitest';
import { parseBoolean, parseImportItems, runImport } from './adminCrudIO';

describe('adminCrudIO', () => {
    describe('parseBoolean()', () => {
        it('passes through real booleans', () => {
            expect(parseBoolean(true)).toBe(true);
            expect(parseBoolean(false)).toBe(false);
        });

        it('coerces truthy/falsy strings case-insensitively', () => {
            ['true', 'TRUE', '1', 'yes', 'y'].forEach((v) => expect(parseBoolean(v)).toBe(true));
            ['false', '0', 'no', 'n', ' FALSE '].forEach((v) => expect(parseBoolean(v)).toBe(false));
        });

        it('returns the fallback for unrecognized input', () => {
            expect(parseBoolean('maybe', true)).toBe(true);
            expect(parseBoolean(undefined, false)).toBe(false);
            expect(parseBoolean(null)).toBe(false);
        });
    });

    describe('parseImportItems()', () => {
        it('parses JSON arrays', () => {
            const items = parseImportItems('data.json', JSON.stringify([{ a: 1 }, { a: 2 }]));
            expect(items).toEqual([{ a: 1 }, { a: 2 }]);
        });

        it('wraps a single JSON object into an array', () => {
            const items = parseImportItems('data.json', JSON.stringify({ a: 1 }));
            expect(items).toEqual([{ a: 1 }]);
        });

        it('parses CSV into row objects', () => {
            const csv = 'titleEn,visible\n"My Post","true"';
            const items = parseImportItems('data.csv', csv);
            expect(items).toEqual([{ titleEn: 'My Post', visible: 'true' }]);
        });
    });

    describe('runImport()', () => {
        it('counts created, updated, skipped and failed rows', async () => {
            const save = vi.fn().mockResolvedValue(undefined);
            const fetchExistingBySlug = vi.fn(async (slug) => (slug === 'exists' ? { id: 'x1' } : null));

            const result = await runImport({
                items: [
                    { slug: 'new', ok: true },      // created
                    { slug: 'exists', ok: true },   // updated
                    { skip: true },                 // skipped (buildPayload returns null)
                    { slug: 'boom', ok: true }      // failed
                ],
                buildPayload: (item) => (item.skip ? null : { slug: item.slug }),
                fetchExistingBySlug,
                save: (payload) => {
                    if (payload.slug === 'boom') throw new Error('save failed');
                    return save(payload);
                }
            });

            expect(result).toEqual({ created: 1, updated: 1, skipped: 1, failed: 1 });
        });

        it('injects the existing id into the saved payload', async () => {
            const save = vi.fn().mockResolvedValue(undefined);
            await runImport({
                items: [{ slug: 'exists' }],
                buildPayload: (item) => ({ slug: item.slug, title: 'T' }),
                fetchExistingBySlug: async () => ({ id: 'abc' }),
                save
            });

            expect(save).toHaveBeenCalledWith(
                expect.objectContaining({ slug: 'exists', id: 'abc' }),
                expect.objectContaining({ id: 'abc' })
            );
        });
    });
});
