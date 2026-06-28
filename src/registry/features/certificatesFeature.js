import { Award } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';
import CertificateService from '../../services/CertificateService';
import { getLocalizedField, getLanguageValue } from '../../utils/localization';

const bothLangs = (field) => `${getLanguageValue(field, 'en', '') || ''} ${getLanguageValue(field, 'km', '') || ''}`;

export const certificatesFeature = {
    id: 'certificates',
    permissions: {
        actions: [ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE, ACTIONS.FEATURE, ACTIONS.TOGGLE_VISIBILITY, ACTIONS.VIEW_HISTORY]
    },
    nav: {
        group: 'career',
        labelKey: 'admin.tabs.certificates',
        icon: Award
    },
    contentType: {
        subtitleKey: 'admin.subtitles.certificates',
        statusCapable: false,
        load: () => import('../../pages/admin/certificates/CertificatesTab')
    },
    search: {
        service: CertificateService,
        title: (item, lang) => getLocalizedField(item.name, lang),
        subtitle: (item) => item.organization || '',
        text: (item) => `${bothLangs(item.name)} ${item.organization || ''} ${item.credentialId || ''} ${item.slug || ''}`
    }
};