import React, { useCallback, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import AnimatedBackground from '@/sections/AnimatedBackground';
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
    lastSyncTime,
    settingsData = {}
}) => {
    // Dual states for sidebar toggle
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [headerHeight, setHeaderHeight] = useState(56);

    const handleHeaderHeightChange = useCallback((nextHeight) => {
        if (!Number.isFinite(nextHeight)) return;
        const normalizedHeight = Math.max(56, Math.round(nextHeight));
        setHeaderHeight((prev) => (Math.abs(prev - normalizedHeight) > 1 ? normalizedHeight : prev));
    }, []);

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
        <div
            className={styles.layout}
            data-admin-theme="true"
            data-theme={theme}
            style={{ '--admin-header-height': `${headerHeight}px` }}
        >
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
                onHeightChange={handleHeaderHeightChange}
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
                lastSyncTime={lastSyncTime}
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
