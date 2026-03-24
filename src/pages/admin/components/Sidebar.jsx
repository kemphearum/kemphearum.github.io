import React from 'react';
import styles from './Sidebar.module.scss';
import { FileText, Database, BarChart2 } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';

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

    const menuGroups = [
        {
            title: t('admin.sidebar.groups.main'),
            items: [
                {
                    key: 'general',
                    label: t('admin.tabs.general'),
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                    )
                },
                {
                    key: 'experience',
                    label: t('admin.tabs.experience'),
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        </svg>
                    )
                },
                {
                    key: 'projects',
                    label: t('admin.tabs.projects'),
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                    )
                }
            ]
        },
        {
            title: t('admin.sidebar.groups.management'),
            items: [
                {
                    key: 'blog',
                    label: t('admin.tabs.blog'),
                    icon: <FileText size={18} />
                },
                {
                    key: 'messages',
                    label: t('admin.tabs.messages'),
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                    ),
                    badge: unreadMessagesCount > 0 ? unreadMessagesCount : null
                },
                {
                    key: 'database',
                    label: t('admin.tabs.database'),
                    icon: <Database size={18} />
                }
            ]
        },
        {
            title: t('admin.sidebar.groups.system'),
            items: [
                {
                    key: 'users',
                    label: t('admin.tabs.users'),
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    )
                },
                {
                    key: 'audit',
                    label: t('admin.tabs.audit'),
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                    )
                },
                {
                    key: 'analytics',
                    label: t('admin.tabs.analytics'),
                    icon: <BarChart2 size={18} />
                }
            ]
        }
    ];

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
                    {menuGroups.map((group, gIndex) => {
                        // Filter items that current user has access to
                        const allowedItems = group.items.filter(item => isTabAllowed(item.key, userRole, rolePermissions));
                        
                        // Ignore rendering empty groups
                        if (allowedItems.length === 0) return null;

                        return (
                            <div key={gIndex} className={styles.group}>
                                <div className={styles.sectionTitle}>{group.title}</div>
                                {allowedItems.map(item => (
                                    <button 
                                        key={item.key} 
                                        className={`${styles.navItem} ${currentRoute === item.key ? styles['navItem--active'] : ''}`} 
                                        onClick={() => onNavigate(item.key)}
                                        title={isCollapsed ? item.label : undefined}
                                    >
                                        {item.icon}
                                        <span className={styles.label}>{item.label}</span>
                                        {item.badge && (
                                            <span className={styles.badge}>{item.badge}</span>
                                        )}
                                    </button>
                                ))}
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
