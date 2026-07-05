import React, { useState, useEffect } from 'react';
import UserService from '../../../../services/UserService';
import { Users, UserCheck, UserMinus, Shield, ShieldCheck, UserCog, User, Activity, Clock, ShieldAlert, Key } from 'lucide-react';
import { Spinner } from '@/shared/components/ui';
import { motion } from 'framer-motion';
import './UserManagementOverviewPanel.scss';

import { useTranslation } from '../../../../hooks/useTranslation';

const UserManagementOverviewPanel = ({ userRole, currentUser }) => {
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

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <motion.div 
            className="auth-overview-panel"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            <div>
                <h3 className="section-title">
                    <div className="title-icon"><Users size={20} /></div>
                    {t('admin.auth.overview.title') || 'User Base Overview'}
                </h3>
                
                <div className="stat-cards-grid">
                    <motion.div variants={itemVariants} className="overview-stat-card accent-primary">
                        <div className="icon-wrapper"><Users size={24} /></div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.total}</div>
                            <div className="stat-label">{t('admin.auth.overview.totalUsers') || 'Total Users'}</div>
                        </div>
                    </motion.div>
                    <motion.div variants={itemVariants} className="overview-stat-card accent-success">
                        <div className="icon-wrapper"><UserCheck size={24} /></div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.active}</div>
                            <div className="stat-label">{t('admin.auth.overview.activeUsers') || 'Active Users'}</div>
                        </div>
                    </motion.div>
                    <motion.div variants={itemVariants} className="overview-stat-card accent-danger">
                        <div className="icon-wrapper"><UserMinus size={24} /></div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.disabled}</div>
                            <div className="stat-label">{t('admin.auth.overview.disabledUsers') || 'Disabled Users'}</div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div>
                <h3 className="section-title">
                    <div className="title-icon"><ShieldAlert size={20} /></div>
                    {t('admin.auth.overview.rolesTitle') || 'Role Distribution'}
                </h3>
                <div className="stat-cards-grid">
                    <motion.div variants={itemVariants} className="overview-stat-card accent-warning">
                        <div className="icon-wrapper"><Shield size={24} /></div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.administrators}</div>
                            <div className="stat-label">{t('admin.auth.overview.administrators') || 'Administrators'}</div>
                        </div>
                    </motion.div>
                    <motion.div variants={itemVariants} className="overview-stat-card accent-info">
                        <div className="icon-wrapper"><UserCog size={24} /></div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.editors}</div>
                            <div className="stat-label">{t('admin.auth.overview.editors') || 'Editors'}</div>
                        </div>
                    </motion.div>
                    <motion.div variants={itemVariants} className="overview-stat-card accent-accent">
                        <div className="icon-wrapper"><User size={24} /></div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.authors}</div>
                            <div className="stat-label">{t('admin.auth.overview.authors') || 'Authors'}</div>
                        </div>
                    </motion.div>
                    <motion.div variants={itemVariants} className="overview-stat-card accent-secondary">
                        <div className="icon-wrapper"><Activity size={24} /></div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.viewers}</div>
                            <div className="stat-label">{t('admin.auth.overview.viewers') || 'Viewers'}</div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <motion.div variants={itemVariants}>
                <h3 className="section-title">
                    <div className="title-icon"><Key size={20} /></div>
                    {t('admin.auth.overview.sessionInfo') || 'Current Session Details'}
                </h3>
                <div className="session-info-card">
                    <div className="session-grid">
                        <div className="info-item">
                            <div className="info-label">{t('admin.auth.overview.authProvider') || 'Provider'}</div>
                            <div className="info-value">
                                {currentUser?.providerData?.[0]?.providerId === 'google.com' ? 'Google' :
                                currentUser?.providerData?.[0]?.providerId === 'password' ? 'Email / Password' :
                                currentUser?.providerData?.[0]?.providerId === 'github.com' ? 'GitHub' :
                                <><ShieldCheck size={16} className="ui-text-success"/> Firebase Auth</>}
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">{t('admin.auth.overview.currentUser') || 'Account'}</div>
                            <div className="info-value">{currentUser?.email || 'N/A'}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">{t('admin.auth.overview.currentRole') || 'Active Role'}</div>
                            <div className="info-value" style={{ textTransform: 'capitalize' }}>{userRole}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">{t('admin.auth.overview.emailStatus') || 'Verification'}</div>
                            <div className="info-value">
                                {currentUser?.emailVerified 
                                    ? <span className="ui-text-success">{t('admin.auth.overview.verified') || 'Verified'}</span>
                                    : <span className="ui-text-warning">{t('admin.auth.overview.unverified') || 'Unverified'}</span>
                                }
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">{t('admin.auth.overview.lastLogin') || 'Last Login'}</div>
                            <div className="info-value">
                                <Clock size={16} /> 
                                {currentUser?.metadata?.lastSignInTime ? new Date(currentUser.metadata.lastSignInTime).toLocaleString() : 'N/A'}
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">{t('admin.auth.overview.authStatus') || 'Status'}</div>
                            <div className="info-value ui-text-success">{t('admin.auth.overview.active') || 'ACTIVE'}</div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default UserManagementOverviewPanel;
