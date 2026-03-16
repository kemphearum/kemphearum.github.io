import React from 'react';
import { ExternalLink, Sun, Moon, LogOut } from 'lucide-react';
import styles from '../../../pages/admin/styles/adminHeader.module.scss';
import AuthService from '../../../services/AuthService';

const AdminHeader = ({ 
    theme, 
    toggleTheme, 
    sidebarOpen, 
    setSidebarOpen, 
    user, 
    userRole, 
    userDisplayName, 
    activeTab, 
    handleTabClick,
    rolePermissions,
    navigate,
    icons
}) => {
    return (
        <div className={styles.topNavBar}>
            <div className={styles.topNavLeft}>
                <button className={styles.menuToggle} onClick={() => setSidebarOpen(!sidebarOpen)}>
                    <span /><span /><span />
                </button>
                <span className={styles.brand}>Admin<span>.</span></span>
            </div>

            <div className={styles.headerRight}>
                <button onClick={() => navigate('/')} className={styles.viewSiteBtn}>
                    <ExternalLink size={16} />
                    <span className={styles.hideOnMobile}>View Live Site</span>
                </button>

                <div className={styles.topActions}>
                    <button onClick={toggleTheme} className={styles.topActionBtn} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    {(userRole === 'superadmin' || (userRole && rolePermissions[userRole]?.includes('settings'))) && (
                        <button onClick={() => handleTabClick('settings')} className={`${styles.topActionBtn} ${activeTab === 'settings' ? styles.activeBarTab : ''}`} title="Settings">
                            {icons['settings']}
                        </button>
                    )}

                    <button onClick={() => handleTabClick('profile')} className={`${styles.topActionBtn} ${activeTab === 'profile' ? styles.activeBarTab : ''}`} title="My Profile">
                        {icons['profile']}
                    </button>

                    <button onClick={() => AuthService.logout()} className={`${styles.topActionBtn} ${styles.logoutActionBtn}`} title="Logout">
                        <LogOut size={18} />
                    </button>
                </div>

                <div className={styles.headerUserInfo}>
                    <div className={styles.headerAvatar}>{(userDisplayName || user?.email)?.charAt(0).toUpperCase()}</div>
                    <div className={styles.headerUserText}>
                        <span className={styles.headerUserEmail} title={user?.email}>{userDisplayName || user?.email}</span>
                        <span className={styles.headerUserRole}>{userRole || 'Loading...'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminHeader;
