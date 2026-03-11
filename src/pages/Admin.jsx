import React, { useState, useEffect, useCallback, useMemo } from 'react';
import UserService from '../services/UserService';
import MessageService from '../services/MessageService';
import ContentService from '../services/ContentService';
import styles from './Admin.module.scss';
import { useNavigate } from 'react-router-dom';
import {
    LogOut, ChevronLeft, ChevronRight, ExternalLink, FileText, Database, User, BarChart2, Sun, Moon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useActivity } from '../hooks/useActivity';
import { getSessionId, getDeviceType } from '../hooks/useAnalytics';
import { useQueryClient } from '@tanstack/react-query';
import SettingsService from '../services/SettingsService';
import AuthService from '../services/AuthService';
import AuditLogService from '../services/AuditLogService';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Tab components
import GeneralTab from './admin/tabs/GeneralTab';
import ProfileTab from './admin/tabs/ProfileTab';
import SettingsTab from './admin/tabs/SettingsTab';
import MessagesTab from './admin/tabs/MessagesTab';
import ExperienceTab from './admin/tabs/ExperienceTab';
import UsersTab from './admin/tabs/UsersTab';
import ProjectsTab from './admin/tabs/ProjectsTab';
import BlogTab from './admin/tabs/BlogTab';
import DatabaseTab from './admin/tabs/DatabaseTab';
import AuditLogsTab from './admin/tabs/AuditLogsTab';
import AnalyticsTab from './admin/tabs/AnalyticsTab';

// ============================================================
// Icons
// ============================================================
const icons = {
    analytics: <BarChart2 size={18} />,
    experience: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    ),
    projects: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    ),
    general: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    ),
    settings: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
    messages: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    ),
    blog: <FileText size={18} />,
    database: <Database size={18} />,
    profile: <User size={18} />,
    audit: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
    )
};

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
    settings: 'Site Settings'
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
        <div className={`${styles.toast} ${styles[type]} `}>
            <span style={{ fontWeight: 'bold' }}>{getIcon()}</span>
            <p>{message}</p>
            <button onClick={onClose} className={styles.toastClose}>×</button>
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
    const [loading, setLoading] = useState(false);
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

    // Toast
    const [toast, setToast] = useState(null);
    const showToast = useCallback((message, type = 'success') => setToast({ message, type }), []);

    // Role Permissions
    const [rolePermissions, setRolePermissions] = useState({});

    // Messages for unread badge
    const [messages, setMessages] = useState([]);

    // Content Data for simple tabs
    const [homeData, setHomeData] = useState({ greeting: '', name: '', subtitle: '', description: '', ctaText: '', ctaLink: '', profileImageUrl: '' });
    const [aboutData, setAboutData] = useState({ bio: '', skills: '' });
    const [contactData, setContactData] = useState({ introText: '' });
    const [settingsData, setSettingsData] = useState({ logoHighlight: '', logoText: '', tagline: '', footerText: '', projectFilters: '', blogFilters: '', pageTitle: '', pageFaviconUrl: '' });

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
        
        // Block restricted system tabs for everyone else
        if (['users', 'database', 'audit'].includes(tab)) return false;

        // Check explicit permissions
        if (permissions?.[role]?.includes(tab)) return true;
        
        // Role defaults
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchMessages = useCallback(async () => {
        try {
            const msgs = await MessageService.getAll('createdAt', 'desc');
            trackRead(msgs.length, 'Fetched inbox messages');
            setMessages(msgs);
        } catch (error) { console.error("Error fetching messages:", error); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const saveSectionData = useCallback(async (section, data) => {
        setLoading(true);
        try {
            if (section === 'settings') {
                const typographyKeys = ['fontDisplay', 'fontHeading', 'fontSubheading', 'fontNav', 'fontBody', 'fontUI', 'fontSize', 'adminFontOverride'];
                const systemKeys = ['sidebarPersistent'];

                const typography = {};
                const system = {};
                const site = {};

                Object.keys(data).forEach(k => {
                    if (typographyKeys.includes(k)) typography[k] = data[k];
                    else if (systemKeys.includes(k)) system[k] = data[k];
                    else site[k] = data[k];
                });

                await SettingsService.updateGlobalSettings({ site, typography, system }, trackWrite);
                showToast(`Settings saved!`);
                queryClient.invalidateQueries({ queryKey: ['settings', 'global'] });
            } else {
                await ContentService.saveSection(section, data, trackWrite);
                showToast(`${section.charAt(0).toUpperCase() + section.slice(1)} saved!`);
                queryClient.invalidateQueries({ queryKey: ['content', section] });
            }
        } catch (error) {
            console.error(`Error saving ${section}:`, error);
            const errMsg = error.message?.includes('quota') ? 'Storage quota exceeded.' : (error.message || 'Unknown error');
            showToast(`Failed to save ${section}: ${errMsg}`, 'error');
        } finally { setLoading(false); }
    }, [showToast, trackWrite, queryClient]);

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
        if (!sidebarPersistent || window.innerWidth <= 900) {
            setSidebarOpen(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
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
                showToast('Account created! You are now logged in.');
            } else {
                const credential = await AuthService.login(email, password);
                authUser = credential.user;
                
                let userDoc = await UserService.fetchUserById(authUser.uid);
                
                // Manual migration check (redundant but safe)
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

            // Audit Trail
            try {
                let currentIp = 'Unknown';
                let locData = { country: 'Unknown', city: 'Unknown' };
                try {
                    const ipRes = await fetch('https://ipwho.is/');
                    if (ipRes.ok) {
                        const ipData = await ipRes.json();
                        if (ipData.ip) currentIp = ipData.ip;
                        if (ipData.country) locData.country = ipData.country;
                        if (ipData.city) locData.city = ipData.city;
                    }
                } catch {
                    try {
                        const fallbackRes = await fetch('https://api.ipify.org?format=json');
                        if (fallbackRes.ok) {
                            const fallbackData = await fallbackRes.json();
                            if (fallbackData.ip) currentIp = fallbackData.ip;
                        }
                    } catch { /* silently ignore */ }
                }

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
        } catch (error) {
            showToast((isRegistering ? "Registration Failed: " : "Login Failed: ") + error.message, 'error');
        } finally { setLoading(false); }
    };

    // ============================================================
    // Tab Renderer
    // ============================================================
    const renderActiveTab = () => {
        const commonProps = { userRole, showToast, userId, userDisplayName };

        switch (activeTab) {
            case 'general':
                return <GeneralTab {...commonProps} homeData={homeData} setHomeData={setHomeData} aboutData={aboutData} setAboutData={setAboutData} contactData={contactData} setContactData={setContactData} loading={loading} saveSectionData={saveSectionData} />;
            case 'profile':
                return <ProfileTab {...commonProps} user={user} setUserDisplayName={setUserDisplayName} />;
            case 'settings':
                return <SettingsTab {...commonProps} settingsData={settingsData} setSettingsData={setSettingsData} loading={loading} saveSectionData={saveSectionData} sidebarPersistent={sidebarPersistent} setSidebarPersistent={setSidebarPersistent} />;
            case 'messages':
                return <MessagesTab {...commonProps} messages={messages} setMessages={setMessages} />;
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
            <div className={styles.adminLayout} style={{ alignItems: 'center', justifyContent: 'center' }}>
                <div className={styles.spinner} style={{ width: '32px', height: '32px', borderWidth: '3px', borderColor: 'rgba(100, 255, 218, 0.1)', borderTopColor: '#64ffda' }} />
            </div>
        );
    }

    if (!user) {
        return (
            <div className={styles.loginWrapper}>
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
                        <div className={styles.inputGroup}>
                            <label>Email</label>
                            <input type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Password</label>
                            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <button type="submit" className={styles.loginBtn} disabled={loading}>
                            {loading ? (
                                <span className={styles.btnLoading}><span className={styles.spinner} /> {isRegistering ? 'Creating...' : 'Signing in...'}</span>
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
        <div className={styles.adminLayout}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Top Navigation Bar */}
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
                        <div className={styles.headerAvatar}>{(userDisplayName || user.email)?.charAt(0).toUpperCase()}</div>
                        <div className={styles.headerUserText}>
                            <span className={styles.headerUserEmail} title={user.email}>{userDisplayName || user.email}</span>
                            <span className={styles.headerUserRole}>{userRole || 'Loading...'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Backdrop */}
            {sidebarOpen && <div className={styles.backdrop} onClick={() => setSidebarOpen(false)} />}

            {/* Sidebar */}
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

            {/* Main Content */}
            <main className={`${styles.mainContent} ${!sidebarOpen ? styles.contentExpanded : ''}`}>
                <div className={styles.contentHeader}>
                    <div>
                        <h1>{tabLabels[activeTab] || 'Dashboard'}</h1>
                        <p className={styles.headerSubtitle}>
                            {activeTab === 'general' ? 'Manage your portfolio primary content' : 
                             activeTab === 'profile' ? 'Manage your personal profile and account settings' :
                             activeTab === 'settings' ? 'Configure site-wide appearance and behavior' :
                             `Manage your portfolio ${tabLabels[activeTab]?.toLowerCase() || activeTab}`}
                        </p>
                    </div>
                </div>

                {renderActiveTab()}
            </main>
        </div>
    );
};

export default Admin;
