import { BookOpen } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';
import PublicationService from '../../services/PublicationService';
import { getLocalizedField, getLanguageValue } from '../../utils/localization';

const bothLangs = (field) => `${getLanguageValue(field, 'en', '') || ''} ${getLanguageValue(field, 'km', '') || ''}`;

export const publicationsFeature = {
    id: 'publications',
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
