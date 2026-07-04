import { useCallback, useEffect, useState } from 'react';
import { serverTimestamp } from 'firebase/firestore';
import { fetchGeoData } from '../../../utils/geoUtils';
import { getDeviceType, getSessionId } from '../../../hooks/useAnalytics';
import { normalizeRole } from '../../../utils/permissions';
import UserService from '../../../services/UserService';
import AuthService from '../../../services/AuthService';
import AuditLogService from '../../../services/AuditLogService';
import {
    AUTH_REMEMBER_EMAIL_KEY,
    isBootstrapSuperAdminEmail,
    formatAuthErrorMessage,
    normalizeRenderableText
} from '../adminUtils';

export const useAdminAuth = ({
    showToast,
    t,
    language,
    execute,
    trackRead,
    trackWrite
}) => {
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
    const [magicLinkSent, setMagicLinkSent] = useState(false);
    const [rememberEmail, setRememberEmail] = useState(() => {
        if (typeof window === 'undefined') return false;
        return Boolean(localStorage.getItem(AUTH_REMEMBER_EMAIL_KEY));
    });

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
        setMagicLinkSent(false);
    }, [isRegistering]);

    useEffect(() => {
        const unsubscribe = AuthService.onAuthChange(async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Reset stale login errors once a session is present.
                setAuthError('');
                const currentEmail = String(currentUser.email || '').toLowerCase();
                try {
                    let userData = await UserService.fetchUserById(currentUser.uid);

                    if (!userData) {
                        const legacyData = await UserService.fetchUserByEmail(currentUser.email);
                        if (legacyData) {
                            console.log(`Migrating legacy user ${currentUser.email} to UID-keyed document...`);
                            const { id, ...data } = legacyData;
                            try {
                                await UserService.createUserDoc(data, currentUser.uid);
                                try {
                                    await UserService.deleteUserDoc(id);
                                } catch (cleanupError) {
                                    console.warn(`Legacy user doc cleanup failed for ${currentUser.email}, but continuing session natively:`, cleanupError);
                                }
                                userData = await UserService.fetchUserById(currentUser.uid);
                                console.log('Migration successful.');
                            } catch (migrationError) {
                                // Keep legacy account usable instead of downgrading to pending access.
                                console.warn(`Legacy migration failed for ${currentUser.email}; continuing with legacy document permissions.`, migrationError);
                                userData = legacyData;
                            }
                        }
                    }

                    if (!userData) {
                        const initialRole = isBootstrapSuperAdminEmail(currentEmail) ? 'superadmin' : 'pending';
                        await UserService.createUserDoc({
                            email: currentEmail,
                            role: initialRole,
                            isActive: true
                        }, currentUser.uid);
                        userData = await UserService.fetchUserById(currentUser.uid);
                    } else if (userData.id === currentUser.uid && (!userData.createdAt || userData.isActive === undefined)) {
                        const updates = {};
                        if (!userData.createdAt) updates.createdAt = serverTimestamp();
                        if (userData.isActive === undefined) updates.isActive = true;
                        await UserService.updateUserField(userData.id, updates);
                        userData = { ...userData, ...updates };
                    }

                    if (userData) {
                        if (userData.isActive === false) {
                            await AuthService.logout();
                            setUser(null);
                            setUserRole(null);
                            setUserId(null);
                            setUserDisplayName('');
                            showToast(t('admin.auth.errors.disabledByAdmin'), 'error');
                            setIsAuthLoading(false);
                            return;
                        }

                        let fetchedRole = normalizeRole(userData.role) || 'pending';
                        setUserId(userData.id);
                        setUserDisplayName(normalizeRenderableText(userData.displayName, language, ''));

                        if (isBootstrapSuperAdminEmail(currentEmail) && fetchedRole !== 'superadmin') {
                            fetchedRole = 'superadmin';
                            UserService.updateUserField(userData.id, { role: 'superadmin' }).catch(console.error);
                        } else if (userData.role !== fetchedRole && fetchedRole === 'superadmin') {
                            UserService.updateUserField(userData.id, { role: fetchedRole }).catch(console.error);
                        }

                        setUserRole(fetchedRole);
                    }
                } catch (error) {
                    console.error('Error fetching user role:', error);
                    try {
                        const fallbackUser = await UserService.fetchUserByEmail(currentEmail);
                        if (fallbackUser) {
                            setUserId(fallbackUser.id);
                            setUserDisplayName(normalizeRenderableText(fallbackUser.displayName, language, ''));
                            setUserRole(normalizeRole(fallbackUser.role) || 'pending');
                        } else {
                            setUserRole(isBootstrapSuperAdminEmail(currentEmail) ? 'superadmin' : 'pending');
                        }
                    } catch {
                        setUserRole(isBootstrapSuperAdminEmail(currentEmail) ? 'superadmin' : 'pending');
                    }
                } finally {
                    setIsAuthLoading(false);
                }
            } else {
                // Clear stale auth errors after logout so login form starts clean.
                setAuthError('');
                setUserRole(null);
                setUserId(null);
                setUserDisplayName('');
                setIsAuthLoading(false);
            }
        });
        return () => unsubscribe();
    }, [language, showToast, t]);

    const recordAuthAudit = useCallback(async ({ email: auditEmail, method, flow, status, reason = null }) => {
        const geoData = await fetchGeoData().catch(() => ({ ip: 'Unknown', country_name: 'Unknown', city: 'Unknown' }));
        const logBase = {
            email: auditEmail,
            ipAddress: geoData.ip,
            country: geoData.country_name,
            city: geoData.city,
            userAgent: navigator.userAgent,
            deviceType: getDeviceType(),
            sessionId: getSessionId(),
            details: { category: 'auth', flow, method }
        };
        try {
            // Route by session state, not status: an unauthenticated event (failed
            // login, blocked popup, magic-link request) cannot write auditLogs
            // directly because the rules require a session, so it goes through the
            // backend function. Authenticated events write client-side.
            if (AuthService.getCurrentUser()) {
                await AuditLogService.addAuditLog(logBase, status, reason, trackWrite);
            } else {
                // The backend requires a valid email; skip when there isn't one
                // (e.g. a blocked OAuth popup before any account was identified).
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(auditEmail || '')) return;
                await AuditLogService.recordAuthEvent(logBase, status, reason);
            }
        } catch (auditError) {
            console.warn('[useAdminAuth] Failed to record auth audit log:', auditError);
        }
    }, [trackWrite]);

    const handleProviderLogin = useCallback(async (provider) => {
        setAuthError('');
        const method = provider === 'apple' ? 'apple' : 'google';

        const result = await execute(async () => {
            try {
                const credential = provider === 'apple'
                    ? await AuthService.loginWithApple()
                    : await AuthService.loginWithGoogle();
                // onAuthChange handles user-doc provisioning for any provider.
                await recordAuthAudit({
                    email: String(credential.user?.email || '').toLowerCase(),
                    method,
                    flow: 'login',
                    status: 'success'
                });
            } catch (error) {
                if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
                    // User dismissed the popup — not an error worth surfacing.
                    return;
                }
                await recordAuthAudit({
                    email: String(error?.customData?.email || email || '').trim().toLowerCase(),
                    method,
                    flow: 'login',
                    status: 'failure',
                    reason: formatAuthErrorMessage(error, t, language, error.message)
                });
                throw error;
            }
        });

        if (!result?.success) {
            const code = result?.error?.code;
            if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
                return;
            }
            setAuthError(formatAuthErrorMessage(result?.error, t, language));
        }
    }, [email, execute, language, recordAuthAudit, t]);

    const handleGoogleLogin = useCallback(() => handleProviderLogin('google'), [handleProviderLogin]);
    const handleAppleLogin = useCallback(() => handleProviderLogin('apple'), [handleProviderLogin]);

    const handleSendMagicLink = useCallback(async () => {
        setAuthError('');
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
            setAuthError(t('admin.auth.errors.emailRequired'));
            return;
        }

        const result = await execute(async () => {
            await AuthService.sendMagicLink(normalizedEmail);
            await recordAuthAudit({
                email: normalizedEmail,
                method: 'email_link',
                flow: 'magic_link_request',
                status: 'success',
                reason: 'Sign-in link sent'
            });
        });

        if (!result?.success) {
            setAuthError(formatAuthErrorMessage(result?.error, t, language));
            return;
        }

        setMagicLinkSent(true);
    }, [email, execute, language, recordAuthAudit, t]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const href = window.location.href;
        if (!AuthService.isMagicLink(href)) return;

        const stored = AuthService.getStoredMagicLinkEmail();
        const linkEmail = stored || window.prompt(t('admin.auth.magicLinkEmailPrompt')) || '';
        if (!linkEmail) {
            setAuthError(t('admin.auth.errors.magicLinkInvalid'));
            return;
        }

        (async () => {
            try {
                const credential = await AuthService.completeMagicLink(linkEmail, href);
                window.history.replaceState({}, document.title, '/admin');
                await recordAuthAudit({
                    email: String(credential.user?.email || linkEmail).toLowerCase(),
                    method: 'email_link',
                    flow: 'login',
                    status: 'success'
                });
            } catch (error) {
                await recordAuthAudit({
                    email: linkEmail.toLowerCase(),
                    method: 'email_link',
                    flow: 'login',
                    status: 'failure',
                    reason: formatAuthErrorMessage(error, t, language, error.message)
                });
                setAuthError(formatAuthErrorMessage(error, t, language));
            }
        })();
        // Run once on mount to complete a returning magic link.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLogin = useCallback(async (event) => {
        event.preventDefault();
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

        const flow = isRegistering ? 'register' : 'login';
        const auditPassword = (status, reason = null) => recordAuthAudit({
            email: normalizedEmail,
            method: 'email_password',
            flow,
            status,
            reason
        });

        const result = await execute(async () => {
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

                    await auditPassword('success', 'User Registered');
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

                    await auditPassword('success');
                }
            } catch (error) {
                await auditPassword('failure', formatAuthErrorMessage(error, t, language, error.message));
                throw error;
            }
        });

        if (!result?.success) {
            setAuthError(formatAuthErrorMessage(result?.error, t, language));
            return;
        }

        if (isRegistering) {
            showToast(t('admin.auth.accountCreated'), 'success');
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
    }, [email, execute, isRegistering, language, password, rememberEmail, recordAuthAudit, showToast, t, trackRead, trackWrite]);

    const handlePasswordKeyState = useCallback((event) => {
        setCapsLockOn(Boolean(event.getModifierState?.('CapsLock')));
    }, []);

    return {
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
        setMagicLinkSent,
        handleLogin,
        handleGoogleLogin,
        handleAppleLogin,
        handleSendMagicLink,
        handlePasswordKeyState
    };
};

export default useAdminAuth;
