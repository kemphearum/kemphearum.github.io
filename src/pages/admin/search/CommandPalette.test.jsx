import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CommandPalette from './CommandPalette';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock all external dependencies
vi.mock('../../../hooks/useTranslation', () => ({
    useTranslation: () => ({ t: (key) => key, language: 'en' })
}));

vi.mock('../../../hooks/useCommandPalette', () => ({
    readRecent: vi.fn(() => []),
    pushRecent: vi.fn((item) => [item])
}));

vi.mock('../../../registry/searchRegistry', () => ({
    getSearchProviders: vi.fn(() => [])
}));

vi.mock('../../../registry/navRegistry', () => ({
    getNavItem: vi.fn((key) => ({ key, labelKey: `nav.${key}`, icon: () => <svg /> })),
    getNavigableKeys: vi.fn(() => ['dashboard', 'settings'])
}));

vi.mock('../../../registry/contentTypeRegistry', () => ({
    getContentType: vi.fn()
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
});

describe('CommandPalette', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = (props = {}) => {
        const defaultProps = {
            open: true,
            onClose: vi.fn(),
            onNavigate: vi.fn(),
            isActionAllowed: vi.fn(() => true),
            canViewTab: vi.fn(() => true)
        };
        return render(
            <QueryClientProvider client={queryClient}>
                <CommandPalette {...defaultProps} {...props} />
            </QueryClientProvider>
        );
    };

    it('renders nothing when not open', () => {
        const { container } = renderComponent({ open: false });
        expect(container.firstChild).toBeNull();
    });

    it('renders search input when open', () => {
        renderComponent();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('admin.palette.placeholder')).toBeInTheDocument();
    });

    it('closes on overlay click', () => {
        const onClose = vi.fn();
        renderComponent({ onClose });
        
        fireEvent.mouseDown(screen.getByRole('presentation'));
        expect(onClose).toHaveBeenCalled();
    });

    it('does not close when clicking inside the palette', () => {
        const onClose = vi.fn();
        renderComponent({ onClose });
        
        fireEvent.mouseDown(screen.getByRole('dialog'));
        expect(onClose).not.toHaveBeenCalled();
    });

    it('closes on Escape key', () => {
        const onClose = vi.fn();
        renderComponent({ onClose });
        
        const input = screen.getByPlaceholderText('admin.palette.placeholder');
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(onClose).toHaveBeenCalled();
    });

    it('displays navigation commands when query is empty', () => {
        renderComponent();
        expect(screen.getByText('admin.palette.groups.navigation')).toBeInTheDocument();
        expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
        expect(screen.getByText('nav.settings')).toBeInTheDocument();
    });

    it('handles keyboard navigation (ArrowDown, ArrowUp, Enter)', () => {
        const onNavigate = vi.fn();
        renderComponent({ onNavigate });
        
        const input = screen.getByPlaceholderText('admin.palette.placeholder');
        
        // ArrowDown once
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        
        // Enter to select
        fireEvent.keyDown(input, { key: 'Enter' });
        
        // It should navigate to settings since it's the second item (index 1)
        expect(onNavigate).toHaveBeenCalledWith('settings');
    });
});
