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
    // 1. Initialize to 'dark' to perfectly match SSG pre-render and avoid Hydration Mismatch
    const [theme, setTheme] = useState('dark');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // 2. On mount, read the actual preferred theme from localStorage
        const saved = localStorage.getItem('portfolio-theme');
        const actualTheme = saved || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTheme(actualTheme);
        setIsMounted(true);
    }, []);

    useEffect(() => {
        // 3. Only sync to DOM AFTER we have resolved the true client-side theme.
        // This prevents React from accidentally overriding the <script> tag's theme during hydration.
        if (!isMounted) return;
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.style.colorScheme = theme;
        localStorage.setItem('portfolio-theme', theme);
    }, [theme, isMounted]);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
