import React from 'react';
import styles from '../../Admin.module.scss';

/**
 * FormSelect — standard dropdown matching the User Account Profile style.
 * When wrapped (default), inherits all styling from .inputGroup select.
 * When noWrapper, applies .standardSelect for standalone use.
 */
const FormSelect = ({
    label,
    value,
    onChange,
    options = [],
    required = false,
    fullWidth = false,
    noWrapper = false,
    icon,
    style = {},
    containerStyle = {},
    hint
}) => {
    const selectElement = (
        <select
            value={value}
            onChange={onChange}
            className={noWrapper ? styles.standardSelect : undefined}
            required={required}
            style={{
                width: '100%',
                marginTop: (!noWrapper && label) ? '0.4rem' : '0',
                ...style
            }}
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );

    if (noWrapper) return selectElement;

    return (
        <div
            className={styles.inputGroup}
            style={{
                ...(fullWidth && window.innerWidth > 600 ? { gridColumn: 'span 2' } : {}),
                ...containerStyle
            }}
        >
            {label && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {icon && <span style={{ fontSize: '1.1rem' }}>{icon}</span>}
                    {label}
                </label>
            )}
            {selectElement}
            {hint && <span className={styles.hint}>{hint}</span>}
        </div>
    );
};

export default FormSelect;
