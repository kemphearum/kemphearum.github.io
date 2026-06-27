import { BarChart2 } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';

export const analyticsFeature = {
    id: 'analytics',
    permissions: {
        actions: []
    },
    nav: {
        group: 'system',
        labelKey: 'admin.tabs.analytics',
        icon: BarChart2
    }
};