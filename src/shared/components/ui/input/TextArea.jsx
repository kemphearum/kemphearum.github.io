import React from 'react';

const TextArea = React.forwardRef(({ 
    className = '', 
    size = 'md', 
    ...props 
}, ref) => {
    const baseClass = 'ui-input'; // Reuse input styles
    const sizeClass = size !== 'md' ? `${baseClass}--${size}` : '';
    
    return (
        <textarea
            ref={ref}
            className={`${baseClass} ${sizeClass} ${className}`}
            {...props}
        />
    );
});

TextArea.displayName = 'TextArea';

export default TextArea;
