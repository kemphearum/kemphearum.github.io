import { Mic } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';
import SpeakingService from '../../services/SpeakingService';
import { getLocalizedField, getLanguageValue } from '../../utils/localization';

const bothLangs = (field) => `${getLanguageValue(field, 'en', '') || ''} ${getLanguageValue(field, 'km', '') || ''}`;

export const speakingFeature = {
    id: 'speaking',
    permissions: {
        actions: [ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE, ACTIONS.FEATURE, ACTIONS.TOGGLE_VISIBILITY, ACTIONS.VIEW_HISTORY]
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
