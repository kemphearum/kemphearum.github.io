import React, { useState, useEffect, useCallback, useMemo } from 'react';
import UserService from '../services/UserService';
import MessageService from '../services/MessageService';
import styles from './Admin.module.scss';
import { useNavigate } from 'react-router-dom';
import {
    LogOut, ChevronLeft, ChevronRight, ExternalLink, FileText, Database, User, BarChart2, Sun, Moon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useActivity } from '../hooks/useActivity';
import { getSessionId, getDeviceType } from '../hooks/useAnalytics';
import { useQueryClient } from '@tanstack/react-query';
import ContentService from '../services/ContentService';
import AuthService from '../services/AuthService';
import AuditLogService from '../services/AuditLogService';

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
    users: 'Users',
    audit: 'Audit Logs',
    analytics: 'Analytics'
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
    const [activeTab, setActiveTab] = useState(() => localStorage.getItem('adminActiveTab') || 'home');
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 992);
    const [sidebarPersistent, setSidebarPersistent] = useState(() => {
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
                    const userData = await UserService.fetchUserByEmail(currentUser.email);

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

                        if (currentUser.email === 'kem.phearum@gmail.com' && fetchedRole !== 'superadmin') {
                            fetchedRole = 'superadmin';
                            UserService.updateUserField(userData.id, { role: 'superadmin' }).catch(console.error);
                        } else if (fetchedRole === 'owner') {
                            fetchedRole = 'superadmin';
                            UserService.updateUserField(userData.id, { role: 'superadmin' }).catch(console.error);
                        }

                        setUserRole(fetchedRole);
                    } else if (currentUser.email === 'kem.phearum@gmail.com') {
                        const newId = await UserService.createUserDoc({
                            email: currentUser.email, role: 'superadmin', isActive: true
                        });
                        setUserId(newId);
                        setUserRole('superadmin');
                    } else {
                        try {
                            const newId = await UserService.createUserDoc({
                                email: currentUser.email, role: 'pending', isActive: true
                            });
                            setUserId(newId);
                        } catch (createError) { console.error("Failed to auto-create user document:", createError); }
                        setUserRole('pending');
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

    // ====== Content Data Management ======
    const fetchSectionData = useCallback(async (section) => {
        try {
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
                    case 'settings': setSettingsData(prev => ({ ...prev, ...data })); break;
                    default: break;
                }
            }
        } catch (error) { console.error(`Error fetching ${section}:`, error); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const saveSectionData = useCallback(async (section, data) => {
        setLoading(true);
        try {
            await ContentService.saveSection(section, data, trackWrite);
            showToast(`${section.charAt(0).toUpperCase() + section.slice(1)} saved!`);
            // Invalidate the TanStack Query cache for this specific content section
            queryClient.invalidateQueries({ queryKey: ['content', section] });
        } catch (error) {
            console.error(`Error saving ${section}:`, error);
            showToast(`Failed to save ${section}.`, 'error');
        } finally { setLoading(false); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showToast]);

    useEffect(() => {
        if (user) {
            fetchRolePermissions();
            fetchMessages();
            // Fetch content data for simple tabs
            ['home', 'about', 'contact', 'settings'].forEach(fetchSectionData);
        }
    }, [user, fetchRolePermissions, fetchMessages, fetchSectionData]);

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
            if (isRegistering) {
                await AuthService.register(email, password);
                const userDoc = await UserService.fetchUserByEmail(email);
                trackRead(1, 'Checked user existence on registration');
                if (!userDoc) {
                    await UserService.createUserDoc({ email, role: 'pending', isActive: true });
                    trackWrite(1, 'Created user record');
                }
                showToast('Account created! You are now logged in.');
            } else {
                await AuthService.login(email, password);
                const userDoc = await UserService.fetchUserByEmail(email);
                trackRead(1, 'Verified user status on login');
                if (userDoc) {
                    if (userDoc.isActive === false) {
                        await AuthService.logout();
                        throw new Error("Your account has been disabled by an administrator.");
                    }
                }
            }

            // Audit Trail
            try {
                let currentIp = 'Unknown';
                let locData = { country: 'Unknown', city: 'Unknown' };
                try {
                    const ipRes = await fetch('https://ipapi.co/json/');
                    const ipData = await ipRes.json();
                    if (ipData.ip) currentIp = ipData.ip;
                    if (ipData.country_name) locData.country = ipData.country_name;
                    if (ipData.city) locData.city = ipData.city;
                } catch {
                    try {
                        const fallbackRes = await fetch('https://api.ipify.org?format=json');
                        const fallbackData = await fallbackRes.json();
                        if (fallbackData.ip) currentIp = fallbackData.ip;
                    } catch { /* intentionally ignored */ }
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
                        if (userRole === 'superadmin') return true;
                        if (tab === 'users' || tab === 'database' || tab === 'audit') return false;
                        if (userRole && rolePermissions[userRole]) return rolePermissions[userRole].includes(tab);
                        if (userRole === 'admin') return true;
                        if (userRole === 'editor') {
                            const editorAllowedTabs = ['general', 'experience', 'projects', 'blog', 'messages'];
                            return editorAllowedTabs.includes(tab);
                        }
                        return false;
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
                        <h1>{tabLabels[activeTab] || (activeTab === 'profile' ? 'My Profile' : 'Settings')}</h1>
                        <p className={styles.headerSubtitle}>Manage your portfolio {activeTab}</p>
                    </div>
                </div>

                {renderActiveTab()}
            </main>
        </div>
    );
};

export default Admin;
