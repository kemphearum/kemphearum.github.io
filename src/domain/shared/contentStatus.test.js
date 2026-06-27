import { describe, it, expect } from 'vitest';
import {
    STATUS,
    computeEffectiveStatus,
    getStoredStatus,
    isEffectivelyPublished,
    filterPublished,
    normalizeStatusFields,
    hasStatusDrift
} from './contentStatus';

const HOUR = 3600 * 1000;
const now = 1_700_000_000_000;
const iso = (offset) => new Date(now + offset).toISOString();

describe('contentStatus', () => {
    describe('getStoredStatus()', () => {
        it('falls back to the legacy visible flag', () => {
            expect(getStoredStatus({ visible: false })).toBe(STATUS.DRAFT);
            expect(getStoredStatus({ visible: true })).toBe(STATUS.PUBLISHED);
            expect(getStoredStatus({})).toBe(STATUS.PUBLISHED);
        });
        it('prefers an explicit valid status', () => {
            expect(getStoredStatus({ status: 'archived', visible: true })).toBe(STATUS.ARCHIVED);
        });
    });

    describe('computeEffectiveStatus()', () => {
        it('keeps a published doc published', () => {
            expect(computeEffectiveStatus({ status: 'published' }, now)).toBe(STATUS.PUBLISHED);
        });
        it('promotes a scheduled doc once publishAt passes', () => {
            expect(computeEffectiveStatus({ status: 'scheduled', publishAt: iso(-HOUR) }, now)).toBe(STATUS.PUBLISHED);
            expect(computeEffectiveStatus({ status: 'scheduled', publishAt: iso(HOUR) }, now)).toBe(STATUS.SCHEDULED);
        });
        it('treats a published doc with a future publishAt as scheduled', () => {
            expect(computeEffectiveStatus({ status: 'published', publishAt: iso(HOUR) }, now)).toBe(STATUS.SCHEDULED);
        });
        it('archives once expireAt passes', () => {
            expect(computeEffectiveStatus({ status: 'published', expireAt: iso(-HOUR) }, now)).toBe(STATUS.ARCHIVED);
        });
        it('leaves drafts as draft', () => {
            expect(computeEffectiveStatus({ status: 'draft' }, now)).toBe(STATUS.DRAFT);
        });
    });

    describe('filterPublished()', () => {
        it('keeps only effectively-published items', () => {
            const items = [
                { id: 'a', status: 'published' },
                { id: 'b', status: 'draft' },
                { id: 'c', status: 'scheduled', publishAt: iso(HOUR) },
                { id: 'd', status: 'scheduled', publishAt: iso(-HOUR) },
                { id: 'e', visible: true },
                { id: 'f', visible: false }
            ];
            expect(filterPublished(items, now).map((i) => i.id)).toEqual(['a', 'd', 'e']);
        });
    });

    describe('normalizeStatusFields()', () => {
        it('derives visible from status and stamps publishedAt', () => {
            const result = normalizeStatusFields({ status: 'published' });
            expect(result.visible).toBe(true);
            expect(result.publishedAt).toBeTruthy();
        });
        it('marks draft/archived as not visible', () => {
            expect(normalizeStatusFields({ status: 'draft' }).visible).toBe(false);
            expect(normalizeStatusFields({ status: 'archived' }).visible).toBe(false);
        });
        it('keeps scheduled visible (gated at read time) and preserves existing stamps', () => {
            const result = normalizeStatusFields({ status: 'scheduled', publishedAt: 'kept' });
            expect(result.visible).toBe(true);
            expect(result.publishedAt).toBe('kept');
        });
        it('back-fills status from legacy visible', () => {
            expect(normalizeStatusFields({ visible: false }).status).toBe(STATUS.DRAFT);
        });
    });

    describe('hasStatusDrift()', () => {
        it('detects when effective differs from stored', () => {
            expect(hasStatusDrift({ status: 'scheduled', publishAt: iso(-HOUR) }, now)).toBe(true);
            expect(hasStatusDrift({ status: 'published' }, now)).toBe(false);
        });
    });
});
