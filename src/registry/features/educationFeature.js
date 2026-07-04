import { GraduationCap } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';
import EducationService from '../../services/EducationService';
import { getLocalizedField, getLanguageValue } from '../../utils/localization';

const bothLangs = (field) => `${getLanguageValue(field, 'en', '') || ''} ${getLanguageValue(field, 'km', '') || ''}`;

export const educationFeature = {
    id: 'education',
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
        labelKey: 'admin.tabs.education',
        icon: GraduationCap
    },
    contentType: {
        statusCapable: false,
        load: () => import('../../pages/admin/education/EducationTab')
    },
    search: {
        service: EducationService,
        title: (item, lang) => getLocalizedField(item.school, lang),
        subtitle: (item, lang) => getLocalizedField(item.degree, lang),
        text: (item) => `${bothLangs(item.school)} ${bothLangs(item.degree)} ${bothLangs(item.fieldOfStudy)} ${bothLangs(item.description)}`
    }
};
