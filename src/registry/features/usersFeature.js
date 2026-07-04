import { Users as UsersIcon } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';

export const usersFeature = {
    id: 'users',
    category: 'system',
    visibility: true,
    permissions: {
        supportedActions: [ACTIONS.VIEW, ACTIONS.CONFIGURE, ACTIONS.MANAGE, ACTIONS.EXPORT, ACTIONS.VIEW_AUDIT_LOGS],
        defaultPermissions: {
            admin: [ACTIONS.VIEW, ACTIONS.CONFIGURE, ACTIONS.MANAGE, ACTIONS.EXPORT, ACTIONS.VIEW_AUDIT_LOGS],
            editor: [],
            author: [],
            viewer: []
        }
    },
    nav: {
        group: 'administration',
        labelKey: 'admin.tabs.auth',
        icon: UsersIcon
    }
};