import { Contact } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';
import CommunicationService from '../../services/CommunicationService';

export const communicationFeature = {
    id: 'communication',
    permissions: {
        actions: [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE, ACTIONS.PUBLISH]
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
