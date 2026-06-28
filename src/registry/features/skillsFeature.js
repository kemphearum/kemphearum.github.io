import { Sparkles } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';
import SkillService from '../../services/SkillService';
import { getLocalizedField, getLanguageValue } from '../../utils/localization';

const bothLangs = (field) => `${getLanguageValue(field, 'en', '') || ''} ${getLanguageValue(field, 'km', '') || ''}`;

export const skillsFeature = {
    id: 'skills',
    permissions: {
        actions: [ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE, ACTIONS.FEATURE, ACTIONS.TOGGLE_VISIBILITY, ACTIONS.VIEW_HISTORY]
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