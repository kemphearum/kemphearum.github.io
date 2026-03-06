import React from 'react';
import styles from '../../Admin.module.scss';

/**
 * FormRow component for creating grid-based layouts within forms.
 * Supports dynamic column counts (defaults to 2 for the 'formGrid' style).
 */
const FormRow = ({ children, columns = 2, className = '' }) => {
    const gridStyle = columns === 1 ? { display: 'flex', flexDirection: 'column', gap: '1.5rem' } : {};

    return (
        <div
            className={`${columns === 2 ? styles.formGrid : ''} ${className}`}
            style={gridStyle}
        >
            {children}
        </div>
    );
};

export default FormRow;
