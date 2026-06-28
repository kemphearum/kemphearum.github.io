import { Home } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';

export const generalFeature = {
    id: 'general',
    permissions: {
        actions: [ACTIONS.EDIT, ACTIONS.VIEW_HISTORY]
    },
    nav: {
        group: 'site_content',
        labelKey: 'admin.tabs.general',
        icon: Home
    }
};