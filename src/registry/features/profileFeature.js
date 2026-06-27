import { User as UserIcon } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';

export const profileFeature = {
    id: 'profile',
    permissions: {
        actions: [ACTIONS.EDIT]
    },
    nav: {
        isSpecial: true,
        labelKey: 'admin.tabs.profile',
        icon: UserIcon
    }
};