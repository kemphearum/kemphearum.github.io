import { Database as DatabaseIcon } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';

export const databaseFeature = {
    id: 'database',
    permissions: {
        actions: [ACTIONS.DATABASE_ACTIONS]
    },
    nav: {
        group: 'management',
        labelKey: 'admin.tabs.database',
        icon: DatabaseIcon
    }
};