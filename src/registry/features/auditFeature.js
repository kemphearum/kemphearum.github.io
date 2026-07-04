import { ScrollText } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';

export const auditFeature = {
    id: 'audit',
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
        labelKey: 'admin.tabs.audit',
        icon: ScrollText
    }
};