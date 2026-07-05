import React, { createContext, useContext, useState, useEffect } from 'react';

const defaultThemeContext = {
    theme: 'dark',
    // Safe fallback when a component renders outside ThemeProvider
    toggleTheme: () => {}
};

const ThemeContext = createContext(defaultThemeContext);

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context || typeof context !== 'object') {
        return defaultThemeContext;
    }
    return {
        theme: context.theme || 'dark',
        toggleTheme: typeof context.toggleTheme === 'function' ? context.toggleTheme : defaultThemeContext.toggleTheme
    };
};

export const ThemeProvider = ({ children }) => {
    // 1. Initialize from localStorage immediately on the client to prevent theme flashing
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = window.localStorage.getItem('portfolio-theme');
                if (saved) return saved;
                if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
            } catch (e) {
                console.warn('Error reading theme from localStorage', e);
            }
        }
        return 'dark'; // SSG default
    });
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.style.colorScheme = theme;
        try {
            window.localStorage.setItem('portfolio-theme', theme);
        } catch (error) {
            console.warn('Failed to save theme to localStorage:', error);
        }
    }, [theme, isMounted]);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
