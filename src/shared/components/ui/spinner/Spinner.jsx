import React from 'react';
import styles from './Spinner.module.scss';
import { clsx } from 'clsx'; // Check if clsx or similar is available; if not, use string template

const Spinner = React.forwardRef(({ 
    className = '', 
    size = 'md', 
    variant = 'primary',
    ...props 
}, ref) => {
    return (
        <svg
            ref={ref}
            viewBox="0 0 50 50"
            className={`${styles.spinner} ${styles[`spinner--${size}`]} ${styles[`spinner--${variant}`]} ${className}`}
            {...props}
        >
            <circle
                className={styles.path}
                cx="25"
                cy="25"
                r="20"
                fill="none"
                strokeWidth="5"
            />
        </svg>
    );
});

Spinner.displayName = 'Spinner';

export default Spinner;
