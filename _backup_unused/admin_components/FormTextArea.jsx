import React from 'react';

/**
 * FormTextArea component for multiline text input.
 */
const FormTextArea = ({
    label,
    icon: Icon,
    value,
    onChange,
    placeholder = '',
    rows = 5,
    fullWidth = true,
    required = false,
    style = {},
    ...props
}) => {
    const textareaStyle = {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontSize: '0.9rem',
        lineHeight: '1.7',
        padding: '1.25rem',
        backgroundColor: 'rgba(0,0,0,0.15)',
        border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
        borderRadius: '12px',
        color: 'var(--text-primary)',
        width: '100%',
        resize: 'vertical',
        ...style
    };

    return (
        <div className="ui-formGroup" style={fullWidth ? { gridColumn: 'span 2' } : {}}>
            {label && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                    {Icon && <Icon size={16} />}
                    <label style={{ margin: 0 }}>{label}</label>
                </div>
            )}
            <textarea
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                rows={rows}
                required={required}
                style={textareaStyle}
                {...props}
            />
        </div>
    );
};

export default FormTextArea;
