import { useCallback, useEffect, useState } from 'react';
import { serverTimestamp } from 'firebase/firestore';
import { fetchGeoData } from '../../../utils/geoUtils';
import { getDeviceType, getSessionId } from '../../../hooks/useAnalytics';
import { isSuperAdminRole, normalizeRole } from '../../../utils/permissions';
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

                        if (isBootstrapSuperAdminEmail(currentEmail) && !isSuperAdminRole(fetchedRole)) {
                            fetchedRole = 'superadmin';
                            UserService.updateUserField(userData.id, { role: 'superadmin' }).catch(console.error);
                        } else if (userData.role !== fetchedRole && isSuperAdminRole(fetchedRole)) {
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
                sessionId: getSessionId(),
                details: {
                    flow: isRegistering ? 'register' : 'login',
                    method: 'email_password'
                }
            };
            const recordAuthAudit = async (status, reason = null) => {
                try {
                    await AuditLogService.addAuditLog(logBase, status, reason, trackWrite);
                } catch (auditError) {
                    console.warn('[useAdminAuth] Failed to record auth audit log:', auditError);
                }
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

                    await recordAuthAudit('success', 'User Registered');
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

                    await recordAuthAudit('success');
                }
            } catch (error) {
                await recordAuthAudit(
                    'failure',
                    formatAuthErrorMessage(error, t, language, error.message)
                );
                throw error;
            }
        }, {
            showToast,
            successMessage: isRegistering ? t('admin.auth.accountCreated') : undefined
        });

        if (!result?.success) {
            setAuthError(formatAuthErrorMessage(result?.error, t, language));
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
    }, [email, execute, isRegistering, language, password, rememberEmail, showToast, t, trackRead, trackWrite]);

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
        handleLogin,
        handlePasswordKeyState
    };
};

export default useAdminAuth;
