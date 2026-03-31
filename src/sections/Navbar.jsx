import React, { useState, useEffect } from 'react';
import styles from './Navbar.module.scss';
import { Link, useLocation, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import SettingsService from '../services/SettingsService';
import { useTheme } from '../context/ThemeContext';
import LanguageSwitcher from '../shared/components/LanguageSwitcher';
import { useTranslation } from '../hooks/useTranslation';
import { normalizeSectionTarget } from '../utils/sectionNavigation';
import { getLocalizedField } from '../utils/localization';

const SECTION_IDS = ['home', 'about', 'experience', 'projects', 'blog', 'contact'];

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState('home');
    const location = useLocation();
    const navigate = useNavigate();
    const { language, t } = useTranslation();
    const isHome = location.pathname === '/';
    const currentHash = (location.hash || '').replace('#', '');
    const themeContext = useTheme() || { theme: 'dark', toggleTheme: () => {} };
    const { theme, toggleTheme } = themeContext;
    const navItems = [
        { key: 'home', type: 'section', label: t('nav.home') },
        { key: 'about', type: 'section', label: t('nav.about') },
        { key: 'experience', type: 'section', label: t('nav.experience') },
        { key: 'projects', type: 'route', to: '/projects', label: t('nav.projects') },
        { key: 'blog', type: 'route', to: '/blog', label: t('nav.blog') },
        { key: 'contact', type: 'section', label: t('nav.contact') }
    ];

    const { data: globalConfig } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
        queryKey: ['settings', 'global'],
        queryFn: () => SettingsService.fetchGlobalSettings()
    });

    const settings = globalConfig?.site || globalConfig || {
        logoText: '',
        logoHighlight: ''
    };
    const logoHighlight = getLocalizedField(settings.logoHighlight, language);
    const logoText = getLocalizedField(settings.logoText, language);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (!isHome) return undefined;

        const detectActiveSection = () => {
            const headerOffset = 80;
            const viewportAnchor = window.innerHeight * 0.3;
            let next = 'home';

            for (const id of SECTION_IDS) {
                const element = document.getElementById(id);
                if (!element) continue;
                const rect = element.getBoundingClientRect();
                if (rect.top - headerOffset <= viewportAnchor && rect.bottom > headerOffset) {
                    next = id;
                }
            }

            setActiveSection((prev) => (prev === next ? prev : next));
        };

        detectActiveSection();
        window.addEventListener('scroll', detectActiveSection, { passive: true });
        window.addEventListener('resize', detectActiveSection);
        return () => {
            window.removeEventListener('scroll', detectActiveSection);
            window.removeEventListener('resize', detectActiveSection);
        };
    }, [isHome]);

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

    useEffect(() => {
        if (!isOpen) return undefined;

        const handleEscape = (event) => {
            if (event.key === 'Escape') setIsOpen(false);
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    const scrollToSection = (id) => {
        const targetId = normalizeSectionTarget(id);
        
        // Close menu first
        if (isOpen) {
            setIsOpen(false);
            // Small delay to allow body overflow to be restored by the useEffect
            setTimeout(() => performScroll(targetId), 50);
        } else {
            performScroll(targetId);
        }
    };

    const performScroll = (targetId) => {
        if (!isHome) {
            navigate(`/#${targetId}`);
            return;
        }

        const element = document.getElementById(targetId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setActiveSection(targetId);
            const nextUrl = targetId === 'home' ? '/' : `/#${targetId}`;
            window.history.replaceState(null, '', nextUrl);
        }
    };

    const handleRouteNavigation = () => {
        if (isOpen) {
            setIsOpen(false);
            // Wait for mobile menu/body-lock cleanup before forcing top.
            setTimeout(() => {
                window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            }, 50);
            return;
        }

        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    };

    const isItemActive = (item) => {
        if (item.key === 'blog') {
            if (isHome) return activeSection === 'blog';
            return location.pathname === '/blog' || location.pathname.startsWith('/blog/');
        }
        if (item.key === 'projects') {
            return location.pathname === '/projects' || location.pathname.startsWith('/projects/');
        }
        if (location.pathname !== '/') {
            return currentHash === item.key;
        }
        return activeSection === item.key;
    };


    return (
        <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''} ${isOpen ? styles.menuOpen : ''}`}>
            <div className={styles.container}>
                <div className={styles.logo}>
                    <Link
                        to="/"
                        onClick={(e) => {
                            setIsOpen(false);
                            if (isHome) {
                                e.preventDefault();
                                setActiveSection('home');
                                window.history.replaceState(null, '', '/');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                        }}
                    >
                        {logoHighlight}<span className={styles.highlight}>{logoText}</span>
                    </Link>
                </div>

                <div className={styles.navRight}>
                    <ul id="primary-navigation" className={`${styles.navLinks} ${isOpen ? styles.active : ''}`} aria-label={t('nav.primary')}>
                        {navItems.map((item) => {
                            const active = isItemActive(item);
                            return (
                            <li key={item.key}>
                                {item.type === 'route' ? (
                                    <Link
                                        to={item.to}
                                        onClick={handleRouteNavigation}
                                        className={active ? styles.activeNav : ''}
                                        aria-current={active ? 'page' : undefined}
                                    >
                                        {item.label}
                                    </Link>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => scrollToSection(item.key)}
                                        className={active ? styles.activeNav : ''}
                                        aria-current={active ? 'page' : undefined}
                                    >
                                        {item.label}
                                    </button>
                                )}
                            </li>
                        )})}
                    </ul>

                    <div className={styles.desktopControls}>
                        <LanguageSwitcher />
                        <button
                            className={styles.themeToggle}
                            onClick={toggleTheme}
                            aria-label={theme === 'dark'
                                ? t('admin.header.switchTheme', { mode: t('admin.common.light') })
                                : t('admin.header.switchTheme', { mode: t('admin.common.dark') })}
                            title={theme === 'dark'
                                ? t('admin.header.switchTheme', { mode: t('admin.common.light') })
                                : t('admin.header.switchTheme', { mode: t('admin.common.dark') })}
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
                    </div>

                    <div className={styles.mobileControls}>
                        <LanguageSwitcher />
                        <button
                            className={styles.themeToggle}
                            onClick={toggleTheme}
                            aria-label={theme === 'dark'
                                ? t('admin.header.switchTheme', { mode: t('admin.common.light') })
                                : t('admin.header.switchTheme', { mode: t('admin.common.dark') })}
                            title={theme === 'dark'
                                ? t('admin.header.switchTheme', { mode: t('admin.common.light') })
                                : t('admin.header.switchTheme', { mode: t('admin.common.dark') })}
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
                        <button
                            type="button"
                            className={`${styles.mobileIconBtn} ${styles.mobileMenuToggle}`}
                            onClick={() => setIsOpen((prev) => !prev)}
                            aria-expanded={isOpen}
                            aria-controls="primary-navigation"
                            aria-label={isOpen ? t('nav.close') : t('nav.open')}
                        >
                            {isOpen ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="3" y1="6" x2="21" y2="6" />
                                    <line x1="3" y1="12" x2="21" y2="12" />
                                    <line x1="3" y1="18" x2="21" y2="18" />
                                </svg>
                            )}
                        </button>
                    </div>

                    <button
                        type="button"
                        className={`${styles.hamburger} ${isOpen ? styles.hamburgerOpen : ''}`}
                        onClick={() => setIsOpen(!isOpen)}
                        aria-expanded={isOpen}
                        aria-controls="primary-navigation"
                        aria-label={isOpen
                            ? t('nav.close')
                            : t('nav.open')}
                    >
                        <span />
                        <span />
                        <span />
                    </button>
                </div>

                {/* Backdrop for mobile */}
                {isOpen && (
                    <button
                        type="button"
                        className={styles.backdrop}
                        onClick={() => setIsOpen(false)}
                        aria-label={t('nav.close')}
                    />
                )}
            </div>
        </nav>
    );
};

export default Navbar;

