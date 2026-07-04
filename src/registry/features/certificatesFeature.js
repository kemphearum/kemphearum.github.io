import { Award } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';
import CertificateService from '../../services/CertificateService';
import { getLocalizedField, getLanguageValue } from '../../utils/localization';

const bothLangs = (field) => `${getLanguageValue(field, 'en', '') || ''} ${getLanguageValue(field, 'km', '') || ''}`;

export const certificatesFeature = {
    id: 'certificates',
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