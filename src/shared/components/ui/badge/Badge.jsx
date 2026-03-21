import React from 'react';

const Badge = React.forwardRef(({ 
    className = '', 
    variant = 'default', 
    children, 
    ...props 
}, ref) => {
    const baseClass = 'ui-badge';
    const variantClass = `${baseClass}--${variant}`;
    
    return (
        <span
            ref={ref}
            className={`${baseClass} ${variantClass} ${className}`}
            {...props}
        >
            {children}
        </span>
    );
});

Badge.displayName = 'Badge';

export default Badge;
