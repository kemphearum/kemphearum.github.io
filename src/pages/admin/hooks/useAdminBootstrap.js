import { useEffect } from 'react';
import { isAdminRole, isSuperAdminRole } from '../../../utils/permissions';
import SettingsService from '../../../services/SettingsService';

export const useAdminBootstrap = ({
    activeTab,
    setActiveTab,
    sidebarPersistent,
    settingsData,
    notificationsEnabledRef,
    setLastSyncTime,
    isAuthLoading,
    user,
    userRole,
    isTabAllowed,
    rolePermissions,
    fetchRolePermissions,
    fetchMessages,
    fetchSectionData,
    queryClient
}) => {
    useEffect(() => {
        const interval = setInterval(() => {
            setLastSyncTime(new Date());
        }, 300000);
        return () => clearInterval(interval);
    }, [setLastSyncTime]);

    useEffect(() => {
        localStorage.setItem('adminActiveTab', activeTab);
    }, [activeTab]);

    useEffect(() => {
        localStorage.setItem('adminSidebarPersistent', JSON.stringify(sidebarPersistent));
    }, [sidebarPersistent]);

    useEffect(() => {
        notificationsEnabledRef.current = settingsData.notificationsEnabled !== false;
    }, [notificationsEnabledRef, settingsData.notificationsEnabled]);

    useEffect(() => {
        if (!isAuthLoading && userRole && !isTabAllowed(activeTab, userRole, rolePermissions)) {
            console.log(`Access denied to tab '${activeTab}' for role '${userRole}'. Redirecting to profile.`);
            setActiveTab('profile');
        }
    }, [activeTab, isAuthLoading, isTabAllowed, rolePermissions, setActiveTab, userRole]);

    useEffect(() => {
        if (user && userRole) {
            // Dynamic roles depend on rolePermissions for tab visibility/action capability.
            // Fetch for every authenticated user role (not only static admin roles).
            fetchRolePermissions();
            if (isAdminRole(userRole)) {
                fetchMessages();
            }

            ['home', 'about', 'contact', 'settings'].forEach(fetchSectionData);
        }
    }, [fetchMessages, fetchRolePermissions, fetchSectionData, user, userRole]);

    useEffect(() => {
        if (!isSuperAdminRole(userRole)) return;

        const runMigration = async () => {
            try {
                const { doc, getDoc, deleteDoc } = await import('firebase/firestore');
                const { db } = await import('../../../firebase');

                const globalSnap = await getDoc(doc(db, 'settings', 'global'));
                if (globalSnap.exists()) {
                    const data = globalSnap.data();
                    if (data.site && data.typography && data.audit) return;
                }

                console.log('Starting Firestore settings migration...');
                const [contentSettings, oldAdmin, oldAudit] = await Promise.all([
                    getDoc(doc(db, 'content', 'settings')),
                    getDoc(doc(db, 'settings', 'admin')),
                    getDoc(doc(db, 'settings', 'auditConfig'))
                ]);

                const hasData = contentSettings.exists() || oldAdmin.exists() || oldAudit.exists();
                if (!hasData) return;

                const legacy = contentSettings.data() || {};
                const adminLegacy = oldAdmin.data() || {};
                const auditLegacy = oldAudit.data() || {};

                const payload = {
                    site: {
                        title: legacy.title || legacy.pageTitle || 'Portfolio',
                        favicon: legacy.favicon || legacy.pageFaviconUrl || '',
                        logoHighlight: legacy.logoHighlight || 'KEM',
                        logoText: legacy.logoText || 'PHEARUM',
                        tagline: legacy.tagline || '',
                        footerText: legacy.footerText || '',
                        projectFilters: legacy.projectFilters || '',
                        blogFilters: legacy.blogFilters || ''
                    },
                    typography: {
                        fontDisplay: legacy.fontDisplay || 'inter',
                        fontHeading: legacy.fontHeading || 'inter',
                        fontSubheading: legacy.fontSubheading || 'inter',
                        fontNav: legacy.fontNav || 'inter',
                        fontBody: legacy.fontBody || 'inter',
                        fontUI: legacy.fontUI || 'inter',
                        fontSize: legacy.fontSize || 'default',
                        adminFontOverride: legacy.adminFontOverride ?? true
                    },
                    audit: {
                        logAll: auditLegacy.logAll ?? true,
                        logReads: auditLegacy.logReads ?? true,
                        logWrites: auditLegacy.logWrites ?? true,
                        logDeletes: auditLegacy.logDeletes ?? true,
                        logAnonymous: auditLegacy.logAnonymous ?? false
                    },
                    system: {
                        sidebarPersistent: adminLegacy.sidebarPersistent ?? true
                    }
                };

                await SettingsService.setFullSettings(payload);
                await Promise.all([
                    deleteDoc(doc(db, 'content', 'settings')),
                    deleteDoc(doc(db, 'settings', 'admin')),
                    deleteDoc(doc(db, 'settings', 'auditConfig'))
                ]);
                queryClient.invalidateQueries({ queryKey: ['settings', 'global'] });
                fetchSectionData('settings');
            } catch (error) {
                console.error('Migration failed:', error);
            }
        };

        runMigration();
    }, [fetchSectionData, queryClient, userRole]);
};

export default useAdminBootstrap;
