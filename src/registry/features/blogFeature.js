import { FileText } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';
import BlogService from '../../services/BlogService';
import { getLocalizedField, getLanguageValue } from '../../utils/localization';

const bothLangs = (field) => `${getLanguageValue(field, 'en', '') || ''} ${getLanguageValue(field, 'km', '') || ''}`;
const joinArray = (value) => (Array.isArray(value) ? value.join(' ') : (value || ''));

export const blogFeature = {
    id: 'blog',
    permissions: {
        actions: [ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE, ACTIONS.FEATURE, ACTIONS.TOGGLE_VISIBILITY, ACTIONS.VIEW_HISTORY]
    },
    nav: {
        group: 'site_content',
        labelKey: 'admin.tabs.blog',
        icon: FileText
    },
    contentType: {
        statusCapable: true,
        load: () => import('../../pages/admin/blog/BlogTab')
    },
    search: {
        service: BlogService,
        title: (item, lang) => getLocalizedField(item.title, lang),
        subtitle: (item) => item.slug || '',
        text: (item) => `${bothLangs(item.title)} ${bothLangs(item.excerpt)} ${joinArray(item.tags)} ${item.slug || ''}`
    }
};