import { useEffect, useState } from 'react';

const RECENT_KEY = 'admin.palette.recent';
const RECENT_MAX = 8;

export const readRecent = () => {
    if (typeof window === 'undefined') return [];
    try {
        const parsed = JSON.parse(window.localStorage.getItem(RECENT_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

export const pushRecent = (entry) => {
    if (typeof window === 'undefined' || !entry?.id) return readRecent();
    const list = readRecent().filter((item) => !(item.type === entry.type && item.id === entry.id));
    const next = [entry, ...list].slice(0, RECENT_MAX);
    try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
        /* ignore quota / serialization errors */
    }
    return next;
};

/**
 * Global Cmd/Ctrl+K toggle for the command palette. Returns the open state and a
 * setter; the listener is registered once for the lifetime of the host.
 */
export const useCommandPalette = () => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if ((event.metaKey || event.ctrlKey) && (event.key === 'k' || event.key === 'K')) {
                event.preventDefault();
                setOpen((value) => !value);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return { open, setOpen };
};

export default useCommandPalette;
