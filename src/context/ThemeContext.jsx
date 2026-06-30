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
    const [theme, setTheme] = useState(() => {
        if (typeof window === 'undefined') return 'dark';
        const saved = localStorage.getItem('portfolio-theme');
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.style.colorScheme = theme;
        localStorage.setItem('portfolio-theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
