import { ScrollText } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';

export const auditFeature = {
    id: 'audit',
    permissions: {
        actions: []
    },
    nav: {
        group: 'system',
        labelKey: 'admin.tabs.audit',
        icon: ScrollText
    }
};