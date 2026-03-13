import React from 'react';
import { motion } from 'framer-motion';
import { Home, RefreshCcw, AlertCircle, Wrench } from 'lucide-react';
import styles from './MaintenancePage.module.scss';

const MaintenancePage = ({ error, resetErrorBoundary, title, message }) => {
    const handleHomeClick = () => {
        window.location.href = '/';
    };

    const handleRefresh = () => {
        if (resetErrorBoundary) {
            resetErrorBoundary();
        } else {
            window.location.reload();
        }
    };

    return (
        <div className={styles.maintenanceWrapper}>
            <motion.div 
                className={styles.content}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                <div className={styles.iconWrapper}>
                    <motion.div
                        animate={{ 
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.1, 1.1, 1]
                        }}
                        transition={{ 
                            duration: 4, 
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        {error ? <AlertCircle size={40} /> : <Wrench size={40} />}
                    </motion.div>
                </div>

                <h1 className={styles.title}>{title || (error ? "Temporary Hiccup" : "Under Maintenance")}</h1>
                <p className={styles.message}>
                    {message || (error 
                        ? "We encountered an unexpected error while preparing this page. Don't worry, it's usually temporary."
                        : "We're currently fine-tuning some details to bring you the best experience. Please check back in a moment!")}
                </p>

                <div className={styles.actions}>
                    <button onClick={handleHomeClick} className={styles.primaryBtn}>
                        <Home size={18} /> Back to Home
                    </button>
                    <button onClick={handleRefresh} className={styles.secondaryBtn}>
                        <RefreshCcw size={18} /> Try Again
                    </button>
                </div>

                {error && (
                    <details className={styles.errorDetail}>
                        <summary>Technical Details</summary>
                        <pre>
                            {error.statusText || error.message || "Unknown error"}
                        </pre>
                    </details>
                )}
            </motion.div>
            
            {/* Background elements for extra Wow */}
            <div className={styles.bgGlow} />
        </div>
    );
};

export default MaintenancePage;
