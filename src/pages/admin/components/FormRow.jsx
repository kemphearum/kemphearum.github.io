import React from 'react';

/**
 * FormRow component for creating grid-based layouts within forms.
 * Supports dynamic column counts (defaults to 2 for the 'formGrid' style).
 */
const FormRow = ({ children, label, hint, columns = 2, className = '' }) => {
    const gridStyle = columns === 1 ? { display: 'flex', flexDirection: 'column', gap: '1.5rem' } : {};

    return (
        <div
            className={`${columns === 2 ? 'ui-formGrid' : ''} ${className}`}
            style={gridStyle}
        >
            {label && (
                <div style={{ marginBottom: '0.4rem', gridColumn: '1 / -1' }}>
                    <label style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '600', 
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        {label}
                        {hint && <span style={{ marginLeft: '0.5rem', opacity: 0.6, fontSize: '0.7rem', fontWeight: '400', textTransform: 'none' }}>{hint}</span>}
                    </label>
                </div>
            )}
            {children}
        </div>
    );
};

export default FormRow;
