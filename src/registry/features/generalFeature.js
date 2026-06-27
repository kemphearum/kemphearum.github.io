import { Home } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';

export const generalFeature = {
    id: 'general',
    permissions: {
        actions: [ACTIONS.EDIT, ACTIONS.VIEW_HISTORY]
    },
    nav: {
        group: 'main',
        labelKey: 'admin.tabs.general',
        icon: Home
    }
};