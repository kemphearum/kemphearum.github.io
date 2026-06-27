import OverviewWidget from '../pages/admin/dashboard/widgets/OverviewWidget';
import QuickActionsWidget from '../pages/admin/dashboard/widgets/QuickActionsWidget';
import InsightsWidget from '../pages/admin/dashboard/widgets/InsightsWidget';
import LatestContentWidget from '../pages/admin/dashboard/widgets/LatestContentWidget';
import RecentActivityWidget from '../pages/admin/dashboard/widgets/RecentActivityWidget';
import { ACTIONS, MODULES, isSuperAdminRole } from '../utils/permissions';

const CONTENT_MODULES = [MODULES.PROJECTS, MODULES.BLOG, MODULES.EXPERIENCE, MODULES.SKILLS, MODULES.CERTIFICATES];

/**
 * Dashboard widgets, registry-driven. Each widget is self-contained (its own
 * queries + rendering), gated by `canView(ctx)`, and ordered by `order` so the
 * dashboard layout is composed by registration rather than hardcoded — and is
 * ready for future drag-and-drop ordering. `ctx` provides permission helpers,
 * navigation, i18n, and activity context.
 */
export const DASHBOARD_WIDGETS = [
    { id: 'overview', order: 10, canView: () => true, component: OverviewWidget },
    {
        id: 'quickActions',
        order: 20,
        canView: (ctx) => ctx.isActionAllowed(ACTIONS.CREATE, MODULES.PROJECTS) || ctx.isActionAllowed(ACTIONS.CREATE, MODULES.BLOG),
        component: QuickActionsWidget
    },
    {
        id: 'insights',
        order: 30,
        canView: (ctx) => CONTENT_MODULES.some((module) => ctx.can(module)),
        component: InsightsWidget
    },
    {
        id: 'latestContent',
        order: 40,
        canView: (ctx) => ctx.can(MODULES.BLOG) || ctx.can(MODULES.PROJECTS),
        component: LatestContentWidget
    },
    {
        id: 'recentActivity',
        order: 50,
        canView: (ctx) => isSuperAdminRole(ctx.userRole),
        component: RecentActivityWidget
    }
];

export const listDashboardWidgets = () => [...DASHBOARD_WIDGETS].sort((a, b) => a.order - b.order);
