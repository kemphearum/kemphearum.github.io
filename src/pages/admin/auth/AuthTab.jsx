import React, { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { ShieldAlert } from 'lucide-react';
import { EmptyState } from '@/shared/components/ui';
import { useTranslation } from '../../../hooks/useTranslation';
import PermissionService from '../../../services/auth/PermissionService';

import AuthOverviewPanel from './components/AuthOverviewPanel';
import AuthUsersPanel from './components/AuthUsersPanel';
import AuthRolesPanel from './components/AuthRolesPanel';
import AuthPermissionsPanel from './components/AuthPermissionsPanel';
import AuthSessionsPanel from './components/AuthSessionsPanel';
import AuthSecurityPanel from './components/AuthSecurityPanel';
import AuthActivityPanel from './components/AuthActivityPanel';
import AuthSettingsPanel from './components/AuthSettingsPanel';

const AuthTab = ({ user, userRole, showToast }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('overview');

    const canView = PermissionService.can(userRole, PermissionService.ACTIONS.VIEW, PermissionService.RESOURCES.USERS);

    if (!canView) {
        return (
            <EmptyState 
                title={t('admin.users.restricted.title') || 'Access Denied'}
                description={t('admin.users.restricted.description') || 'You do not have permission to view authentication settings.'}
                icon={ShieldAlert}
            />
        );
    }

    return (
        <div className="admin-tab-container ui-tabs-root">
            <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="ui-tabs">
                <Tabs.List className="ui-tabs-list" aria-label="Authentication & Authorization">
                    <Tabs.Trigger className="ui-tabs-trigger" value="overview">{t('admin.auth.tabs.overview') || 'Overview'}</Tabs.Trigger>
                    <Tabs.Trigger className="ui-tabs-trigger" value="users">{t('admin.auth.tabs.users') || 'Users'}</Tabs.Trigger>
                    <Tabs.Trigger className="ui-tabs-trigger" value="roles">{t('admin.auth.tabs.roles') || 'Roles'}</Tabs.Trigger>
                    <Tabs.Trigger className="ui-tabs-trigger" value="permissions">{t('admin.auth.tabs.permissions') || 'Permissions'}</Tabs.Trigger>
                    <Tabs.Trigger className="ui-tabs-trigger" value="sessions">{t('admin.auth.tabs.sessions') || 'Sessions'}</Tabs.Trigger>
                    <Tabs.Trigger className="ui-tabs-trigger" value="security">{t('admin.auth.tabs.security') || 'Security'}</Tabs.Trigger>
                    <Tabs.Trigger className="ui-tabs-trigger" value="activity">{t('admin.auth.tabs.activity') || 'Activity'}</Tabs.Trigger>
                    <Tabs.Trigger className="ui-tabs-trigger" value="settings">{t('admin.auth.tabs.settings') || 'Settings'}</Tabs.Trigger>
                </Tabs.List>

                <div className="ui-tabs-content-container" style={{ marginTop: '2rem' }}>
                    <Tabs.Content value="overview">
                        <AuthOverviewPanel showToast={showToast} userRole={userRole} currentUser={user} />
                    </Tabs.Content>
                    
                    <Tabs.Content value="users">
                        <AuthUsersPanel showToast={showToast} userRole={userRole} currentUser={user} />
                    </Tabs.Content>

                    <Tabs.Content value="roles">
                        <AuthRolesPanel showToast={showToast} userRole={userRole} />
                    </Tabs.Content>

                    <Tabs.Content value="permissions">
                        <AuthPermissionsPanel showToast={showToast} userRole={userRole} />
                    </Tabs.Content>

                    <Tabs.Content value="sessions">
                        <AuthSessionsPanel showToast={showToast} userRole={userRole} />
                    </Tabs.Content>

                    <Tabs.Content value="security">
                        <AuthSecurityPanel showToast={showToast} userRole={userRole} />
                    </Tabs.Content>

                    <Tabs.Content value="activity">
                        <AuthActivityPanel showToast={showToast} userRole={userRole} />
                    </Tabs.Content>

                    <Tabs.Content value="settings">
                        <AuthSettingsPanel showToast={showToast} userRole={userRole} />
                    </Tabs.Content>
                </div>
            </Tabs.Root>
        </div>
    );
};

export default AuthTab;
