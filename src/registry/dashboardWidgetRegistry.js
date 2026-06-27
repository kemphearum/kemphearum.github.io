import { listFeatures } from './featureRegistry';

/**
 * Dashboard widgets, registry-driven from the feature registry.
 */
export const DASHBOARD_WIDGETS = listFeatures()
    .flatMap((feature) => feature.dashboardWidgets || []);

export const listDashboardWidgets = () => [...DASHBOARD_WIDGETS].sort((a, b) => a.order - b.order);
