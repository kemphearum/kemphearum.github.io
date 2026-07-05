import React, { useState, useEffect } from 'react';
import { auth, db } from '../../../../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Monitor, Smartphone, Globe, ShieldCheck, Activity } from 'lucide-react';
import { Spinner, EmptyState } from '@/shared/components/ui';
import { formatDate } from '../../../../utils/dateUtils';
import { useTranslation } from '../../../../hooks/useTranslation';
import { motion } from 'framer-motion';

const UserManagementSessionsPanel = () => {
    const { t, language } = useTranslation();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentUser = auth.currentUser;

    useEffect(() => {
        let isMounted = true;
        const fetchSessions = async () => {
            if (!currentUser) return;
            try {
                const sessionsRef = collection(db, 'users', currentUser.uid, 'sessions');
                const q = query(sessionsRef, orderBy('loginTime', 'desc'), limit(10));
                const snap = await getDocs(q);
                
                if (isMounted) {
                    setSessions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                }
            } catch (err) {
                console.error("Failed to fetch session history", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchSessions();
        return () => { isMounted = false; };
    }, [currentUser]);

    const getDeviceIcon = (userAgent = '') => {
        const ua = userAgent.toLowerCase();
        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return Smartphone;
        if (ua.includes('win') || ua.includes('mac') || ua.includes('linux')) return Monitor;
        return Globe;
    };

    const getBrowserName = (userAgent = '') => {
        const ua = userAgent.toLowerCase();
        if (ua.includes('edg')) return 'Edge';
        if (ua.includes('chrome')) return 'Chrome';
        if (ua.includes('firefox')) return 'Firefox';
        if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
        return t('admin.auth.session.unknownBrowser') || 'Unknown Browser';
    };

    if (loading) {
        return (
            <div className="ui-flex-center ui-p-large">
                <Spinner size="lg" />
            </div>
        );
    }

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
            className="auth-sessions-panel"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            <motion.div variants={itemVariants} className="ui-mb-medium">
                <h3 className="ui-heading ui-m-0">{t('admin.auth.session.currentSession') || 'Current Session'}</h3>
            </motion.div>
            
            <motion.div variants={itemVariants} className="ui-card ui-p-medium ui-mb-large" style={{ borderLeft: '4px solid var(--color-success)' }}>
                <div className="ui-flex-between">
                    <div>
                        <div className="ui-flex-center-gap-small ui-mb-small">
                            <ShieldCheck size={20} className="ui-text-success" />
                            <strong>{t('admin.auth.session.activeSession') || 'Active Session'} ({currentUser?.email})</strong>
                            <span className="ui-badge ui-badge-success">{t('admin.auth.session.thisDevice') || 'This Device'}</span>
                        </div>
                        <div className="ui-text-sm ui-text-muted">
                            <p className="ui-m-0">{t('admin.auth.session.started') || 'Started'}: {currentUser?.metadata?.lastSignInTime ? new Date(currentUser.metadata.lastSignInTime).toLocaleString(language === 'km' ? 'km-KH' : 'en-US') : (t('admin.auth.session.justNow') || 'Just now')}</p>
                            <p className="ui-m-0">{t('admin.auth.session.provider') || 'Provider'}: {currentUser?.providerData?.[0]?.providerId || 'email/password'}</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="ui-flex-between ui-mb-medium">
                <h3 className="ui-heading ui-m-0">{t('admin.auth.session.recentLoginHistory') || 'Recent Login History'}</h3>
            </motion.div>

            <motion.div variants={itemVariants}>
                {sessions.length === 0 ? (
                    <EmptyState 
                        title={t('admin.auth.session.noSessionHistory') || "No session history"}
                        description={t('admin.auth.session.sessionLoggingEnabled') || "Session history logging has just been enabled."}
                        icon={Activity}
                    />
                ) : (
                    <div className="ui-card">
                        <div className="ui-table-container">
                            <table className="ui-table">
                                <thead>
                                    <tr>
                                        <th>{t('admin.auth.session.tableDeviceBrowser') || 'Device / Browser'}</th>
                                        <th>{t('admin.auth.session.tableLocationIP') || 'Location (IP)'}</th>
                                        <th>{t('admin.auth.session.tableTime') || 'Time'}</th>
                                        <th>{t('admin.auth.session.tableMethod') || 'Method'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sessions.map((session, i) => {
                                        const DeviceIcon = getDeviceIcon(session.userAgent);
                                        const isCurrent = i === 0; // The most recent is likely the current one if just logged in
                                        return (
                                            <tr key={session.id}>
                                                <td>
                                                    <div className="ui-flex-center-gap-small">
                                                        <DeviceIcon size={16} className="ui-text-muted" />
                                                        <span>{getBrowserName(session.userAgent)} {language === 'km' ? 'នៅលើ' : 'on'} {session.platform || (t('admin.auth.session.unknownOS') || 'Unknown OS')}</span>
                                                        {isCurrent && <span className="ui-badge ui-badge-outline ui-text-xs">{t('admin.auth.session.current') || 'Current'}</span>}
                                                    </div>
                                                </td>
                                                <td className="ui-text-muted">{session.ip || (t('admin.auth.session.unknown') || 'Unknown')}</td>
                                                <td>
                                                    {session.loginTime?.toDate ? 
                                                        formatDate(session.loginTime.toDate().toISOString(), language, {
                                                            year: 'numeric', month: 'short', day: 'numeric',
                                                            hour: '2-digit', minute: '2-digit'
                                                        }) 
                                                        : (t('admin.auth.session.justNow') || 'Just now')
                                                    }
                                                </td>
                                                <td className="ui-text-muted" style={{ textTransform: 'capitalize' }}>
                                                    {session.providerId?.replace('.com', '') || (t('admin.auth.session.password') || 'Password')}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default UserManagementSessionsPanel;
 
