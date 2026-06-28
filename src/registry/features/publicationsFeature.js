import { BookOpen } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';
import PublicationService from '../../services/PublicationService';
import { getLocalizedField, getLanguageValue } from '../../utils/localization';

const bothLangs = (field) => `${getLanguageValue(field, 'en', '') || ''} ${getLanguageValue(field, 'km', '') || ''}`;

export const publicationsFeature = {
    id: 'publications',
    permissions: {
        actions: [ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE, ACTIONS.FEATURE, ACTIONS.TOGGLE_VISIBILITY, ACTIONS.VIEW_HISTORY]
    },
    nav: {
        group: 'professional',
        labelKey: 'admin.tabs.publications',
        icon: BookOpen
    },
    contentType: {
        statusCapable: true,
        load: () => import('../../pages/admin/publications/PublicationTab')
    },
    search: {
        service: PublicationService,
        title: (item, lang) => getLocalizedField(item.title, lang),
        subtitle: (item, lang) => getLocalizedField(item.publisher, lang),
        text: (item) => `${bothLangs(item.title)} ${bothLangs(item.publisher)} ${bothLangs(item.description)} ${item.publishDate || ''}`
    }
};
