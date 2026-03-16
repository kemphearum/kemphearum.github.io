import React from 'react';
import { FileText } from 'lucide-react';
import styles from '../../../pages/admin/styles/adminSidebar.module.scss';

const AdminSidebar = ({ 
    sidebarOpen, 
    userRole, 
    rolePermissions, 
    activeTab, 
    handleTabClick, 
    tabLabels, 
    icons, 
    unreadMessagesCount,
    isTabAllowed
}) => {
    return (
        <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.sidebarClosed : ''} ${sidebarOpen ? styles.sidebarOpenMobile : ''}`}>
            <nav className={styles.sidebarNav}>
                {Object.keys(tabLabels).filter(tab => {
                    if (tab === 'profile' || tab === 'settings') return false; // Handled in top bar
                    return isTabAllowed(tab, userRole, rolePermissions);
                }).map(tab => (
                    <button key={tab} className={activeTab === tab ? styles.active : ''} onClick={() => handleTabClick(tab)}>
                        {icons[tab] || <FileText size={18} />}
                        <span>{tabLabels[tab]}</span>
                        {tab === 'messages' && unreadMessagesCount > 0 && (
                            <span className={styles.badge} style={{ background: 'linear-gradient(135deg, #6C63FF, #8B83FF)', color: '#fff', boxShadow: '0 2px 8px rgba(108, 99, 255, 0.4)' }}>{unreadMessagesCount}</span>
                        )}
                    </button>
                ))}
            </nav>
        </aside>
    );
};

export default AdminSidebar;
