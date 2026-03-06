import React from 'react';
import styles from '../../Admin.module.scss';

/**
 * FormSelect component for styled dropdown selections.
 */
const FormSelect = ({
    label,
    value,
    onChange,
    options = [],
    required = false,
    fullWidth = false,
    className = styles.standardSelect,
    style = {}
}) => {
    return (
        <div className={styles.inputGroup} style={fullWidth ? { gridColumn: 'span 2' } : {}}>
            {label && <label>{label}</label>}
            <select
                value={value}
                onChange={onChange}
                className={className}
                required={required}
                style={{ width: '100%', marginTop: '0.4rem', ...style }}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default FormSelect;
