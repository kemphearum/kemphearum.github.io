import { useCallback, useState } from 'react';
import { ACTIONS, isActionAllowed } from '../../../utils/permissions';
import { useActivity } from '../../../hooks/useActivity';
import MessageService from '../../../services/MessageService';
import UserService from '../../../services/UserService';
import { isTabAllowedForRole } from '../adminUtils';

export const useAdminAccess = (userRole) => {
    const { trackRead } = useActivity();
    const [rolePermissions, setRolePermissions] = useState({});
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

    const fetchRolePermissions = useCallback(async () => {
        try {
            const perms = await UserService.fetchRolePermissions(trackRead);
            setRolePermissions(perms);
        } catch (error) {
            console.error("Error fetching role permissions:", error);
        }
    }, [trackRead]);

    const fetchMessages = useCallback(async () => {
        try {
            const count = await MessageService.getUnreadCount();
            trackRead(1, 'Fetched inbox unread count');
            setUnreadMessagesCount(Math.max(0, Number(count) || 0));
        } catch (error) {
            console.error("Error fetching message count:", error);
        }
    }, [trackRead]);

    const checkActionAllowed = useCallback((action, moduleName) => (
        isActionAllowed(action, moduleName, userRole, rolePermissions)
    ), [userRole, rolePermissions]);

    const isTabAllowed = useCallback((tab, role = userRole, permissions = rolePermissions) => (
        isTabAllowedForRole(tab, role, permissions)
    ), [rolePermissions, userRole]);

    return {
        rolePermissions,
        unreadMessagesCount,
        fetchRolePermissions,
        fetchMessages,
        checkActionAllowed,
        isTabAllowed,
    };
};

export default useAdminAccess;

