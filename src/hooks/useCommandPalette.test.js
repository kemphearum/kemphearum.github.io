import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCommandPalette, readRecent, pushRecent } from './useCommandPalette';

describe('useCommandPalette', () => {
    beforeEach(() => {
        vi.stubGlobal('localStorage', {
            getItem: vi.fn(),
            setItem: vi.fn(),
            clear: vi.fn()
        });
    });

    describe('readRecent', () => {
        it('returns empty array if localStorage is empty', () => {
            vi.mocked(localStorage.getItem).mockReturnValue(null);
            expect(readRecent()).toEqual([]);
        });

        it('returns parsed array from localStorage', () => {
            vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify([{ id: '1', type: 'blog' }]));
            expect(readRecent()).toEqual([{ id: '1', type: 'blog' }]);
        });

        it('handles malformed JSON in localStorage', () => {
            vi.mocked(localStorage.getItem).mockReturnValue('{ malformed json }');
            expect(readRecent()).toEqual([]);
        });
    });

    describe('pushRecent', () => {
        it('adds new entry to start of array', () => {
            vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify([{ id: '1', type: 'blog' }]));
            const entry = { id: '2', type: 'projects', title: 'Test' };
            const next = pushRecent(entry);
            expect(next[0]).toEqual(entry);
            expect(next.length).toBe(2);
            expect(localStorage.setItem).toHaveBeenCalledWith('admin.palette.recent', JSON.stringify(next));
        });

        it('moves existing entry to start if already in recent', () => {
            const initial = [
                { id: '1', type: 'blog' },
                { id: '2', type: 'projects' }
            ];
            vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(initial));
            const entry = { id: '2', type: 'projects' };
            const next = pushRecent(entry);
            expect(next[0].id).toBe('2');
            expect(next[1].id).toBe('1');
            expect(next.length).toBe(2);
        });

        it('respects RECENT_MAX limit (8 items)', () => {
            const initial = Array.from({ length: 8 }, (_, i) => ({ id: String(i), type: 'blog' }));
            vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(initial));
            
            const next = pushRecent({ id: 'new', type: 'blog' });
            expect(next.length).toBe(8); // Should cap at 8
            expect(next[0].id).toBe('new');
            expect(next[7].id).toBe('6'); // The 7th item (8th item '7' gets dropped)
        });
    });

    describe('useCommandPalette (hook)', () => {
        it('initializes with open=false', () => {
            const { result } = renderHook(() => useCommandPalette());
            expect(result.current.open).toBe(false);
        });

        it('toggles open state on Cmd+K', () => {
            const { result } = renderHook(() => useCommandPalette());
            
            act(() => {
                const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
                window.dispatchEvent(event);
            });
            
            expect(result.current.open).toBe(true);

            act(() => {
                const event = new KeyboardEvent('keydown', { key: 'K', ctrlKey: true });
                window.dispatchEvent(event);
            });
            
            expect(result.current.open).toBe(false);
        });
    });
});
