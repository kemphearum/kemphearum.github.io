import React from 'react';
import Spinner from '../spinner/Spinner';

const Button = React.forwardRef(({ 
    className = '', 
    variant = 'primary', 
    size = 'md', 
    children, 
    isLoading = false,
    disabled = false,
    icon: Icon,
    ...props 
}, ref) => {
    const baseClass = 'ui-button';
    const variantClass = `${baseClass}--${variant}`;
    const sizeClass = `${baseClass}--${size}`;
    
    return (
        <button
            ref={ref}
            className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <Spinner size="sm" variant="inherit" />
            ) : (
                Icon && <Icon size={size === 'sm' ? 14 : 18} />
            )}
            {children}
        </button>
    );
});

Button.displayName = 'Button';

export default Button;
