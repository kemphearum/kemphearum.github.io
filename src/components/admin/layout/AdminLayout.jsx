import React from 'react';
import styles from '../../../pages/admin/styles/adminLayout.module.scss';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

const AdminLayout = ({ 
    children, 
    sidebarOpen, 
    setSidebarOpen, 
    activeTab, 
    tabLabels,
    ...props 
}) => {
    return (
        <div className={styles.adminLayout}>
            <AdminHeader 
                sidebarOpen={sidebarOpen} 
                setSidebarOpen={setSidebarOpen} 
                activeTab={activeTab}
                {...props} 
            />

            {/* Backdrop */}
            {sidebarOpen && <div className={styles.backdrop} onClick={() => setSidebarOpen(false)} />}

            <AdminSidebar 
                sidebarOpen={sidebarOpen} 
                activeTab={activeTab} 
                tabLabels={tabLabels}
                {...props} 
            />

            {/* Main Content */}
            <main className={`${styles.mainContent} ${!sidebarOpen ? styles.contentExpanded : ''}`}>
                <div className={styles.contentHeader}>
                    <div>
                        <h1>{tabLabels[activeTab] || 'Dashboard'}</h1>
                        <p className={styles.headerSubtitle}>
                            {activeTab === 'general' ? 'Manage your portfolio primary content' : 
                             activeTab === 'profile' ? 'Manage your personal profile and account settings' :
                             activeTab === 'settings' ? 'Configure site-wide identity, visual aesthetics, and synchronization' :
                             'Administrator Dashboard'}
                        </p>
                    </div>
                </div>

                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
