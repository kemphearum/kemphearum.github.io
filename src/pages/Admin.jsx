import React, { useState, useCallback, useRef, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, Eye, EyeOff, ShieldCheck, Mail, MailCheck } from 'lucide-react';
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
import { listContentTypes, getContentType, isContentType } from '../registry/contentTypeRegistry';
import { useCommandPalette } from '../hooks/useCommandPalette';
import CommandPalette from './admin/search/CommandPalette';
import { useNotifications } from '../context/NotificationContextValue';

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

// Special (non-content) tab components
const DashboardTab = lazyWithRetry(() => import('./admin/dashboard/DashboardTab'), 'dashboard');
const GeneralTab = lazyWithRetry(() => import('./admin/general/GeneralTab'), 'general');
const ProfileTab = lazyWithRetry(() => import('./admin/profile/ProfileTab'), 'profile');
const SettingsTab = lazyWithRetry(() => import('./admin/settings/SettingsTab'), 'settings');
const MessagesTab = lazyWithRetry(() => import('./admin/messages/MessagesTab'), 'messages');
const UsersTab = lazyWithRetry(() => import('./admin/users/UsersTab'), 'users');
const DatabaseTab = lazyWithRetry(() => import('./admin/database/DatabaseTab'), 'database');
const AuditLogsTab = lazyWithRetry(() => import('./admin/audit/AuditLogsTab'), 'audit');
const AnalyticsTab = lazyWithRetry(() => import('./admin/analytics/AnalyticsTab'), 'analytics');

// Content-type tabs are derived from the registry: adding a content type there
// makes it route here automatically (all content tabs take the same props).
const CONTENT_TABS = Object.fromEntries(
    listContentTypes().map((type) => [type.key, lazyWithRetry(type.load, type.key)])
);

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
    const { open: isPaletteOpen, setOpen: setPaletteOpen } = useCommandPalette();
    const { record: recordNotification } = useNotifications();

    // UI & Tabs
    const [activeTab, setActiveTab] = useState(() => {
        if (typeof window === 'undefined') return 'dashboard';
        return localStorage.getItem('adminActiveTab') || 'dashboard';
    });

    // Content & Permissions
    const [toast, setToast] = useState(null);
    const notificationsEnabledRef = useRef(true);

    // ====== 3. Callbacks & Memoized Values (Logic Definitions) ======
    const showToast = useCallback((message, type = 'success') => {
        if (!notificationsEnabledRef.current) return;
        const normalized = normalizeRenderableText(message, language, t('admin.auth.errors.default'));
        setToast({ message: normalized, type });
        recordNotification(normalized, type);
    }, [language, t, recordNotification]);
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
        magicLinkSent,
        handleLogin,
        handleGoogleLogin,
        handleAppleLogin,
        handleSendMagicLink,
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

        // Content-type tabs share the same props and are resolved from the registry.
        if (isContentType(activeTab)) {
            const ContentTab = CONTENT_TABS[activeTab];
            return <ContentTab {...commonProps} />;
        }

        switch (activeTab) {
            case 'dashboard':
                return <DashboardTab {...commonProps} setActiveTab={setActiveTab} />;
            case 'general':
                return <GeneralTab {...commonProps} homeData={homeData} setHomeData={setHomeData} aboutData={aboutData} setAboutData={setAboutData} contactData={contactData} setContactData={setContactData} loading={loading} saveSectionData={saveSectionData} />;
            case 'profile':
                return <ProfileTab {...commonProps} user={user} setUserDisplayName={setUserDisplayName} />;
            case 'settings':
                return <SettingsTab {...commonProps} settingsData={settingsData} setSettingsData={setSettingsData} loading={loading} saveSectionData={saveSectionData} sidebarPersistent={sidebarPersistent} setSidebarPersistent={setSidebarPersistent} />;
            case 'messages':
                return <MessagesTab {...commonProps} onMessagesChange={fetchMessages} />;
            case 'users':
                return <UsersTab {...commonProps} user={user} />;
            case 'database':
                return <DatabaseTab {...commonProps} setActiveTab={setActiveTab} />;
            case 'audit':
                return <AuditLogsTab {...commonProps} />;
            case 'analytics':
                return <AnalyticsTab {...commonProps} />;
            default:
                return <DashboardTab {...commonProps} setActiveTab={setActiveTab} />;
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

                    <div className="ui-loginDivider"><span>{t('admin.auth.orDivider')}</span></div>

                    {magicLinkSent ? (
                        <div className="ui-loginMagicSent" role="status">
                            <MailCheck size={16} />
                            <span>{t('admin.auth.magicLinkSent')}</span>
                        </div>
                    ) : (
                        <div className="ui-loginProviders">
                            <button
                                type="button"
                                className="ui-loginProviderBtn ui-loginProviderBtn--google"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                            >
                                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                                    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
                                    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18z" />
                                    <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34z" />
                                    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z" />
                                </svg>
                                {t('admin.auth.continueWithGoogle')}
                            </button>
                            <button
                                type="button"
                                className="ui-loginProviderBtn ui-loginProviderBtn--apple"
                                onClick={handleAppleLogin}
                                disabled={loading}
                            >
                                <svg width="16" height="16" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
                                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                                </svg>
                                {t('admin.auth.continueWithApple')}
                            </button>
                            <button
                                type="button"
                                className="ui-loginProviderBtn ui-loginProviderBtn--link"
                                onClick={handleSendMagicLink}
                                disabled={loading}
                            >
                                <Mail size={16} />
                                {t('admin.auth.sendMagicLink')}
                            </button>
                        </div>
                    )}

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
            title={t(getContentType(activeTab)?.labelKey || tabLabelKeys[activeTab] || 'admin.dashboard.title')}
            subtitle={t(getContentType(activeTab)?.subtitleKey || tabSubtitleKeys[activeTab] || 'admin.subtitles.default')}
            settingsData={settingsData}
        >
            {toast && <AdminToast message={toast.message} type={toast.type} onClose={() => setToast(null)} language={language} />}
            <CommandPalette
                open={isPaletteOpen}
                onClose={() => setPaletteOpen(false)}
                onNavigate={handleTabClick}
                isActionAllowed={checkActionAllowed}
                canViewTab={(key) => isTabAllowed(key, userRole, rolePermissions)}
            />
            <Suspense fallback={<div style={{display: 'flex', justifyContent: 'center', padding: '4rem'}}><Spinner size="xl" /></div>}>
                {renderActiveTab()}
            </Suspense>
        </AdminLayout>
    );
};

export default Admin;
