import { MessageSquare } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';

export const messagesFeature = {
    id: 'messages',
    permissions: {
        actions: [ACTIONS.DELETE, ACTIONS.VIEW_HISTORY]
    },
    nav: {
        group: 'management',
        labelKey: 'admin.tabs.messages',
        icon: MessageSquare,
        badgeKey: 'unreadMessagesCount'
    }
};