import React, { useState, useEffect } from 'react';
import styles from './Navbar.module.scss';
import { Link, useLocation } from 'react-router-dom';
import { useFirebaseDoc } from '../hooks/useFirebaseData';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const isHome = location.pathname === '/';

    const { data: generalContent } = useFirebaseDoc('content', 'general', {
        logoText: 'Phearum',
        logoHighlight: 'Kem'
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

    const navItems = ['home', 'experience', 'projects', 'contact', 'about'];

    return (
        <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
            <div className={styles.container}>
                <div className={styles.logo}>
                    <Link to="/" onClick={(e) => { if (isHome) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}>
                        {generalContent.logoHighlight}<span className={styles.highlight}>{generalContent.logoText}</span>
                    </Link>
                </div>

                <div className={`${styles.hamburger} ${isOpen ? styles.hamburgerOpen : ''}`} onClick={() => setIsOpen(!isOpen)}>
                    <span />
                    <span />
                    <span />
                </div>

                {/* Backdrop for mobile */}
                {isOpen && <div className={styles.backdrop} onClick={() => setIsOpen(false)} />}

                <ul className={`${styles.navLinks} ${isOpen ? styles.active : ''}`}>
                    {isHome ? (
                        navItems.map(item => (
                            <li key={item}>
                                <button onClick={() => scrollToSection(item)}>
                                    {item.charAt(0).toUpperCase() + item.slice(1)}
                                </button>
                            </li>
                        ))
                    ) : (
                        <li><Link to="/">Back to Home</Link></li>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
