import React, { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { ShieldAlert } from 'lucide-react';
import { EmptyState } from '@/shared/components/ui';
import { useTranslation } from '../../../hooks/useTranslation';
import PermissionService from '../../../services/auth/PermissionService';

import UserManagementOverviewPanel from './components/UserManagementOverviewPanel';
import UserManagementUsersPanel from './components/UserManagementUsersPanel';
import UserManagementRolesPanel from './components/UserManagementRolesPanel';
import UserManagementPermissionsPanel from './components/UserManagementPermissionsPanel';
import UserManagementSessionsPanel from './components/UserManagementSessionsPanel';
import UserManagementSecurityPanel from './components/UserManagementSecurityPanel';
import UserManagementActivityPanel from './components/UserManagementActivityPanel';
import UserManagementSettingsPanel from './components/UserManagementSettingsPanel';

const UserManagementTab = ({ user, userRole, showToast }) => {
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
                    <Tabs.Trigger className="ui-tabs-trigger" value="roles">{t('admin.auth.tabs.rolesAndPermissions') || 'Roles & Permissions'}</Tabs.Trigger>
                    <Tabs.Trigger className="ui-tabs-trigger" value="sessions">{t('admin.auth.tabs.sessions') || 'Sessions'}</Tabs.Trigger>
                    <Tabs.Trigger className="ui-tabs-trigger" value="security">{t('admin.auth.tabs.security') || 'Security'}</Tabs.Trigger>
                    <Tabs.Trigger className="ui-tabs-trigger" value="activity">{t('admin.auth.tabs.activity') || 'Activity'}</Tabs.Trigger>
                    <Tabs.Trigger className="ui-tabs-trigger" value="settings">{t('admin.auth.tabs.settings') || 'Settings'}</Tabs.Trigger>
                </Tabs.List>

                <div className="ui-tabs-content-container" style={{ marginTop: '2rem' }}>
                    <Tabs.Content value="overview">
                        <UserManagementOverviewPanel showToast={showToast} userRole={userRole} currentUser={user} />
                    </Tabs.Content>
                    
                    <Tabs.Content value="users">
                        <UserManagementUsersPanel showToast={showToast} userRole={userRole} currentUser={user} />
                    </Tabs.Content>

                    <Tabs.Content value="roles">
                        <UserManagementPermissionsPanel showToast={showToast} userRole={userRole} />
                    </Tabs.Content>

                    <Tabs.Content value="sessions">
                        <UserManagementSessionsPanel showToast={showToast} userRole={userRole} />
                    </Tabs.Content>

                    <Tabs.Content value="security">
                        <UserManagementSecurityPanel showToast={showToast} userRole={userRole} />
                    </Tabs.Content>

                    <Tabs.Content value="activity">
                        <UserManagementActivityPanel showToast={showToast} userRole={userRole} />
                    </Tabs.Content>

                    <Tabs.Content value="settings">
                        <UserManagementSettingsPanel showToast={showToast} userRole={userRole} />
                    </Tabs.Content>
                </div>
            </Tabs.Root>
        </div>
    );
};

export default UserManagementTab;
