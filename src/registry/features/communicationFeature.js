import { Contact } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';
import CommunicationService from '../../services/CommunicationService';

export const communicationFeature = {
    id: 'communication',
    category: 'communication',
    visibility: true,
    permissions: {
        supportedActions: [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE, ACTIONS.PUBLISH, ACTIONS.ARCHIVE, ACTIONS.VIEW_HISTORY],
        defaultPermissions: {
            admin: [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE, ACTIONS.PUBLISH, ACTIONS.ARCHIVE, ACTIONS.VIEW_HISTORY],
            editor: [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE, ACTIONS.PUBLISH, ACTIONS.ARCHIVE, ACTIONS.VIEW_HISTORY],
            author: [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.VIEW_HISTORY],
            viewer: [ACTIONS.VIEW]
        }
    },
    nav: {
        group: 'communication',
        labelKey: 'admin.tabs.communication',
        icon: Contact
    },
    contentType: {
        statusCapable: false,
        load: () => import('../../pages/admin/communication/CommunicationTab')
    },
    search: {
        service: CommunicationService,
        title: () => 'Communication',
        subtitle: () => 'Manage global contact settings and resume',
        text: () => 'contact communication resume telegram email phone availability'
    }
};
