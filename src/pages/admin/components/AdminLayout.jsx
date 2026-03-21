import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import AnimatedBackground from '../../../components/AnimatedBackground';
import styles from './AdminLayout.module.scss';

const AdminLayout = ({ 
    children, 
    currentRoute, 
    onNavigate, 
    user, 
    userRole, 
    userDisplayName, 
    theme, 
    toggleTheme, 
    onLogout,
    rolePermissions,
    isTabAllowed,
    unreadMessagesCount,
    title,
    subtitle,
    settingsData = {}
}) => {
    // Dual states for sidebar toggle
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsMobileOpen(!isMobileOpen);
        } else {
            setIsCollapsed(!isCollapsed);
        }
    };

    const handleNavigate = (route) => {
        onNavigate(route);
        if (window.innerWidth <= 768) {
            setIsMobileOpen(false); // Close overlay neatly on mobile navigate
        }
    };

    return (
        <div className={styles.layout} data-admin-theme="true" data-theme={theme}>
            <AnimatedBackground 
                variant={settingsData.bgStyle || 'aurora'}
                density={settingsData.bgDensity ?? 30}
                speed={settingsData.bgSpeed ?? 20}
                glowOpacity={settingsData.bgGlowOpacity ?? 40}
                interactive={settingsData.bgInteractive ?? true}
            />
            <Header 
                onToggleSidebar={toggleSidebar} 
                user={user} 
                userRole={userRole} 
                userDisplayName={userDisplayName}
                theme={theme}
                toggleTheme={toggleTheme}
                onLogout={onLogout}
                onSettingsClick={() => handleNavigate('settings')}
                onProfileClick={() => handleNavigate('profile')}
                currentRoute={currentRoute}
                isSettingsAllowed={userRole === 'superadmin' || rolePermissions?.[userRole]?.includes('settings')}
            />
            
            <Sidebar 
                currentRoute={currentRoute}
                onNavigate={handleNavigate}
                isCollapsed={isCollapsed}
                isMobileOpen={isMobileOpen}
                onCloseMobile={() => setIsMobileOpen(false)}
                unreadMessagesCount={unreadMessagesCount}
                userRole={userRole}
                rolePermissions={rolePermissions}
                isTabAllowed={isTabAllowed}
            />
            
            <main className={`${styles.mainContent} ${isCollapsed ? styles['mainContent--collapsed'] : ''}`}>
                <div className={styles.contentHeader}>
                    <div>
                        <h1>{title}</h1>
                        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                    </div>
                </div>
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
