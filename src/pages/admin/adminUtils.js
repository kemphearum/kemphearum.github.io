import { getLocalizedField } from '../../utils/localization';
import { ACTIONS, isActionAllowed, isAdminRole, isSuperAdminRole, normalizeRole } from '../../utils/permissions';

export const tabLabelKeys = {
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

export const tabSubtitleKeys = {
    general: 'admin.subtitles.general',
    profile: 'admin.subtitles.profile',
    settings: 'admin.subtitles.settings'
};

export const AUTH_REMEMBER_EMAIL_KEY = 'adminRememberedEmail';
export const SUPERADMIN_EMAIL = 'kem.phearum@gmail.com';

export const normalizeRenderableText = (value, language = 'en', fallback = '') => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);

    if (value && typeof value === 'object') {
        const localized = getLocalizedField(value, language);
        if (localized) return localized;
        try {
            return JSON.stringify(value);
        } catch {
            return fallback;
        }
    }

    return fallback;
};

export const formatAuthErrorMessage = (error, t, language = 'en', fallback) => {
    const defaultFallback = fallback || t('admin.auth.errors.default');
    const code = error?.code || '';
    const rawMessage = typeof error === 'string' ? error : error?.message;
    const message = normalizeRenderableText(rawMessage, language, defaultFallback) || defaultFallback;

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

export const isTabAllowedForRole = (tab, role, permissions) => {
    const normalizedRole = normalizeRole(role);
    if (!normalizedRole) return false;
    if (isSuperAdminRole(normalizedRole)) return true;
    if (tab === 'profile') return true;

    if (!isActionAllowed(ACTIONS.VIEW, tab, normalizedRole, permissions)) return false;

    if (['users', 'database', 'audit'].includes(tab) && !isAdminRole(normalizedRole)) return false;

    if (permissions?.[normalizedRole]?.includes(tab)) return true;

    if (isAdminRole(normalizedRole)) return true;
    if (normalizedRole === 'editor') {
        return ['general', 'experience', 'projects', 'blog', 'messages'].includes(tab);
    }

    return false;
};
