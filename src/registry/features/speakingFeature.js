import { Mic } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';
import SpeakingService from '../../services/SpeakingService';
import { getLocalizedField, getLanguageValue } from '../../utils/localization';

const bothLangs = (field) => `${getLanguageValue(field, 'en', '') || ''} ${getLanguageValue(field, 'km', '') || ''}`;

export const speakingFeature = {
    id: 'speaking',
    category: 'content',
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
        group: 'professional',
        labelKey: 'admin.tabs.speaking',
        icon: Mic
    },
    contentType: {
        statusCapable: true,
        load: () => import('../../pages/admin/speaking/SpeakingTab')
    },
    search: {
        service: SpeakingService,
        title: (item, lang) => getLocalizedField(item.title, lang),
        subtitle: (item, lang) => getLocalizedField(item.eventName, lang),
        text: (item) => `${bothLangs(item.title)} ${bothLangs(item.eventName)} ${bothLangs(item.location)} ${bothLangs(item.description)} ${item.date || ''}`
    }
};
