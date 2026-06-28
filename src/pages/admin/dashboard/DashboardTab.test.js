import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-router', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../../../hooks/useActivity', () => ({
    useActivity: () => ({ trackRead: vi.fn(), currentDateKey: '2026-06-27' })
}));
vi.mock('../../../hooks/useTranslation', () => ({
    useTranslation: () => ({ t: (key) => key, language: 'en' })
}));
vi.mock('../../../services/BlogService', () => ({
    default: {
        fetchStats: vi.fn().mockResolvedValue({ total: 3, published: 2, drafts: 1 }),
        fetchPaginated: vi.fn().mockResolvedValue({ data: [{ id: 'p1', title: { en: 'Post 1' }, createdAt: { seconds: 1700000000 } }] })
    }
}));
vi.mock('../../../services/ProjectService', () => ({
    default: {
        fetchStats: vi.fn().mockResolvedValue({ total: 5, published: 4 }),
        fetchPaginated: vi.fn().mockResolvedValue({ data: [] })
    }
}));
vi.mock('../../../services/ExperienceService', () => ({
    default: { fetchStats: vi.fn().mockResolvedValue({ total: 2, currentRoles: 1 }) }
}));
vi.mock('../../../services/MessageService', () => ({
    default: {
        fetchStats: vi.fn().mockResolvedValue({ unread: 2 }),
        getUnreadCount: vi.fn().mockResolvedValue(2)
    }
}));
vi.mock('../../../services/UserService', () => ({
    default: { fetchStats: vi.fn().mockResolvedValue({ total: 4 }) }
}));
vi.mock('../../../services/EducationService', () => ({
    default: { fetchStats: vi.fn().mockResolvedValue({ total: 2 }) }
}));
vi.mock('../../../services/AuditLogService', () => ({
    default: { fetchActivityDetails: vi.fn().mockResolvedValue({ data: [] }) }
}));

import OverviewWidget from './widgets/OverviewWidget';
import QuickActionsWidget from './widgets/QuickActionsWidget';
import InsightsWidget from './widgets/InsightsWidget';
import LatestContentWidget from './widgets/LatestContentWidget';
import RecentActivityWidget from './widgets/RecentActivityWidget';

vi.mock('../../../registry/dashboardWidgetRegistry', () => ({
    listDashboardWidgets: () => [
        { id: 'overview', order: 10, canView: () => true, component: OverviewWidget },
        { id: 'quickActions', order: 20, canView: (ctx) => ctx.isActionAllowed('create', 'projects') || ctx.isActionAllowed('create', 'blog'), component: QuickActionsWidget },
        { id: 'insights', order: 30, canView: (ctx) => ctx.can('projects') || ctx.can('blog'), component: InsightsWidget },
        { id: 'latestContent', order: 40, canView: (ctx) => ctx.can('projects') || ctx.can('blog'), component: LatestContentWidget },
        { id: 'recentActivity', order: 50, canView: (ctx) => ctx.can('audit'), component: RecentActivityWidget }
    ]
}));

import DashboardTab from './DashboardTab';

const renderDashboard = (props = {}) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }) => React.createElement(QueryClientProvider, { client }, children);
    return render(
        React.createElement(DashboardTab, {
            userRole: 'superadmin',
            isActionAllowed: () => true,
            setActiveTab: vi.fn(),
            ...props
        }),
        { wrapper }
    );
};

describe('DashboardTab', () => {
    it('renders overview cards and quick actions for a permitted role', async () => {
        renderDashboard();

        expect(await screen.findByText('admin.dashboard.cards.projects', {}, { timeout: 4000 })).toBeTruthy();
        expect(await screen.findByText('admin.dashboard.cards.posts', {}, { timeout: 4000 })).toBeTruthy();
        expect(await screen.findByText('admin.dashboard.newProject', {}, { timeout: 4000 })).toBeTruthy();
        expect(await screen.findByText('admin.dashboard.recentActivity', {}, { timeout: 4000 })).toBeTruthy();
    }, 10000);

    it('hides modules the role cannot view', async () => {
        const isActionAllowed = (_action, module) => module === 'blog';
        renderDashboard({ userRole: 'editor', isActionAllowed });

        expect(await screen.findByText('admin.dashboard.cards.posts')).toBeTruthy();
        expect(screen.queryByText('admin.dashboard.cards.users')).toBeNull();
        // recent activity is superadmin-only
        expect(screen.queryByText('admin.dashboard.recentActivity')).toBeNull();
    });
});
