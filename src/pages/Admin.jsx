import React, { useState, useCallback, useRef, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useActivity } from '../hooks/useActivity';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { useQueryClient } from '@tanstack/react-query';
import AuthService from '../services/AuthService';
import AdminLayout from './admin/components/AdminLayout';
import AdminToast from './admin/components/AdminToast';
import useAdminAccess from './admin/hooks/useAdminAccess';
import useAdminContent from './admin/hooks/useAdminContent';
import useAdminAuth from './admin/hooks/useAdminAuth';
import useAdminBootstrap from './admin/hooks/useAdminBootstrap';
import { Spinner } from '../shared/components/ui';
import AnimatedBackground from '@/sections/AnimatedBackground';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSwitcher from '../shared/components/LanguageSwitcher';
import {
    normalizeRenderableText,
    tabLabelKeys,
    tabSubtitleKeys
} from './admin/adminUtils';

const LAZY_RELOAD_PREFIX = 'admin-lazy-reload:';

const isChunkLoadError = (error) => {
    const message = String(error?.message || error || '');
    return (
        message.includes('Failed to fetch dynamically imported module') ||
        message.includes('Importing a module script failed') ||
        message.includes('ChunkLoadError') ||
        message.includes('Loading chunk')
    );
};

const lazyWithRetry = (importer, chunkKey) => lazy(() => importer().then(
    (module) => {
        if (typeof window !== 'undefined') {
            window.sessionStorage.removeItem(`${LAZY_RELOAD_PREFIX}${chunkKey}`);
        }

        return module;
    }
).catch((error) => {
    if (typeof window !== 'undefined' && isChunkLoadError(error)) {
        const storageKey = `${LAZY_RELOAD_PREFIX}${chunkKey}`;
        const alreadyRetried = window.sessionStorage.getItem(storageKey) === 'true';

        if (!alreadyRetried) {
            window.sessionStorage.setItem(storageKey, 'true');
            window.location.reload();
            return new Promise(() => {});
        }

        window.sessionStorage.removeItem(storageKey);
    }

    throw error;
}));

// Tab components
const GeneralTab = lazyWithRetry(() => import('./admin/general/GeneralTab'), 'general');
const ProfileTab = lazyWithRetry(() => import('./admin/profile/ProfileTab'), 'profile');
const SettingsTab = lazyWithRetry(() => import('./admin/settings/SettingsTab'), 'settings');
const MessagesTab = lazyWithRetry(() => import('./admin/messages/MessagesTab'), 'messages');
const ExperienceTab = lazyWithRetry(() => import('./admin/experience/ExperienceTab'), 'experience');
const UsersTab = lazyWithRetry(() => import('./admin/users/UsersTab'), 'users');
const ProjectsTab = lazyWithRetry(() => import('./admin/projects/ProjectsTab'), 'projects');
const BlogTab = lazyWithRetry(() => import('./admin/blog/BlogTab'), 'blog');
const DatabaseTab = lazyWithRetry(() => import('./admin/database/DatabaseTab'), 'database');
const AuditLogsTab = lazyWithRetry(() => import('./admin/audit/AuditLogsTab'), 'audit');
const AnalyticsTab = lazyWithRetry(() => import('./admin/analytics/AnalyticsTab'), 'analytics');

// ============================================================
// Icons removed - now handled in modular components
// ============================================================
// ============================================================
// Admin Component (Shell)
// ============================================================
const Admin = () => {
    // ====== 1. React & Custom Hooks (Top Level Only) ======
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { t, language } = useTranslation();
    const themeContext = useTheme() || { theme: 'dark', toggleTheme: () => {} };
    const { theme, toggleTheme } = themeContext;
    const { trackRead, trackWrite } = useActivity();
    const { loading, execute } = useAsyncAction();

    // ====== 2. Core State ======
    const [lastSyncTime, setLastSyncTime] = useState(new Date());

    // UI & Tabs
    const [activeTab, setActiveTab] = useState(() => {
        if (typeof window === 'undefined') return 'profile';
        return localStorage.getItem('adminActiveTab') || 'profile';
    });

    // Content & Permissions
    const [toast, setToast] = useState(null);
    const notificationsEnabledRef = useRef(true);

    // ====== 3. Callbacks & Memoized Values (Logic Definitions) ======
    const showToast = useCallback((message, type = 'success') => {
        if (notificationsEnabledRef.current) {
            setToast({
                message: normalizeRenderableText(message, language, t('admin.auth.errors.default')),
                type
            });
        }
    }, [language, t]);
    const {
        user,
        isAuthLoading,
        userId,
        userRole,
        userDisplayName,
        setUserDisplayName,
        email,
        setEmail,
        password,
        setPassword,
        isRegistering,
        setIsRegistering,
        showPassword,
        setShowPassword,
        capsLockOn,
        setCapsLockOn,
        authError,
        setAuthError,
        rememberEmail,
        setRememberEmail,
        handleLogin,
        handlePasswordKeyState
    } = useAdminAuth({
        showToast,
        t,
        language,
        execute,
        trackRead,
        trackWrite
    });

    const {
        rolePermissions,
        unreadMessagesCount,
        fetchRolePermissions,
        fetchMessages,
        checkActionAllowed,
        isTabAllowed
    } = useAdminAccess(userRole);
    const {
        homeData,
        setHomeData,
        aboutData,
        setAboutData,
        contactData,
        setContactData,
        settingsData,
        setSettingsData,
        sidebarPersistent,
        setSidebarPersistent,
        fetchSectionData,
        saveSectionData
    } = useAdminContent({
        trackRead,
        trackWrite,
        queryClient,
        execute,
        checkActionAllowed,
        showToast,
        t
    });

    useAdminBootstrap({
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
    });

    // ====== Handlers ======
    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

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
                {toast && <AdminToast message={toast.message} type={toast.type} onClose={() => setToast(null)} language={language} />}
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
            {toast && <AdminToast message={toast.message} type={toast.type} onClose={() => setToast(null)} language={language} />}
            <Suspense fallback={<div style={{display: 'flex', justifyContent: 'center', padding: '4rem'}}><Spinner size="xl" /></div>}>
                {renderActiveTab()}
            </Suspense>
        </AdminLayout>
    );
};

export default Admin;
