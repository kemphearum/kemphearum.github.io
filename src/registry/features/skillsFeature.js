import { Sparkles } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';
import SkillService from '../../services/SkillService';
import { getLocalizedField, getLanguageValue } from '../../utils/localization';

const bothLangs = (field) => `${getLanguageValue(field, 'en', '') || ''} ${getLanguageValue(field, 'km', '') || ''}`;

export const skillsFeature = {
    id: 'skills',
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
        labelKey: 'admin.tabs.skills',
        icon: Sparkles
    },
    contentType: {
        subtitleKey: 'admin.subtitles.skills',
        statusCapable: false,
        load: () => import('../../pages/admin/skills/SkillsTab')
    },
    search: {
        service: SkillService,
        title: (item, lang) => getLocalizedField(item.name, lang),
        subtitle: (item) => item.category || '',
        text: (item) => `${bothLangs(item.name)} ${item.category || ''} ${item.slug || ''}`
    }
};