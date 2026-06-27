import { describe, it, expect } from 'vitest';
import { listDashboardWidgets } from './dashboardWidgetRegistry';

const ctx = (overrides = {}) => ({
    isActionAllowed: () => true,
    can: () => true,
    userRole: 'superadmin',
    ...overrides
});

describe('dashboardWidgetRegistry', () => {
    it('returns widgets sorted by order', () => {
        const orders = listDashboardWidgets().map((w) => w.order);
        expect(orders).toEqual([...orders].sort((a, b) => a - b));
    });

    it('every widget has a component and a canView gate', () => {
        listDashboardWidgets().forEach((widget) => {
            expect(typeof widget.component).toBe('function');
            expect(typeof widget.canView).toBe('function');
        });
    });

    it('gates recent activity to superadmins', () => {
        const activity = listDashboardWidgets().find((w) => w.id === 'recentActivity');
        expect(activity.canView(ctx({ userRole: 'superadmin' }))).toBe(true);
        expect(activity.canView(ctx({ userRole: 'editor' }))).toBe(false);
    });

    it('shows overview to everyone but hides quick actions without create rights', () => {
        const overview = listDashboardWidgets().find((w) => w.id === 'overview');
        const quick = listDashboardWidgets().find((w) => w.id === 'quickActions');
        expect(overview.canView(ctx())).toBe(true);
        expect(quick.canView(ctx({ isActionAllowed: () => false }))).toBe(false);
    });
});
