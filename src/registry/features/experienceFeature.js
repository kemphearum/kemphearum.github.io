import { BriefcaseBusiness } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';
import ExperienceService from '../../services/ExperienceService';
import { getLocalizedField, getLanguageValue } from '../../utils/localization';

const bothLangs = (field) => `${getLanguageValue(field, 'en', '') || ''} ${getLanguageValue(field, 'km', '') || ''}`;

export const experienceFeature = {
    id: 'experience',
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
        group: 'career',
        labelKey: 'admin.tabs.experience',
        icon: BriefcaseBusiness
    },
    contentType: {
        statusCapable: false,
        load: () => import('../../pages/admin/experience/ExperienceTab')
    },
    search: {
        service: ExperienceService,
        title: (item, lang) => getLocalizedField(item.role, lang),
        subtitle: (item, lang) => getLocalizedField(item.company, lang),
        text: (item) => `${bothLangs(item.role)} ${bothLangs(item.company)} ${bothLangs(item.description)}`
    }
};