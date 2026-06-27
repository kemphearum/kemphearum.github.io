import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUnsavedChangesWarning } from './useUnsavedChangesWarning';

describe('useUnsavedChangesWarning', () => {
    afterEach(() => vi.restoreAllMocks());

    it('attaches the beforeunload listener only while dirty', () => {
        const addSpy = vi.spyOn(window, 'addEventListener');
        const removeSpy = vi.spyOn(window, 'removeEventListener');

        const { rerender, unmount } = renderHook(
            ({ when }) => useUnsavedChangesWarning(when),
            { initialProps: { when: false } }
        );

        expect(addSpy).not.toHaveBeenCalledWith('beforeunload', expect.any(Function));

        rerender({ when: true });
        expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

        unmount();
        expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });
});
