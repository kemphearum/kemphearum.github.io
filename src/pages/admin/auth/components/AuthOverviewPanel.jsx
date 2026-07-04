import React, { useState, useEffect } from 'react';
import UserService from '../../../../services/UserService';
import { Users, UserCheck, UserMinus, Shield, ShieldCheck, UserCog, User, Activity, Clock } from 'lucide-react';
import { Spinner } from '@/shared/components/ui';

import { useTranslation } from '../../../../hooks/useTranslation';

const AuthOverviewPanel = ({ userRole, currentUser }) => {
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const loadStats = async () => {
            try {
                const data = await UserService.fetchStats(userRole);
                if (isMounted) {
                    setStats(data);
                }
            } catch (err) {
                console.error("Failed to load auth stats", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadStats();
        return () => { isMounted = false; };
    }, [userRole]);

    if (loading) {
        return (
            <div className="ui-flex-center ui-p-large">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="auth-overview-panel">
            <h3 className="ui-heading ui-mb-medium">{t('admin.auth.overview.title') || 'Authentication Overview'}</h3>
            
            <div className="ui-grid ui-grid-cols-4 ui-gap-medium ui-mb-large">
                <div className="ui-statCard">
                    <div className="ui-statIcon ui-bg-primary-light ui-text-primary"><Users size={24} /></div>
                    <div className="ui-statInfo">
                        <div className="ui-statValue">{stats.total}</div>
                        <div className="ui-statLabel">{t('admin.auth.overview.totalUsers') || 'Total Users'}</div>
                    </div>
                </div>
                <div className="ui-statCard">
                    <div className="ui-statIcon ui-bg-success-light ui-text-success"><UserCheck size={24} /></div>
                    <div className="ui-statInfo">
                        <div className="ui-statValue">{stats.active}</div>
                        <div className="ui-statLabel">{t('admin.auth.overview.activeUsers') || 'Active Users'}</div>
                    </div>
                </div>
                <div className="ui-statCard">
                    <div className="ui-statIcon ui-bg-danger-light ui-text-danger"><UserMinus size={24} /></div>
                    <div className="ui-statInfo">
                        <div className="ui-statValue">{stats.disabled}</div>
                        <div className="ui-statLabel">{t('admin.auth.overview.disabledUsers') || 'Disabled Users'}</div>
                    </div>
                </div>
                <div className="ui-statCard">
                    <div className="ui-statIcon ui-bg-warning-light ui-text-warning"><Shield size={24} /></div>
                    <div className="ui-statInfo">
                        <div className="ui-statValue">{stats.administrators}</div>
                        <div className="ui-statLabel">{t('admin.auth.overview.administrators') || 'Administrators'}</div>
                    </div>
                </div>
                
                <div className="ui-statCard">
                    <div className="ui-statIcon ui-bg-info-light ui-text-info"><UserCog size={24} /></div>
                    <div className="ui-statInfo">
                        <div className="ui-statValue">{stats.editors}</div>
                        <div className="ui-statLabel">{t('admin.auth.overview.editors') || 'Editors'}</div>
                    </div>
                </div>
                <div className="ui-statCard">
                    <div className="ui-statIcon ui-bg-accent-light ui-text-accent"><User size={24} /></div>
                    <div className="ui-statInfo">
                        <div className="ui-statValue">{stats.authors}</div>
                        <div className="ui-statLabel">{t('admin.auth.overview.authors') || 'Authors'}</div>
                    </div>
                </div>
                <div className="ui-statCard">
                    <div className="ui-statIcon ui-bg-secondary-light ui-text-secondary"><Activity size={24} /></div>
                    <div className="ui-statInfo">
                        <div className="ui-statValue">{stats.viewers}</div>
                        <div className="ui-statLabel">{t('admin.auth.overview.viewers') || 'Viewers'}</div>
                    </div>
                </div>
            </div>

            <h3 className="ui-heading ui-mb-medium">{t('admin.auth.overview.sessionInfo') || 'Current Session Info'}</h3>
            <div className="ui-card ui-p-medium">
                <div className="ui-grid ui-grid-cols-2 ui-gap-medium">
                    <div className="ui-statInfo">
                        <div className="ui-text-sm ui-text-bold ui-mb-xs">{t('admin.auth.overview.authProvider') || 'Authentication Provider'}</div>
                        <div className="ui-text-sm ui-flex-center-gap-small">
                            {currentUser?.providerData?.[0]?.providerId === 'google.com' ? 'Google' :
                            currentUser?.providerData?.[0]?.providerId === 'password' ? 'Email/Password' :
                            currentUser?.providerData?.[0]?.providerId === 'github.com' ? 'GitHub' :
                            <><ShieldCheck size={14} className="ui-text-success"/> Firebase Authentication</>}
                        </div>
                    </div>
                    <div className="ui-statInfo">
                        <div className="ui-text-sm ui-text-bold ui-mb-xs">{t('admin.auth.overview.currentUser') || 'Current User'}</div>
                        <div className="ui-text-sm">{currentUser?.email || 'N/A'}</div>
                    </div>
                    <div className="ui-statInfo">
                        <div className="ui-text-sm ui-text-bold ui-mb-xs">{t('admin.auth.overview.currentRole') || 'Current Role'}</div>
                        <div className="ui-text-sm" style={{ textTransform: 'capitalize' }}>{userRole}</div>
                    </div>
                    <div className="ui-statInfo">
                        <div className="ui-text-sm ui-text-bold ui-mb-xs">{t('admin.auth.overview.emailStatus') || 'Email Verification Status'}</div>
                        <div className="ui-text-sm">
                            {currentUser?.emailVerified 
                                ? <span className="ui-text-success">{t('admin.auth.overview.verified') || 'Verified'}</span>
                                : <span className="ui-text-warning">{t('admin.auth.overview.unverified') || 'Unverified'}</span>
                            }
                        </div>
                    </div>
                    <div className="ui-statInfo">
                        <div className="ui-text-sm ui-text-bold ui-mb-xs">{t('admin.auth.overview.lastLogin') || 'Last Login'}</div>
                        <div className="ui-text-sm ui-flex-center-gap-small">
                            <Clock size={14} /> 
                            {currentUser?.metadata?.lastSignInTime ? new Date(currentUser.metadata.lastSignInTime).toLocaleString() : 'N/A'}
                        </div>
                    </div>
                    <div className="ui-statInfo">
                        <div className="ui-text-sm ui-text-bold ui-mb-xs">{t('admin.auth.overview.authStatus') || 'Authentication Status'}</div>
                        <div className="ui-text-sm ui-text-bold">{t('admin.auth.overview.active') || 'ACTIVE'}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthOverviewPanel;
