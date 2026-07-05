import { useState, useEffect } from 'react';

/**
 * A hook that returns true only after the user has interacted with the page
 * (mousemove, scroll, touchstart, keydown, click) or after a maximum fallback timeout.
 * This is highly effective for deferring non-critical heavy components and third-party scripts
 * so they don't block the initial Lighthouse performance audit (LCP/FCP).
 *
 * @param {number} fallbackTimeout - Optional maximum time to wait before forcing true (in ms).
 * @returns {boolean}
 */
export function useInteraction(fallbackTimeout = 10000) {
    const [hasInteracted, setHasInteracted] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        let timer;
        
        const onInteract = () => {
            setHasInteracted(true);
            clearEvents();
        };

        const clearEvents = () => {
            window.removeEventListener('mousemove', onInteract);
            window.removeEventListener('scroll', onInteract);
            window.removeEventListener('touchstart', onInteract);
            window.removeEventListener('keydown', onInteract);
            window.removeEventListener('click', onInteract);
            if (timer) clearTimeout(timer);
        };

        // Attach listeners
        window.addEventListener('mousemove', onInteract, { once: true, passive: true });
        window.addEventListener('scroll', onInteract, { once: true, passive: true });
        window.addEventListener('touchstart', onInteract, { once: true, passive: true });
        window.addEventListener('keydown', onInteract, { once: true, passive: true });
        window.addEventListener('click', onInteract, { once: true, passive: true });

        // Fallback timer to ensure it eventually loads if the user just stares at the screen
        if (fallbackTimeout > 0) {
            timer = setTimeout(() => {
                onInteract();
            }, fallbackTimeout);
        }

        return clearEvents;
    }, [fallbackTimeout]);

    return hasInteracted;
}
