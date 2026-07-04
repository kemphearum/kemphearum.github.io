import { Trophy } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';
import AwardService from '../../services/AwardService';
import { getLocalizedField, getLanguageValue } from '../../utils/localization';

const bothLangs = (field) => `${getLanguageValue(field, 'en', '') || ''} ${getLanguageValue(field, 'km', '') || ''}`;

export const awardsFeature = {
    id: 'awards',
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
        labelKey: 'admin.tabs.awards',
        icon: Trophy
    },
    contentType: {
        statusCapable: true,
        load: () => import('../../pages/admin/awards/AwardTab')
    },
    search: {
        service: AwardService,
        title: (item, lang) => getLocalizedField(item.title, lang),
        subtitle: (item, lang) => getLocalizedField(item.organization, lang),
        text: (item) => `${bothLangs(item.title)} ${bothLangs(item.organization)} ${bothLangs(item.description)} ${item.issueDate || ''}`
    }
};
