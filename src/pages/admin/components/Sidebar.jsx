import React from 'react';
import styles from './Sidebar.module.scss';
import { useTranslation } from '../../../hooks/useTranslation';
import { NAV_GROUPS, getNavItem } from '../../../registry/navRegistry';

const Sidebar = ({
    currentRoute,
    onNavigate,
    isCollapsed,
    isMobileOpen,
    onCloseMobile,
    unreadMessagesCount,
    userRole,
    rolePermissions,
    isTabAllowed,
    lastSyncTime
}) => {
    const { t, language } = useTranslation();

    const formatSyncTime = (date) => {
        if (!date) return t('admin.sidebar.never');
        return date.toLocaleTimeString(language === 'km' ? 'km-KH' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const badgeValues = { unreadMessagesCount };

    return (
        <>
            {/* Mobile Overlay */}
            <div 
                className={`${styles.overlay} ${isMobileOpen ? styles['overlay--visible'] : ''}`} 
                onClick={onCloseMobile} 
            />

            {/* Sidebar */}
            <aside className={`
                ${styles.sidebar} 
                ${isCollapsed ? styles['sidebar--collapsed'] : ''} 
                ${isMobileOpen ? styles['sidebar--mobileOpen'] : styles['sidebar--mobileClosed']}
            `}>
                <nav className={styles.nav}>
                    {NAV_GROUPS.map((group) => {
                        const allowedItems = group.keys
                            .map(getNavItem)
                            .filter(Boolean)
                            .filter((item) => isTabAllowed(item.key, userRole, rolePermissions));

                        // Ignore rendering empty groups
                        if (allowedItems.length === 0) return null;

                        return (
                            <div key={group.id} className={styles.group}>
                                <div className={styles.sectionTitle}>{t(group.titleKey)}</div>
                                {allowedItems.map((item) => {
                                    const Icon = item.icon;
                                    const label = t(item.labelKey);
                                    const badgeValue = item.badgeKey ? badgeValues[item.badgeKey] : null;

                                    return (
                                        <button
                                            key={item.key}
                                            className={`${styles.navItem} ${currentRoute === item.key ? styles['navItem--active'] : ''}`}
                                            onClick={() => onNavigate(item.key)}
                                            title={isCollapsed ? label : undefined}
                                        >
                                            {Icon && <Icon size={18} />}
                                            <span className={styles.label}>{label}</span>
                                            {badgeValue > 0 && (
                                                <span className={styles.badge}>{badgeValue}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })}
                </nav>

                <div className={styles.syncStatus}>
                    <div className={styles.statusLabel}>{t('admin.sidebar.systemStatus')}</div>
                    <div className={styles.statusMain}>
                        <div className={styles.statusIndicator} title={t('admin.sidebar.connectedSynced')} />
                        <span className={styles.statusTime}>{t('admin.sidebar.syncedAt', { time: formatSyncTime(lastSyncTime) })}</span>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
