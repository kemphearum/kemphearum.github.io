import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import UserService from '../services/UserService';
import MessageService from '../services/MessageService';
import ContentService from '../services/ContentService';
import styles from './Admin.module.scss';
import { useNavigate } from 'react-router-dom';
import {
    LogOut, ChevronLeft, ChevronRight, ExternalLink, FileText, Database, User, BarChart2, Sun, Moon
} from 'lucide-react';
import { getTodayDateKey } from '../utils/dateUtils';
import { fetchGeoData } from '../utils/geoUtils';
import { useTheme } from '../context/ThemeContext';
import { useActivity } from '../hooks/useActivity';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { getSessionId, getDeviceType } from '../hooks/useAnalytics';
import { useQueryClient } from '@tanstack/react-query';
import SettingsService from '../services/SettingsService';
import AuthService from '../services/AuthService';
import AuditLogService from '../services/AuditLogService';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import AdminLayout from './admin/components/AdminLayout';
import { Spinner } from '../shared/components/ui';
import AnimatedBackground from '../components/AnimatedBackground';
import { isActionAllowed, ACTIONS } from '../utils/permissions';

// Tab components
const GeneralTab = lazy(() => import('./admin/tabs/GeneralTab'));
const ProfileTab = lazy(() => import('./admin/tabs/ProfileTab'));
const SettingsTab = lazy(() => import('./admin/tabs/SettingsTab'));
const MessagesTab = lazy(() => import('./admin/tabs/MessagesTab'));
const ExperienceTab = lazy(() => import('./admin/experience/ExperienceTab'));
const UsersTab = lazy(() => import('./admin/users/UsersTab'));
const ProjectsTab = lazy(() => import('./admin/projects/ProjectsTab'));
const BlogTab = lazy(() => import('./admin/blog/BlogTab'));
const DatabaseTab = lazy(() => import('./admin/database/DatabaseTab'));
const AuditLogsTab = lazy(() => import('./admin/audit/AuditLogsTab'));
const AnalyticsTab = lazy(() => import('./admin/tabs/AnalyticsTab'));

// ============================================================
// Icons removed - now handled in modular components
// ============================================================
const tabLabels = {
    general: 'General Content',
    experience: 'Experience',
    projects: 'Projects',
    blog: 'Blog',
    messages: 'Messages',
    database: 'Database',
    users: 'User Management',
    audit: 'Audit Logs',
    analytics: 'Analytics',
    profile: 'My Profile',
    settings: '⚙️ Settings'
};

// ============================================================
// Toast Component
// ============================================================
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose, message]);

    const getIcon = () => {
        switch (type) {
            case 'success': return '✓';
            case 'error': return '✕';
            case 'warning': return '⚠️';
            case 'info': return 'ℹ️';
            default: return '•';
        }
    };

    return (
        <div className={`ui-toast ui-${type}`}>
            <span style={{ fontWeight: 'bold' }}>{getIcon()}</span>
            <p>{message}</p>
            <button onClick={onClose} className="ui-toastClose">×</button>
        </div>
    );
};

// ============================================================
// Admin Component (Shell)
// ============================================================
const Admin = () => {
    // Auth State
    const [user, setUser] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userDisplayName, setUserDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const { loading, execute } = useAsyncAction();
    const queryClient = useQueryClient();

    // Tab & Sidebar State
    const [activeTab, setActiveTab] = useState(() => {
        if (typeof window === 'undefined') return 'profile';
        return localStorage.getItem('adminActiveTab') || 'profile';
    });
    const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth > 992 : true);
    const [sidebarPersistent, setSidebarPersistent] = useState(() => {
        if (typeof window === 'undefined') return true;
        const stored = localStorage.getItem('adminSidebarPersistent');
        return stored !== null ? JSON.parse(stored) : true;
    });

    // Role Permissions
    const [rolePermissions, setRolePermissions] = useState({});

    // Messages for unread badge
    const [messages, setMessages] = useState([]);

    // Toast
    const [toast, setToast] = useState(null);

    // Content Data for simple tabs
    const [homeData, setHomeData] = useState({ greeting: '', name: '', subtitle: '', description: '', ctaText: '', ctaLink: '', profileImageUrl: '' });
    const [aboutData, setAboutData] = useState({ bio: '', skills: '' });
    const [contactData, setContactData] = useState({ introText: '' });
    const [settingsData, setSettingsData] = useState({ 
        logoHighlight: '', logoText: '', tagline: '', footerText: '', 
        projectFilters: '', blogFilters: '', pageTitle: '', pageFaviconUrl: '',
        notificationsEnabled: true
    });

    const showToast = useCallback((message, type = 'success') => {
        if (settingsData.notificationsEnabled !== false) {
            setToast({ message, type });
        }
    }, [settingsData.notificationsEnabled]);

    // Hooks
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { trackRead, trackWrite } = useActivity();

    // ====== Persistence ======
    useEffect(() => { localStorage.setItem('adminActiveTab', activeTab); }, [activeTab]);
    useEffect(() => { localStorage.setItem('adminSidebarPersistent', JSON.stringify(sidebarPersistent)); }, [sidebarPersistent]);

    // ====== Auth ======
    useEffect(() => {
        const unsubscribe = AuthService.onAuthChange(async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    // 1. Try fetching by UID first (new standard)
                    let userData = await UserService.fetchUserById(currentUser.uid);

                    // 2. Fallback to Email (legacy migration)
                    if (!userData) {
                        const legacyData = await UserService.fetchUserByEmail(currentUser.email);
                        if (legacyData) {
                            console.log(`Migrating legacy user ${currentUser.email} to UID-keyed document...`);
                            const { id, ref, ...data } = legacyData;
                            await UserService.createUserDoc(data, currentUser.uid);
                            try {
                                await UserService.deleteUserDoc(id);
                            } catch (cleanupError) {
                                console.warn(`Legacy user doc cleanup failed for ${currentUser.email}, but continuing session natively:`, cleanupError);
                            }
                            userData = await UserService.fetchUserById(currentUser.uid);
                            console.log("Migration successful.");
                        }
                    }

                    // 3. Auto-create if still not found
                    if (!userData) {
                        const initialRole = currentUser.email === 'kem.phearum@gmail.com' ? 'superadmin' : 'pending';
                        await UserService.createUserDoc({
                            email: currentUser.email,
                            role: initialRole,
                            isActive: true
                        }, currentUser.uid);
                        userData = await UserService.fetchUserById(currentUser.uid);
                    }

                    if (userData) {
                        if (userData.isActive === false) {
                            await AuthService.logout();
                            setUser(null); setUserRole(null); setUserId(null); setUserDisplayName('');
                            showToast("Your account has been disabled by an administrator.", "error");
                            setIsAuthLoading(false);
                            return;
                        }

                        let fetchedRole = userData.role;
                        setUserId(userData.id);
                        setUserDisplayName(userData.displayName || '');

                        // Enforce Superadmin for the specific email
                        if (currentUser.email === 'kem.phearum@gmail.com' && fetchedRole !== 'superadmin') {
                            fetchedRole = 'superadmin';
                            UserService.updateUserField(userData.id, { role: 'superadmin' }).catch(console.error);
                        } else if (fetchedRole === 'owner') { // Legacy role name
                            fetchedRole = 'superadmin';
                            UserService.updateUserField(userData.id, { role: 'superadmin' }).catch(console.error);
                        }

                        // Set the role
                        setUserRole(fetchedRole);
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                    setUserRole(currentUser.email === 'kem.phearum@gmail.com' ? 'superadmin' : 'pending');
                } finally { setIsAuthLoading(false); }
            } else {
                setUserRole(null); setUserId(null); setUserDisplayName('');
                setIsAuthLoading(false);
            }
        });
        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ====== Redirection Logic for unauthorized tabs ======
    const isTabAllowed = useCallback((tab, role, permissions) => {
        if (!role) return false;
        if (role === 'superadmin') return true;
        if (tab === 'profile') return true; // Always allowed
        
        // Base block
        if (!isActionAllowed(ACTIONS.VIEW, tab, role, permissions)) return false;

        // Extra protections layer (legacy behavior maintenance)
        if (['users', 'database', 'audit'].includes(tab) && role !== 'superadmin' && role !== 'admin') return false;
        
        if (permissions?.[role]?.includes(tab)) return true;
        
        if (role === 'admin') return true;
        if (role === 'editor') {
            return ['general', 'experience', 'projects', 'blog', 'messages'].includes(tab);
        }
        
        return false;
    }, []);

    useEffect(() => {
        if (!isAuthLoading && userRole && !isTabAllowed(activeTab, userRole, rolePermissions)) {
            console.log(`Access denied to tab '${activeTab}' for role '${userRole}'. Redirecting to profile.`);
            setActiveTab('profile');
        }
    }, [activeTab, userRole, rolePermissions, isAuthLoading, isTabAllowed]);

    // ====== Fetch Role Permissions & Messages (for sidebar) ======
    const fetchRolePermissions = useCallback(async () => {
        try {
            const perms = await UserService.fetchRolePermissions(trackRead);
            setRolePermissions(perms);
        } catch (error) { console.error("Error fetching role permissions:", error); }
    }, [trackRead]);

    const fetchMessages = useCallback(async () => {
        try {
            const count = await MessageService.getUnreadCount();
            trackRead(1, 'Fetched inbox unread count');
            // Store dummy objects to keep unreadMessagesCount calculation working for the badge
            setMessages(new Array(count).fill({ isRead: false }));
        } catch (error) { console.error("Error fetching message count:", error); }
    }, [trackRead]);

    // ====== Migration Bridge ======
    useEffect(() => {
        if (userRole === 'superadmin') {
            const runMigration = async () => {
                try {
                    // 1. Check if unified global settings exists and is complete
                    const globalSnap = await getDoc(doc(db, 'settings', 'global'));
                    if (globalSnap.exists()) {
                        const data = globalSnap.data();
                        if (data.site && data.typography && data.audit) return;
                    }

                    console.log("Starting Firestore settings migration...");

                    // 2. Fetch old data
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

                    // 3. Build normalized schema
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

                    // 4. Save to new location
                    await SettingsService.setFullSettings(payload);
                    console.log("Migration successful: settings/global created.");

                    // 5. Cleanup
                    await Promise.all([
                        deleteDoc(doc(db, 'content', 'settings')),
                        deleteDoc(doc(db, 'settings', 'admin')),
                        deleteDoc(doc(db, 'settings', 'auditConfig'))
                    ]);
                    console.log("Legacy settings documents removed.");

                    // Refresh caches
                    queryClient.invalidateQueries({ queryKey: ['settings', 'global'] });
                    fetchSectionData('settings');
                } catch (err) {
                    console.error("Migration failed:", err);
                }
            };
            runMigration();
        }
    }, [userRole, queryClient]);

    // ============================================================
    // Action Control Logic
    // ============================================================
    // isActionAllowed was handled here previously, now managed by utils/permissions.js
    const checkActionAllowed = useCallback((action, moduleName) => {
        return isActionAllowed(action, moduleName, userRole, rolePermissions);
    }, [userRole, rolePermissions]);

    // ====== Content Data Management ======
    const fetchSectionData = useCallback(async (section) => {
        try {
            if (section === 'settings') {
                const global = await SettingsService.fetchGlobalSettings();
                if (global) {
                    setSettingsData({
                        ...global.site,
                        ...global.typography,
                        ...global.system
                    });
                }
                if (trackRead) trackRead(1, 'Fetched global settings');
                return;
            }

            const data = await ContentService.fetchSection(section, trackRead);
            if (data) {
                switch (section) {
                    case 'home': setHomeData(prev => ({ ...prev, ...data })); break;
                    case 'about':
                        setAboutData({
                            bio: data.bio || '',
                            skills: Array.isArray(data.skills) ? data.skills.join(', ') : (data.skills || '')
                        });
                        break;
                    case 'contact': setContactData(prev => ({ ...prev, ...data })); break;
                    default: break;
                }
            }
        } catch (error) { console.error(`Error fetching ${section}:`, error); }
    }, [trackRead]);

    const saveSectionData = useCallback(async (section, data) => {
        if (!checkActionAllowed(ACTIONS.EDIT, section)) {
            return showToast("You do not have permission to perform this action.", "error");
        }

        await execute(async () => {
            if (section === 'settings') {
                const typographyKeys = [
                    'fontDisplay', 'fontDisplayWeight', 'fontDisplayItalic', 'fontDisplaySize',
                    'fontHeading', 'fontHeadingWeight', 'fontHeadingItalic', 'fontHeadingSize',
                    'fontSubheading', 'fontSubheadingWeight', 'fontSubheadingItalic', 'fontSubheadingSize',
                    'fontLogo', 'fontLogoWeight', 'fontLogoItalic', 'fontLogoSize',
                    'fontNav', 'fontNavWeight', 'fontNavItalic', 'fontNavSize',
                    'fontBody', 'fontBodyWeight', 'fontBodyItalic', 'fontBodySize',
                    'fontUI', 'fontUIWeight', 'fontUIItalic', 'fontUISize',
                    'fontMono', 'fontMonoWeight', 'fontMonoItalic', 'fontMonoSize',
                    'fontSize', 'adminFontOverride'
                ];
                const systemKeys = ['sidebarPersistent', 'notificationsEnabled'];

                const typography = {};
                const system = {};
                const site = {};

                Object.keys(data).forEach(k => {
                    if (typographyKeys.includes(k)) typography[k] = data[k];
                    else if (systemKeys.includes(k)) system[k] = data[k];
                    else site[k] = data[k];
                });

                await SettingsService.updateGlobalSettings({ site, typography, system }, trackWrite);
                queryClient.invalidateQueries({ queryKey: ['settings', 'global'] });
            } else {
                await ContentService.saveSection(section, data, trackWrite);
                queryClient.invalidateQueries({ queryKey: ['content', section] });
            }
        }, {
            showToast,
            successMessage: section === 'settings' ? 'Settings saved!' : `${section.charAt(0).toUpperCase() + section.slice(1)} saved!`,
            errorMessage: `Failed to save ${section}.`
        });
    }, [showToast, trackWrite, queryClient, execute, checkActionAllowed]);

    useEffect(() => {
        if (user && userRole) {
            // Only fetch management data for authorized roles
            const isAuthorized = userRole === 'superadmin' || userRole === 'admin';
            
            if (isAuthorized) {
                fetchRolePermissions();
                fetchMessages();
            }
            
            // Only fetch content if they have some role
            ['home', 'about', 'contact', 'settings'].forEach(fetchSectionData);
        }
    }, [user, userRole, fetchRolePermissions, fetchMessages, fetchSectionData]);

    const unreadMessagesCount = useMemo(() => messages.filter(m => !m.isRead).length, [messages]);

    // ====== Handlers ======
    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        await execute(async () => {
            let authUser;
            if (isRegistering) {
                const credential = await AuthService.register(email, password);
                authUser = credential.user;
                
                const userDoc = await UserService.fetchUserById(authUser.uid);
                trackRead(1, 'Checked user existence on registration');
                
                if (!userDoc) {
                    await UserService.createUserDoc({ email, role: 'pending', isActive: true }, authUser.uid);
                    trackWrite(1, 'Created user record');
                }
            } else {
                const credential = await AuthService.login(email, password);
                authUser = credential.user;
                
                let userDoc = await UserService.fetchUserById(authUser.uid);
                
                if (!userDoc) {
                    userDoc = await UserService.fetchUserByEmail(email);
                    if (userDoc) {
                        const { id, ref, ...data } = userDoc;
                        await UserService.createUserDoc(data, authUser.uid);
                        await UserService.deleteUserDoc(id);
                    }
                }
                
                trackRead(1, 'Verified user status on login');
                if (userDoc && userDoc.isActive === false) {
                    await AuthService.logout();
                    throw new Error("Your account has been disabled by an administrator.");
                }
            }

            try {
                let currentIp = 'Unknown';
                let locData = { country: 'Unknown', city: 'Unknown' };
                const geoData = await fetchGeoData();
                currentIp = geoData.ip;
                locData.country = geoData.country_name;
                locData.city = geoData.city;

                await AuditLogService.addAuditLog({
                    email,
                    ipAddress: currentIp,
                    country: locData.country,
                    city: locData.city,
                    userAgent: navigator.userAgent,
                    deviceType: getDeviceType(),
                    sessionId: getSessionId()
                }, trackWrite);
            } catch (auditError) { console.error("Failed to write audit log:", auditError); }
        }, {
            showToast,
            successMessage: isRegistering ? 'Account created! You are now logged in.' : undefined
        });
    };

    // ============================================================
    // Tab Renderer
    // ============================================================
    const renderActiveTab = () => {
        const commonProps = { userRole, showToast, userId, userDisplayName, isActionAllowed: checkActionAllowed };

        switch (activeTab) {
            case 'general':
                return <GeneralTab {...commonProps} homeData={homeData} setHomeData={setHomeData} aboutData={aboutData} setAboutData={setAboutData} contactData={contactData} setContactData={setContactData} loading={loading} saveSectionData={saveSectionData} />;
            case 'profile':
                return <ProfileTab {...commonProps} user={user} setUserDisplayName={setUserDisplayName} />;
            case 'settings':
                return <SettingsTab {...commonProps} settingsData={settingsData} setSettingsData={setSettingsData} loading={loading} saveSectionData={saveSectionData} sidebarPersistent={sidebarPersistent} setSidebarPersistent={setSidebarPersistent} />;
            case 'messages':
                return <MessagesTab {...commonProps} onMessagesChange={fetchMessages} />;
            case 'experience':
                return <ExperienceTab {...commonProps} />;
            case 'projects':
                return <ProjectsTab {...commonProps} />;
            case 'blog':
                return <BlogTab {...commonProps} />;
            case 'users':
                return <UsersTab {...commonProps} user={user} />;
            case 'database':
                return <DatabaseTab {...commonProps} setActiveTab={setActiveTab} />;
            case 'audit':
                return <AuditLogsTab {...commonProps} />;
            case 'analytics':
                return <AnalyticsTab {...commonProps} />;
            default:
                return <GeneralTab {...commonProps} homeData={homeData} setHomeData={setHomeData} aboutData={aboutData} setAboutData={setAboutData} contactData={contactData} setContactData={setContactData} loading={loading} saveSectionData={saveSectionData} />;
        }
    };

    // ============================================================
    // Login Screen
    // ============================================================
    if (isAuthLoading) {
        return (
            <div className={styles.loginWrapper}>
                <AnimatedBackground variant="aurora" density={30} speed={20} />
                <Spinner size="xl" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className={styles.loginWrapper}>
                <AnimatedBackground 
                    variant={settingsData.bgStyle || 'aurora'}
                    density={settingsData.bgDensity ?? 30}
                    speed={settingsData.bgSpeed ?? 20}
                    glowOpacity={settingsData.bgGlowOpacity ?? 40}
                    interactive={settingsData.bgInteractive ?? true}
                />
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                <div className={styles.loginCard}>
                    <div className={styles.loginIcon}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </div>
                    <h2 className={styles.loginTitle}>{isRegistering ? 'Create Account' : 'Admin Login'}</h2>
                    <p className={styles.loginSubtitle}>{isRegistering ? 'Register a new admin account' : 'Sign in to manage your portfolio'}</p>

                    <form onSubmit={handleLogin} className={styles.loginForm}>
                        <div className="ui-formGroup">
                            <label>Email</label>
                            <input type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="ui-formGroup">
                            <label>Password</label>
                            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <button type="submit" className={styles.loginBtn} disabled={loading}>
                            {loading ? (
                                <span className={styles.btnLoading}><span className="ui-spinner" /> {isRegistering ? 'Creating...' : 'Signing in...'}</span>
                            ) : (isRegistering ? 'Create Account' : 'Sign In')}
                        </button>
                    </form>

                    <div className={styles.loginFooter}>
                        <button onClick={() => setIsRegistering(!isRegistering)} className={styles.linkBtn}>
                            {isRegistering ? '← Back to Login' : 'Need an account? Register'}
                        </button>
                        <button onClick={() => navigate('/')} className={styles.linkBtn}>← Back to Site</button>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================
    // Admin Dashboard
    // ============================================================
    return (
        <AdminLayout
            currentRoute={activeTab}
            onNavigate={handleTabClick}
            user={user}
            userRole={userRole}
            userDisplayName={userDisplayName}
            theme={theme}
            toggleTheme={toggleTheme}
            onLogout={() => AuthService.logout()}
            rolePermissions={rolePermissions}
            isTabAllowed={isTabAllowed}
            unreadMessagesCount={unreadMessagesCount}
            title={tabLabels[activeTab] || 'Dashboard'}
            subtitle={
                activeTab === 'general' ? 'Manage your portfolio primary content' : 
                activeTab === 'profile' ? 'Manage your personal profile and account settings' :
                activeTab === 'settings' ? 'Configure site-wide identity, visual aesthetics, and synchronization' :
                'Administrator Dashboard'
            }
            settingsData={settingsData}
        >
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <Suspense fallback={<div style={{display: 'flex', justifyContent: 'center', padding: '4rem'}}><Spinner size="xl" /></div>}>
                {renderActiveTab()}
            </Suspense>
        </AdminLayout>
    );
};

export default Admin;
