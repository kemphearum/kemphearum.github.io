import React, { useEffect, useRef } from 'react';
import styles from './Header.module.scss';
import { LogOut, Sun, Moon, ExternalLink, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router';

const Header = ({ 
    onToggleSidebar, 
    user, 
    userRole, 
    userDisplayName, 
    theme, 
    toggleTheme, 
    onLogout,
    onSettingsClick,
    onProfileClick,
    currentRoute,
    isSettingsAllowed,
    onHeightChange
}) => {
    const navigate = useNavigate();
    const headerRef = useRef(null);

    useEffect(() => {
        if (!onHeightChange || !headerRef.current) return;

        const updateHeight = () => {
            if (!headerRef.current) return;
            const nextHeight = headerRef.current.getBoundingClientRect().height;
            onHeightChange(nextHeight);
        };

        updateHeight();

        let resizeObserver = null;
        if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(updateHeight);
            resizeObserver.observe(headerRef.current);
        }

        window.addEventListener('resize', updateHeight);
        return () => {
            if (resizeObserver) resizeObserver.disconnect();
            window.removeEventListener('resize', updateHeight);
        };
    }, [onHeightChange]);

    // Recreate Settings & Profile icons since they are extracted from Admin
    const icons = {
        settings: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
        ),
        profile: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
        )
    };

    return (
        <header ref={headerRef} className={styles.header}>
            <div className={styles.left}>
                <button className={styles.menuToggle} onClick={onToggleSidebar}>
                    <span /><span /><span />
                </button>
                <span className={styles.brand}>Admin<span>.</span></span>
            </div>

            <div className={styles.center}>
                <div className={styles.searchInputWrapper}>
                    <Search />
                    <input type="text" placeholder="Search admin..." disabled />
                </div>
            </div>

            <div className={styles.right}>
                <button onClick={() => navigate('/')} className={styles.viewSiteBtn}>
                    <ExternalLink size={16} />
                    <span>View Live Site</span>
                </button>

                <div className={styles.topActions}>
                    <button onClick={toggleTheme} className={styles.actionBtn} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    {isSettingsAllowed && (
                        <button 
                            onClick={onSettingsClick} 
                            className={`${styles.actionBtn} ${currentRoute === 'settings' ? styles['actionBtn--active'] : ''}`} 
                            title="Settings"
                        >
                            {icons.settings}
                        </button>
                    )}

                    <button 
                        onClick={onProfileClick} 
                        className={`${styles.actionBtn} ${currentRoute === 'profile' ? styles['actionBtn--active'] : ''}`} 
                        title="My Profile"
                    >
                        {icons.profile}
                    </button>

                    <button onClick={onLogout} className={`${styles.actionBtn} ${styles.logoutBtn}`} title="Logout">
                        <LogOut size={18} />
                    </button>
                </div>

                <div className={styles.userInfo}>
                    <div className={styles.avatar}>
                        {(userDisplayName || user?.email || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.userText}>
                        <span className={styles.email} title={user?.email}>{userDisplayName || user?.email}</span>
                        <span className={styles.role}>{userRole || 'Loading...'}</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
