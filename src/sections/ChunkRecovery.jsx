import { useEffect } from 'react';

const STORAGE_KEY = 'vite:preload-error-reloaded';

const ChunkRecovery = () => {
    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const handlePreloadError = (event) => {
            event.preventDefault?.();

            if (window.sessionStorage.getItem(STORAGE_KEY) === 'true') return;
            window.sessionStorage.setItem(STORAGE_KEY, 'true');
            window.location.reload();
        };

        window.addEventListener('vite:preloadError', handlePreloadError);
        return () => {
            window.removeEventListener('vite:preloadError', handlePreloadError);
        };
    }, []);

    return null;
};

export default ChunkRecovery;
