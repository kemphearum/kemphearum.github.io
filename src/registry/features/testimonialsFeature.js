import { MessageSquareQuote } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';
import TestimonialService from '../../services/TestimonialService';
import { getLocalizedField, getLanguageValue } from '../../utils/localization';

const bothLangs = (field) => `${getLanguageValue(field, 'en', '') || ''} ${getLanguageValue(field, 'km', '') || ''}`;

export const testimonialsFeature = {
    id: 'testimonials',
    permissions: {
        actions: [ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE, ACTIONS.FEATURE, ACTIONS.TOGGLE_VISIBILITY, ACTIONS.VIEW_HISTORY]
    },
    nav: {
        group: 'main',
        labelKey: 'admin.tabs.testimonials',
        icon: MessageSquareQuote
    },
    contentType: {
        statusCapable: true,
        load: () => import('../../pages/admin/testimonials/TestimonialTab')
    },
    search: {
        service: TestimonialService,
        title: (item) => item.authorName || '',
        subtitle: (item, lang) => getLocalizedField(item.authorRole, lang),
        text: (item) => `${item.authorName || ''} ${item.authorCompany || ''} ${bothLangs(item.authorRole)} ${bothLangs(item.content)}`
    }
};
