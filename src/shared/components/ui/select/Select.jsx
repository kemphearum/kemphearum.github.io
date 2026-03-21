import React from 'react';

const Select = React.forwardRef(({ 
    className = '', 
    size = 'md', 
    options = [],
    fullWidth = false,
    ...props 
}, ref) => {
    const baseClass = 'ui-input'; // Reuse input styles initially
    const sizeClass = size !== 'md' ? `${baseClass}--${size}` : '';
    const widthClass = fullWidth ? 'w-full' : '';
    
    return (
        <select
            ref={ref}
            className={`${baseClass} ${sizeClass} ${widthClass} ${className}`}
            {...props}
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
});

Select.displayName = 'Select';

export default Select;
