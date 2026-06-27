import { BriefcaseBusiness } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';
import ExperienceService from '../../services/ExperienceService';
import { getLocalizedField, getLanguageValue } from '../../utils/localization';

const bothLangs = (field) => `${getLanguageValue(field, 'en', '') || ''} ${getLanguageValue(field, 'km', '') || ''}`;

export const experienceFeature = {
    id: 'experience',
    permissions: {
        actions: [ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE, ACTIONS.FEATURE, ACTIONS.TOGGLE_VISIBILITY, ACTIONS.VIEW_HISTORY]
    },
    nav: {
        group: 'main',
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