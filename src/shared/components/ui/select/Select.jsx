import React from 'react';
import { ChevronDown } from 'lucide-react';

const Select = React.forwardRef(({ 
    className = '', 
    size = 'md', 
    options = [],
    fullWidth = false,
    noWrapper = false,
    ...props 
}, ref) => {
    const baseClass = 'ui-input ui-select';
    const sizeClass = size !== 'md' ? `ui-input--${size}` : '';
    const widthClass = fullWidth ? 'w-full' : '';
    
    const selectElement = (
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

    if (noWrapper) return selectElement;

    return (
        <div className={`ui-select-wrapper ${widthClass} ${sizeClass}`}>
            {selectElement}
            <div className="ui-select-icon">
                <ChevronDown size={16} />
            </div>
        </div>
    );
});

Select.displayName = 'Select';

export default Select;
