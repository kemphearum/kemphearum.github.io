import React, { useState, useEffect } from 'react';
import styles from './Navbar.module.scss';
import { Link, useLocation } from 'react-router-dom';
import { useFirebaseDoc } from '../hooks/useFirebaseData';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const isHome = location.pathname === '/';
    const { theme, toggleTheme } = useTheme();

    const { data: settings } = useFirebaseDoc('content', 'settings', {
        logoText: '',
        logoHighlight: ''
    });

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) setIsOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const scrollToSection = (id) => {
        setIsOpen(false);
        if (!isHome) return;
        const element = document.getElementById(id);
        if (element) {
            const headerOffset = 70;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }
    };

    const navItems = ['home', 'about', 'experience', 'projects', 'blog', 'contact'];

    return (
        <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
            <div className={styles.container}>
                <div className={styles.logo}>
                    <Link to="/" onClick={(e) => { if (isHome) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}>
                        {settings.logoHighlight}<span className={styles.highlight}>{settings.logoText}</span>
                    </Link>
                </div>

                <div className={styles.navRight}>
                    <ul className={`${styles.navLinks} ${isOpen ? styles.active : ''}`}>
                        {navItems.map(item => (
                            <li key={item}>
                                {item === 'blog' ? (
                                    <Link to="/blog" onClick={() => setIsOpen(false)}>
                                        {item.charAt(0).toUpperCase() + item.slice(1)}
                                    </Link>
                                ) : (
                                    isHome ? (
                                        <button onClick={() => scrollToSection(item)}>
                                            {item.charAt(0).toUpperCase() + item.slice(1)}
                                        </button>
                                    ) : (
                                        <Link to={`/#${item}`}>
                                            {item.charAt(0).toUpperCase() + item.slice(1)}
                                        </Link>
                                    )
                                )}
                            </li>
                        ))}
                    </ul>

                    <button
                        className={styles.themeToggle}
                        onClick={toggleTheme}
                        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        {theme === 'dark' ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="5" />
                                <line x1="12" y1="1" x2="12" y2="3" />
                                <line x1="12" y1="21" x2="12" y2="23" />
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                <line x1="1" y1="12" x2="3" y2="12" />
                                <line x1="21" y1="12" x2="23" y2="12" />
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        )}
                    </button>

                    <div className={`${styles.hamburger} ${isOpen ? styles.hamburgerOpen : ''}`} onClick={() => setIsOpen(!isOpen)}>
                        <span />
                        <span />
                        <span />
                    </div>
                </div>

                {/* Backdrop for mobile */}
                {isOpen && <div className={styles.backdrop} onClick={() => setIsOpen(false)} />}
            </div>
        </nav>
    );
};

export default Navbar;
