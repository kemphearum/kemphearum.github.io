import React from 'react';
import styles from '../../Admin.module.scss';

/**
 * FormInput component for standard input fields.
 */
const FormInput = ({
    label,
    hint,
    type = 'text',
    value,
    onChange,
    required = false,
    placeholder = '',
    fullWidth = false,
    disabled = false,
    onClick,
    ...props
}) => {
    return (
        <div className={styles.inputGroup} style={fullWidth ? { gridColumn: 'span 2' } : {}}>
            {label && (
                <label>
                    {label}
                    {hint && <span className={styles.hint}> ({hint})</span>}
                </label>
            )}
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={required}
                disabled={disabled}
                onClick={onClick}
                {...props}
            />
        </div>
    );
};

export default FormInput;
