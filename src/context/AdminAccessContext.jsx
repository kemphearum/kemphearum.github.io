/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext } from 'react';

const AdminAccessContext = createContext({
    isActionAllowed: () => false,
    userRole: null
});

export const AdminAccessProvider = ({ children, isActionAllowed, userRole }) => (
    <AdminAccessContext.Provider value={{ isActionAllowed, userRole }}>
        {children}
    </AdminAccessContext.Provider>
);

export const useAdminAccessContext = () => useContext(AdminAccessContext);
