import { ACTIONS } from '../../utils/permissionConstants';

export const resumeFeature = {
    id: 'resume',
    category: 'content',
    visibility: true,
    permissions: {
        supportedActions: [ACTIONS.VIEW, ACTIONS.EDIT, ACTIONS.VIEW_HISTORY],
        defaultPermissions: {
            admin: [ACTIONS.VIEW, ACTIONS.EDIT, ACTIONS.VIEW_HISTORY],
            editor: [ACTIONS.VIEW, ACTIONS.EDIT, ACTIONS.VIEW_HISTORY],
            author: [ACTIONS.VIEW, ACTIONS.EDIT, ACTIONS.VIEW_HISTORY],
            viewer: [ACTIONS.VIEW]
        }
    },
    nav: {
        labelKey: 'admin.tabs.resume',
        order: 100
    }
};