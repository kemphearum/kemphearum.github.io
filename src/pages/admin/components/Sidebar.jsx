import React from 'react';
import styles from './Sidebar.module.scss';
import { FileText, Database, BarChart2 } from 'lucide-react';

const Sidebar = ({ 
    currentRoute, 
    onNavigate, 
    isCollapsed, 
    isMobileOpen, 
    onCloseMobile, 
    unreadMessagesCount, 
    userRole, 
    rolePermissions, 
    isTabAllowed 
}) => {
    const menuGroups = [
        {
            title: 'MAIN',
            items: [
                {
                    key: 'general',
                    label: 'General Content',
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                    )
                },
                {
                    key: 'experience',
                    label: 'Experience',
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        </svg>
                    )
                },
                {
                    key: 'projects',
                    label: 'Projects',
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                    )
                }
            ]
        },
        {
            title: 'MANAGEMENT',
            items: [
                {
                    key: 'blog',
                    label: 'Blog',
                    icon: <FileText size={18} />
                },
                {
                    key: 'messages',
                    label: 'Messages',
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                    ),
                    badge: unreadMessagesCount > 0 ? unreadMessagesCount : null
                },
                {
                    key: 'database',
                    label: 'Database',
                    icon: <Database size={18} />
                }
            ]
        },
        {
            title: 'SYSTEM',
            items: [
                {
                    key: 'users',
                    label: 'User Management',
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    )
                },
                {
                    key: 'audit',
                    label: 'Audit Logs',
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                    )
                },
                {
                    key: 'analytics',
                    label: 'Analytics',
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
                                        <span>{item.label}</span>
                                        {item.badge && (
                                            <span className={styles.badge}>{item.badge}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;
