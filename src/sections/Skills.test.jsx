import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('framer-motion', () => ({
    motion: new Proxy({}, {
        // eslint-disable-next-line no-unused-vars
        get: () => ({ children, initial, animate, whileInView, viewport, transition, variants, ...props }) => React.createElement('div', props, children)
    })
}));
vi.mock('../hooks/useTranslation', () => ({
    useTranslation: () => ({ t: (key) => key, language: 'en' })
}));
vi.mock('../hooks/useFeatureFlag', () => ({ useFeatureFlag: vi.fn(() => true) }));
vi.mock('../services/SkillService', () => ({ default: { getAll: vi.fn() } }));

import Skills from './Skills';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import SkillService from '../services/SkillService';

const renderSkills = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        React.createElement(QueryClientProvider, { client }, React.createElement(Skills))
    );
};

describe('Skills section', () => {
    beforeEach(() => vi.clearAllMocks());

    it('groups visible skills by category', async () => {
        useFeatureFlag.mockReturnValue(true);
        SkillService.getAll.mockResolvedValue([
            { id: '1', name: { en: 'Risk Assessment' }, category: 'Governance', level: 'expert', status: 'published' },
            { id: '2', name: { en: 'SIEM' }, category: 'Security', level: 'advanced', status: 'published' },
            { id: '3', name: { en: 'Hidden' }, category: 'Security', level: 'beginner', status: 'draft' }
        ]);

        renderSkills();

        expect(await screen.findByText('Risk Assessment')).toBeTruthy();
        expect(screen.getByText('SIEM')).toBeTruthy();
        expect(screen.getByText('Governance')).toBeTruthy();
        // hidden skill excluded
        expect(screen.queryByText('Hidden')).toBeNull();
    });

    it('renders nothing when the feature flag is disabled', async () => {
        useFeatureFlag.mockReturnValue(false);
        SkillService.getAll.mockResolvedValue([{ id: '1', name: { en: 'X' }, category: 'A', status: 'published' }]);

        const { container } = renderSkills();
        // The flag gate returns null even after data resolves.
        await waitFor(() => expect(SkillService.getAll).toHaveBeenCalled());
        expect(container.querySelector('section')).toBeNull();
        expect(screen.queryByText('X')).toBeNull();
    });

    it('renders nothing when there are no visible skills', async () => {
        useFeatureFlag.mockReturnValue(true);
        SkillService.getAll.mockResolvedValue([{ id: '1', name: { en: 'X' }, status: 'draft' }]);

        const { container } = renderSkills();
        await waitFor(() => expect(SkillService.getAll).toHaveBeenCalled());
        await waitFor(() => expect(container.querySelector('section')).toBeNull());
    });
});
