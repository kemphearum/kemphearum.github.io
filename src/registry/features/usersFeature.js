import { Users as UsersIcon } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';

export const usersFeature = {
    id: 'users',
    permissions: {
        actions: [ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE, ACTIONS.VIEW_HISTORY]
    },
    nav: {
        group: 'system',
        labelKey: 'admin.tabs.users',
        icon: UsersIcon
    }
};