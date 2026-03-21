import React from 'react';

const Card = React.forwardRef(({ 
    className = '', 
    variant = 'default', 
    children, 
    ...props 
}, ref) => {
    const baseClass = 'ui-card';
    const variantClass = variant !== 'default' ? `${baseClass}--${variant}` : '';
    
    return (
        <div
            ref={ref}
            className={`${baseClass} ${variantClass} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
});

Card.displayName = 'Card';

export default Card;
