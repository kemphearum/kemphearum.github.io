import React from 'react';
import { useAdminAccessContext } from '../../../context/AdminAccessContext';

/**
 * A declarative component that conditionally renders its children
 * if the current user has the required permission.
 * 
 * @param {string} action - The action to check (e.g., 'edit', 'delete')
 * @param {string} resource - The module or resource (e.g., 'blog', 'projects')
 * @param {React.ReactNode} fallback - Rendered if the user lacks permission
 */
const RequirePermission = ({ action, resource, fallback = null, children }) => {
    const { isActionAllowed } = useAdminAccessContext();
    
    if (isActionAllowed(action, resource)) {
        return <>{children}</>;
    }
    
    return fallback ? <>{fallback}</> : null;
};

export default RequirePermission;
