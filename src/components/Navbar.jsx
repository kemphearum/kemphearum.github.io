import React, { useState, useEffect } from 'react';
import styles from './Navbar.module.scss';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const isHome = location.pathname === '/';

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id) => {
        setIsOpen(false);
        if (!isHome) {
            // If not on home, we can't scroll. This link should act as a route change then scroll.
            // But for simplicity, we assume this is only used on Home.
            return;
        }
        const element = document.getElementById(id);
        if (element) {
            const headerOffset = 70;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };

    return (
        <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
            <div className={styles.container}>
                <div className={styles.logo}>
                    <Link to="/" onClick={(e) => { if (isHome) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}>
                        Dev<span className={styles.highlight}>Portfolio</span>
                    </Link>
                </div>

                <div className={styles.hamburger} onClick={() => setIsOpen(!isOpen)}>
                    <span className={isOpen ? styles.open : ''}></span>
                    <span className={isOpen ? styles.open : ''}></span>
                    <span className={isOpen ? styles.open : ''}></span>
                </div>

                <ul className={`${styles.navLinks} ${isOpen ? styles.active : ''}`}>
                    {isHome ? (
                        <>
                            <li><button onClick={() => scrollToSection('home')}>Home</button></li>
                            <li><button onClick={() => scrollToSection('about')}>About</button></li>
                            <li><button onClick={() => scrollToSection('projects')}>Projects</button></li>
                            <li><button onClick={() => scrollToSection('contact')}>Contact</button></li>
                        </>
                    ) : (
                        <li><Link to="/">Back to Home</Link></li>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
