import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

import Toast from './Toast';

describe('Toast component', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it('renders the message correctly', () => {
        render(<Toast message="Test message" type="success" onClose={() => { }} />);
        expect(screen.getByText('Test message')).toBeDefined();
    });

    it('calls onClose when close button is clicked', () => {
        const mockOnClose = vi.fn();
        render(<Toast message="Test message" type="success" onClose={mockOnClose} />);

        const closeBtn = screen.getByLabelText('Close notification');
        closeBtn.click();

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('auto-closes after 4 seconds', () => {
        const mockOnClose = vi.fn();
        render(<Toast message="Test message" type="success" onClose={mockOnClose} />);

        // Fast-forward time by 4 seconds
        vi.advanceTimersByTime(4000);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
});
