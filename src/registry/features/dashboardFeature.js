import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';

const CONTENT_MODULES = ['projects', 'blog', 'experience', 'skills', 'certificates'];

export const dashboardFeature = {
    id: 'dashboard',
    category: 'analytics',
    visibility: true,
    permissions: {
        supportedActions: [ACTIONS.VIEW, ACTIONS.CONFIGURE, ACTIONS.MANAGE, ACTIONS.EXPORT, ACTIONS.VIEW_AUDIT_LOGS],
        defaultPermissions: {
            admin: [ACTIONS.VIEW, ACTIONS.CONFIGURE, ACTIONS.MANAGE, ACTIONS.EXPORT, ACTIONS.VIEW_AUDIT_LOGS],
            editor: [],
            author: [],
            viewer: []
        }
    },
    nav: {
        
        labelKey: 'admin.tabs.dashboard',
        icon: LayoutDashboard,
        order: 0
    },
    dashboardWidgets: [
        { id: 'overview', order: 10, canView: () => true, component: React.lazy(() => import('../../pages/admin/dashboard/widgets/OverviewWidget')) },
        {
            id: 'quickActions',
            order: 20,
            canView: (ctx) => ctx.isActionAllowed(ACTIONS.CREATE, 'projects') || ctx.isActionAllowed(ACTIONS.CREATE, 'blog'),
            component: React.lazy(() => import('../../pages/admin/dashboard/widgets/QuickActionsWidget'))
        },
        {
            id: 'insights',
            order: 30,
            canView: (ctx) => CONTENT_MODULES.some((module) => ctx.can(module)),
            component: React.lazy(() => import('../../pages/admin/dashboard/widgets/InsightsWidget'))
        },
        {
            id: 'latestContent',
            order: 40,
            canView: (ctx) => ctx.can('blog') || ctx.can('projects'),
            component: React.lazy(() => import('../../pages/admin/dashboard/widgets/LatestContentWidget'))
        },
        {
            id: 'recentActivity',
            order: 50,
            canView: (ctx) => ctx.can('audit'),
            component: React.lazy(() => import('../../pages/admin/dashboard/widgets/RecentActivityWidget'))
        }
    ]
};