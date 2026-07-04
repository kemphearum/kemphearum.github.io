import { LayoutTemplate } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';
import ProjectService from '../../services/ProjectService';
import { getLocalizedField, getLanguageValue } from '../../utils/localization';

const bothLangs = (field) => `${getLanguageValue(field, 'en', '') || ''} ${getLanguageValue(field, 'km', '') || ''}`;
const joinArray = (value) => (Array.isArray(value) ? value.join(' ') : (value || ''));

export const projectsFeature = {
    id: 'projects',
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
        group: 'site_content',
        labelKey: 'admin.tabs.projects',
        icon: LayoutTemplate
    },
    contentType: {
        statusCapable: true,
        load: () => import('../../pages/admin/projects/ProjectsTab')
    },
    search: {
        service: ProjectService,
        title: (item, lang) => getLocalizedField(item.title, lang),
        subtitle: (item) => item.slug || '',
        text: (item) => `${bothLangs(item.title)} ${bothLangs(item.description)} ${joinArray(item.techStack)} ${item.slug || ''}`
    }
};