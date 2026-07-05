import React, { useState, useEffect } from 'react';
import UserService from '../../../../services/UserService';
import { Shield, ShieldAlert, Users, Info } from 'lucide-react';
import { Spinner } from '@/shared/components/ui';
import { useTranslation } from '../../../../hooks/useTranslation';
import RequirePermission from '@/shared/components/auth/RequirePermission';


const ROLES_INFO = [
    {
        id: 'admin',
        name: 'Administrator',
        description: 'Full access to all system features including database management, audit logs, and authentication settings. Cannot perform super-admin specific destructive actions.',
        icon: ShieldAlert,
        color: 'var(--color-danger)'
    },
    {
        id: 'editor',
        name: 'Editor',
        description: 'Can manage all content across the application (projects, blog, experience, etc.) but cannot access system settings, database management, or user authentication panels.',
        icon: Shield,
        color: 'var(--color-warning)'
    },
    {
        id: 'author',
        name: 'Author',
        description: 'Can create and edit their own content, but may be restricted from publishing or editing other users\' content. (Customizable via Permissions Matrix)',
        icon: Users,
        color: 'var(--color-accent)'
    },
    {
        id: 'viewer',
        name: 'Viewer',
        description: 'Read-only access to the admin dashboard and content modules. Cannot create, edit, or delete data.',
        icon: Info,
        color: 'var(--color-info)'
    }
];

const UserManagementRolesPanel = ({ userRole }) => {
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const loadStats = async () => {
            try {
                const data = await UserService.fetchStats(userRole);
                if (isMounted) setStats(data);
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

    return (
        <div className="auth-roles-panel">
            <div className="ui-flex-between ui-mb-medium">
                <h3 className="ui-heading ui-m-0">{t('admin.auth.roles.title') || 'System Roles'}</h3>
                <RequirePermission action="edit" resource="users">
                    <button className="ui-btn ui-btn-primary ui-btn-sm">
                        {t('admin.auth.roles.manage') || 'Manage Default Roles'}
                    </button>
                </RequirePermission>
            </div>

            <div className="ui-mb-medium">
                <div className="ui-alert ui-alert-info">
                    <strong>{t('admin.auth.roles.archNote') || 'Architecture Note:'}</strong> {t('admin.auth.roles.archDesc') || 'The system supports extending base roles with custom permissions via the Permission Matrix. The roles below are the default System Roles.'}
                </div>
            </div>

            <div className="ui-grid ui-grid-cols-2 ui-gap-medium">
                {ROLES_INFO.map(role => {
                    const count = stats ? (
                        role.id === 'admin' ? stats.administrators :
                        role.id === 'editor' ? stats.editors :
                        role.id === 'author' ? stats.authors :
                        role.id === 'viewer' ? stats.viewers : 0
                    ) : 0;
                    
                    const Icon = role.icon;

                    return (
                        <div key={role.id} className="ui-card ui-p-medium">
                            <div className="ui-flex-between ui-mb-small">
                                <h4 className="ui-heading ui-m-0 ui-flex-center-gap-small" style={{ color: role.color }}>
                                    <Icon size={18} /> {t(`admin.auth.roles.${role.id}.name`) || role.name}
                                </h4>
                                <div className="ui-badge ui-badge-secondary">
                                    {count} {t('admin.auth.roles.users') || 'Users'}
                                </div>
                            </div>
                            <p className="ui-text-muted ui-text-sm ui-m-0">
                                {t(`admin.auth.roles.${role.id}.description`) || role.description}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default UserManagementRolesPanel;
