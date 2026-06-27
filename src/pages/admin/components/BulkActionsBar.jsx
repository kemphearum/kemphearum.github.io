import React from 'react';
import { Button } from '@/shared/components/ui';

/**
 * Shared selection toolbar for content tables.
 * Renders nothing when no rows are selected. Actions are declarative:
 * { icon, label, title, onClick, disabled, variant } or { divider: true }.
 */
const BulkActionsBar = ({ count = 0, label, actions = [] }) => {
    if (!count) return null;

    return (
        <div className="ui-bulk-actions-bar">
            <div className="ui-bulk-actions-summary">
                <div className="ui-bulk-actions-count">{count}</div>
                <span className="ui-bulk-actions-text">{label}</span>
            </div>

            <div className="ui-bulk-actions-controls">
                {actions.map((action, index) => {
                    if (action.divider) {
                        return <div key={`divider-${index}`} className="ui-bulk-divider" />;
                    }

                    const Icon = action.icon;
                    return (
                        <Button
                            key={action.key || action.label || index}
                            variant={action.variant || 'ghost'}
                            size="sm"
                            onClick={action.onClick}
                            title={action.title}
                            disabled={action.disabled}
                        >
                            {Icon && <Icon size={16} style={{ marginRight: '0.4rem' }} />} {action.label}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
};

export default BulkActionsBar;
