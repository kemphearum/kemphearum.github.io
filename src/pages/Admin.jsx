import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import UserService from '../services/UserService';
import MessageService from '../services/MessageService';
import ContentService from '../services/ContentService';
import { useLocation, Link, Outlet, useNavigate } from 'react-router';
import { AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { fetchGeoData } from '../utils/geoUtils';
import { useTheme } from '../context/ThemeContext';
import { useActivity } from '../hooks/useActivity';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { getSessionId, getDeviceType } from '../hooks/useAnalytics';
import { useQueryClient } from '@tanstack/react-query';
import { serverTimestamp } from 'firebase/firestore';
import SettingsService from '../services/SettingsService';
import AuthService from '../services/AuthService';
import AuditLogService from '../services/AuditLogService';
import AdminLayout from './admin/components/AdminLayout';
import { Spinner } from '../shared/components/ui';
import AnimatedBackground from '@/sections/AnimatedBackground';
import { isActionAllowed, ACTIONS } from '../utils/permissions';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSwitcher from '../shared/components/LanguageSwitcher';

// Tab components
const GeneralTab = lazy(() => import('./admin/general/GeneralTab'));
const ProfileTab = lazy(() => import('./admin/profile/ProfileTab'));
const SettingsTab = lazy(() => import('./admin/settings/SettingsTab'));
const MessagesTab = lazy(() => import('./admin/messages/MessagesTab'));
const ExperienceTab = lazy(() => import('./admin/experience/ExperienceTab'));
const UsersTab = lazy(() => import('./admin/users/UsersTab'));
const ProjectsTab = lazy(() => import('./admin/projects/ProjectsTab'));
const BlogTab = lazy(() => import('./admin/blog/BlogTab'));
const DatabaseTab = lazy(() => import('./admin/database/DatabaseTab'));
const AuditLogsTab = lazy(() => import('./admin/audit/AuditLogsTab'));
const AnalyticsTab = lazy(() => import('./admin/analytics/AnalyticsTab'));

// ============================================================
// Icons removed - now handled in modular components
// ============================================================
const tabLabelKeys = {
    general: 'admin.tabs.general',
    experience: 'admin.tabs.experience',
    projects: 'admin.tabs.projects',
    blog: 'admin.tabs.blog',
    messages: 'admin.tabs.messages',
    database: 'admin.tabs.database',
    users: 'admin.tabs.users',
    audit: 'admin.tabs.audit',
    analytics: 'admin.tabs.analytics',
    profile: 'admin.tabs.profile',
    settings: 'admin.tabs.settings'
};

const tabSubtitleKeys = {
    general: 'admin.subtitles.general',
    profile: 'admin.subtitles.profile',
    settings: 'admin.subtitles.settings'
};

// ============================================================
// Toast Component
// ============================================================
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose, message]);

    const getIcon = () => ({
        success: 'OK',
        error: 'X',
        warning: '!',
        info: 'i'
    }[type] || '*');

    return (
        <div className={`ui-toast ui-${type}`}>
            <span style={{ fontWeight: 'bold' }}>{getIcon()}</span>
            <p>{message}</p>
            <button onClick={onClose} className="ui-toastClose">x</button>
        </div>
    );
};

const AUTH_REMEMBER_EMAIL_KEY = 'adminRememberedEmail';

const formatAuthErrorMessage = (error, t, fallback) => {
    const defaultFallback = fallback || t('admin.auth.errors.default');
    const code = error?.code || '';
    const message = typeof error === 'string' ? error : (error?.message || defaultFallback);

    if (message.includes('disabled by an administrator')) {
        return t('admin.auth.errors.disabledByAdmin');
    }

    switch (code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
            return t('admin.auth.errors.invalidCredential');
        case 'auth/too-many-requests':
            return t('admin.auth.errors.tooManyRequests');
        case 'auth/network-request-failed':
            return t('admin.auth.errors.network');
        case 'auth/invalid-email':
            return t('admin.auth.errors.invalidEmail');
        case 'auth/weak-password':
            return t('admin.auth.errors.weakPassword');
        case 'auth/email-already-in-use':
            return t('admin.auth.errors.emailInUse');
        default:
            break;
    }

    if (message.includes('INVALID_LOGIN_CREDENTIALS')) {
        return t('admin.auth.errors.invalidCredential');
    }
    if (message.includes('EMAIL_EXISTS')) {
        return t('admin.auth.errors.emailInUse');
    }
    if (message.includes('WEAK_PASSWORD')) {
        return t('admin.auth.errors.weakPassword');
    }

    return message || defaultFallback;
};

// ============================================================
// Admin Component (Shell)
// ============================================================
const Admin = () => {
    // ====== 1. React & Custom Hooks (Top Level Only) ======
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    const { trackRead, trackWrite } = useActivity();
    const { loading, execute } = useAsyncAction();

    // ====== 2. Core State ======
    // Auth
    const [user, setUser] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userDisplayName, setUserDisplayName] = useState('');
    const [email, setEmail] = useState(() => {
        if (typeof window === 'undefined') return '';
        return localStorage.getItem(AUTH_REMEMBER_EMAIL_KEY) || '';
    });
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [capsLockOn, setCapsLockOn] = useState(false);
    const [authError, setAuthError] = useState('');
    const [rememberEmail, setRememberEmail] = useState(() => {
        if (typeof window === 'undefined') return false;
        return Boolean(localStorage.getItem(AUTH_REMEMBER_EMAIL_KEY));
    });
    const [lastSyncTime, setLastSyncTime] = useState(new Date());

    // UI & Tabs
    const [activeTab, setActiveTab] = useState(() => {
        if (typeof window === 'undefined') return 'profile';
        return localStorage.getItem('adminActiveTab') || 'profile';
    });
    const [sidebarPersistent, setSidebarPersistent] = useState(() => {
        if (typeof window === 'undefined') return true;
        const stored = localStorage.getItem('adminSidebarPersistent');
        return stored !== null ? JSON.parse(stored) : true;
    });

    // Content & Permissions
    const [rolePermissions, setRolePermissions] = useState({});
    const [messages, setMessages] = useState([]);
    const [toast, setToast] = useState(null);

    // Form Data
    const [homeData, setHomeData] = useState({ greeting: '', name: '', subtitle: '', description: '', ctaText: '', ctaLink: '', profileImageUrl: '' });
    const [aboutData, setAboutData] = useState({ bio: '', skills: '' });
    const [contactData, setContactData] = useState({ introText: '' });
    const [settingsData, setSettingsData] = useState({ 
        title: '',
        favicon: '',
        logoHighlight: '',
        logoText: '',
        tagline: '',
        footerText: '',
        projectFilters: '',
        blogFilters: '',
        notificationsEnabled: true
    });

    // ====== 3. Callbacks & Memoized Values (Logic Definitions) ======
    const showToast = useCallback((message, type = 'success') => {
        if (settingsData.notificationsEnabled !== false) {
            setToast({ message, type });
        }
    }, [settingsData.notificationsEnabled]);

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

    const checkActionAllowed = useCallback((action, moduleName) => {
        return isActionAllowed(action, moduleName, userRole, rolePermissions);
    }, [userRole, rolePermissions]);

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
                    if (typeof global.system?.sidebarPersistent === 'boolean') {
                        setSidebarPersistent(global.system.sidebarPersistent);
                    }
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
            return showToast(t('admin.common.noPermissionAction'), "error");
        }

        await execute(async () => {
            if (section === 'settings') {
                const fontCategories = SettingsService.constructor.DEFAULT_TYPOGRAPHY_METADATA?.fontCategories || [];
                const typographyKeys = [
                    ...fontCategories.flatMap(({ field, sizeField, weightField, italicField }) => [
                        field,
                        sizeField,
                        weightField,
                        italicField
                    ]),
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
            successMessage: section === 'settings'
                ? t('admin.common.settingsSaved')
                : t('admin.common.sectionSaved', { section: section.charAt(0).toUpperCase() + section.slice(1) }),
            errorMessage: t('admin.common.saveSectionFailed', { section })
        });
    }, [showToast, trackWrite, queryClient, execute, checkActionAllowed, t]);

    const unreadMessagesCount = useMemo(() => messages.filter(m => !m.isRead).length, [messages]);

    // ====== 4. Side Effects (Must follow all definitions) ======
    useEffect(() => {
        const interval = setInterval(() => {
            setLastSyncTime(new Date());
        }, 300000); // 5 mins
        return () => clearInterval(interval);
    }, []);

    // ====== Persistence ======
    useEffect(() => { localStorage.setItem('adminActiveTab', activeTab); }, [activeTab]);
    useEffect(() => { localStorage.setItem('adminSidebarPersistent', JSON.stringify(sidebarPersistent)); }, [sidebarPersistent]);
    useEffect(() => {
        if (!rememberEmail && typeof window !== 'undefined') {
            localStorage.removeItem(AUTH_REMEMBER_EMAIL_KEY);
        }
    }, [rememberEmail]);
    useEffect(() => {
        setAuthError('');
        setShowPassword(false);
        setCapsLockOn(false);
        setPassword('');
    }, [isRegistering]);

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
                            const { id, ...data } = legacyData;
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
                        } else if (!userData.createdAt || userData.isActive === undefined) {
                            // Ensure legacy users have required fields for sorting/filtering
                            const updates = {};
                            if (!userData.createdAt) updates.createdAt = serverTimestamp();
                            if (userData.isActive === undefined) updates.isActive = true;
                            await UserService.updateUserField(userData.id, updates);
                            userData = { ...userData, ...updates };
                        }

                    if (userData) {
                        if (userData.isActive === false) {
                            await AuthService.logout();
                            setUser(null); setUserRole(null); setUserId(null); setUserDisplayName('');
                            showToast(t('admin.auth.errors.disabledByAdmin'), "error");
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
    }, [showToast, t]);

    useEffect(() => {
        if (!isAuthLoading && userRole && !isTabAllowed(activeTab, userRole, rolePermissions)) {
            console.log(`Access denied to tab '${activeTab}' for role '${userRole}'. Redirecting to profile.`);
            setActiveTab('profile');
        }
    }, [activeTab, userRole, rolePermissions, isAuthLoading, isTabAllowed]);

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

    useEffect(() => {
        if (userRole === 'superadmin') {
            const runMigration = async () => {
                try {
                    const { doc, getDoc, deleteDoc } = await import('firebase/firestore');
                    const { db } = await import('../firebase');
                    
                    const globalSnap = await getDoc(doc(db, 'settings', 'global'));
                    if (globalSnap.exists()) {
                        const data = globalSnap.data();
                        if (data.site && data.typography && data.audit) return;
                    }

                    console.log("Starting Firestore settings migration...");
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
                } catch (err) { console.error("Migration failed:", err); }
            };
            runMigration();
        }
    }, [userRole, queryClient, fetchSectionData]);

    // ====== Handlers ======
    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthError('');

        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
            setAuthError(t('admin.auth.errors.emailRequired'));
            return;
        }
        if (!password) {
            setAuthError(t('admin.auth.errors.passwordRequired'));
            return;
        }
        if (isRegistering && password.length < 6) {
            setAuthError(t('admin.auth.errors.weakPassword'));
            return;
        }

        // Pre-fetch geo data to ensure it's available for logging (fast)
        const geoPromise = fetchGeoData().catch(() => ({ ip: 'Unknown', country_name: 'Unknown', city: 'Unknown' }));

        const result = await execute(async () => {
            const geoData = await geoPromise;
            const logBase = {
                email: normalizedEmail,
                ipAddress: geoData.ip,
                country: geoData.country_name,
                city: geoData.city,
                userAgent: navigator.userAgent,
                deviceType: getDeviceType(),
                sessionId: getSessionId()
            };

            try {
                let authUser;
                if (isRegistering) {
                    const credential = await AuthService.register(normalizedEmail, password);
                    authUser = credential.user;
                    
                    const userDoc = await UserService.fetchUserById(authUser.uid);
                    trackRead(1, 'Checked user existence on registration');
                    
                    if (!userDoc) {
                        await UserService.createUserDoc({ email: normalizedEmail, role: 'pending', isActive: true }, authUser.uid);
                        trackWrite(1, 'Created user record');
                    }
                    
                    // Success Log for Registration
                    await AuditLogService.addAuditLog(logBase, 'success', 'User Registered', trackWrite);
                } else {
                    const credential = await AuthService.login(normalizedEmail, password);
                    authUser = credential.user;
                    
                    let userDoc = await UserService.fetchUserById(authUser.uid);
                    
                    if (!userDoc) {
                        userDoc = await UserService.fetchUserByEmail(normalizedEmail);
                        if (userDoc) {
                            const { id, ...data } = userDoc;
                            await UserService.createUserDoc(data, authUser.uid);
                            await UserService.deleteUserDoc(id);
                        }
                    }
                    
                    trackRead(1, 'Verified user status on login');
                    if (userDoc && userDoc.isActive === false) {
                        await AuthService.logout();
                        throw new Error(t('admin.auth.errors.disabledByAdmin'));
                    }

                    // Success Log for Login
                    await AuditLogService.addAuditLog(logBase, 'success', null, trackWrite);
                }
            } catch (err) {
                // Log the failure to audit trail
                await AuditLogService.addAuditLog(logBase, 'failure', err.message, trackWrite);
                throw err;
            }
        }, {
            showToast,
            successMessage: isRegistering ? t('admin.auth.accountCreated') : undefined
        });

        if (!result?.success) {
            setAuthError(formatAuthErrorMessage(result?.error, t));
            return;
        }

        if (!isRegistering) {
            if (rememberEmail) {
                localStorage.setItem(AUTH_REMEMBER_EMAIL_KEY, normalizedEmail);
            } else {
                localStorage.removeItem(AUTH_REMEMBER_EMAIL_KEY);
            }
        }

        setEmail(rememberEmail ? normalizedEmail : '');
        setPassword('');
        setShowPassword(false);
        setCapsLockOn(false);
    };

    const handlePasswordKeyState = useCallback((event) => {
        setCapsLockOn(Boolean(event.getModifierState?.('CapsLock')));
    }, []);

    // ============================================================
    // Tab Renderer
    // ============================================================
    const renderActiveTab = () => {
        const commonProps = { userRole, showToast, userId, userDisplayName, userEmail: user?.email, isActionAllowed: checkActionAllowed };

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
            <div className="ui-loginWrapper">
                <AnimatedBackground variant="aurora" density={30} speed={20} />
                <Spinner size="xl" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="ui-loginWrapper">
                <AnimatedBackground 
                    variant={settingsData.bgStyle || 'aurora'}
                    density={settingsData.bgDensity ?? 30}
                    speed={settingsData.bgSpeed ?? 20}
                    glowOpacity={settingsData.bgGlowOpacity ?? 40}
                    interactive={settingsData.bgInteractive ?? true}
                />
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                <div className="ui-loginCard">
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
                        <LanguageSwitcher />
                    </div>
                    <div className="ui-loginIcon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </div>
                    <h2 className="ui-loginTitle">{isRegistering ? t('admin.auth.createAccount') : t('admin.auth.loginTitle')}</h2>
                    <p className="ui-loginSubtitle">
                        {isRegistering
                            ? t('admin.auth.registerSubtitle')
                            : t('admin.auth.signInSubtitle')}
                    </p>
                    <div className="ui-loginHint">
                        <ShieldCheck size={15} />
                        <span>{t('admin.auth.protectedHint')}</span>
                    </div>

                    <form onSubmit={handleLogin} className="ui-loginForm">
                        {authError && (
                            <div className="ui-loginError" role="alert">
                                <AlertCircle size={15} />
                                <span>{authError}</span>
                            </div>
                        )}

                        <div className="ui-formGroup">
                            <label htmlFor="admin-email">{t('admin.auth.email')}</label>
                            <input
                                id="admin-email"
                                type="email"
                                placeholder={t('admin.auth.emailPlaceholder')}
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (authError) setAuthError('');
                                }}
                                autoComplete="email"
                                required
                            />
                        </div>
                        <div className="ui-formGroup">
                            <label htmlFor="admin-password">{t('admin.auth.password')}</label>
                            <div className="ui-passwordField">
                                <input
                                    id="admin-password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder={t('admin.auth.passwordPlaceholder')}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (authError) setAuthError('');
                                    }}
                                    onKeyUp={handlePasswordKeyState}
                                    onKeyDown={handlePasswordKeyState}
                                    onBlur={() => setCapsLockOn(false)}
                                    autoComplete={isRegistering ? 'new-password' : 'current-password'}
                                    required
                                />
                                <button
                                    type="button"
                                    className="ui-passwordToggle"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    aria-label={showPassword ? t('admin.auth.hidePassword') : t('admin.auth.showPassword')}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {capsLockOn && <p className="ui-loginCaps">{t('admin.auth.capsLockOn')}</p>}
                            {isRegistering && <p className="ui-loginRule">{t('admin.auth.passwordRule')}</p>}
                        </div>

                        {!isRegistering && (
                            <label className="ui-loginRemember">
                                <input
                                    type="checkbox"
                                    checked={rememberEmail}
                                    onChange={(e) => setRememberEmail(e.target.checked)}
                                />
                                <span>{t('admin.auth.rememberEmail')}</span>
                            </label>
                        )}

                        <button type="submit" className="ui-loginBtn" disabled={loading}>
                            {loading ? (
                                <span className="ui-btnLoading"><span className="ui-spinner" /> {isRegistering ? t('admin.auth.creating') : t('admin.auth.signingIn')}</span>
                            ) : (isRegistering ? t('admin.auth.createAccount') : t('admin.auth.signIn'))}
                        </button>
                    </form>

                    <div className="ui-loginFooter">
                        <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="ui-linkBtn">
                            {isRegistering ? t('admin.auth.backToLogin') : t('admin.auth.needAccountRegister')}
                        </button>
                        <button type="button" onClick={() => navigate('/')} className="ui-linkBtn">{t('admin.auth.backToSite')}</button>
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
            lastSyncTime={lastSyncTime}
            title={t(tabLabelKeys[activeTab] || 'admin.dashboard.title')}
            subtitle={t(tabSubtitleKeys[activeTab] || 'admin.subtitles.default')}
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
