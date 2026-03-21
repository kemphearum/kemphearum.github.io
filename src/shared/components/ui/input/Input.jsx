import React from 'react';

const Input = React.forwardRef(({ 
    className = '', 
    size = 'md', 
    ...props 
}, ref) => {
    const baseClass = 'ui-input';
    const sizeClass = size !== 'md' ? `${baseClass}--${size}` : '';
    
    return (
        <input
            ref={ref}
            className={`${baseClass} ${sizeClass} ${className}`}
            {...props}
        />
    );
});

Input.displayName = 'Input';

export default Input;
