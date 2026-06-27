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
    default: { getUnreadCount: vi.fn().mockResolvedValue(7) }
}));
vi.mock('../../../services/UserService', () => ({
    default: { fetchStats: vi.fn().mockResolvedValue({ total: 4 }) }
}));
vi.mock('../../../services/AuditLogService', () => ({
    default: { fetchActivityDetails: vi.fn().mockResolvedValue({ data: [] }) }
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

        expect(await screen.findByText('admin.dashboard.cards.projects')).toBeTruthy();
        expect(screen.getByText('admin.dashboard.cards.posts')).toBeTruthy();
        expect(screen.getByText('admin.dashboard.newProject')).toBeTruthy();
        expect(screen.getByText('admin.dashboard.recentActivity')).toBeTruthy();
    });

    it('hides modules the role cannot view', async () => {
        const isActionAllowed = (_action, module) => module === 'blog';
        renderDashboard({ userRole: 'editor', isActionAllowed });

        expect(await screen.findByText('admin.dashboard.cards.posts')).toBeTruthy();
        expect(screen.queryByText('admin.dashboard.cards.users')).toBeNull();
        // recent activity is superadmin-only
        expect(screen.queryByText('admin.dashboard.recentActivity')).toBeNull();
    });
});
