import React from 'react';
import { motion } from 'framer-motion';
import { Home, RefreshCcw, AlertCircle, Wrench } from 'lucide-react';
import styles from './MaintenancePage.module.scss';
import { getLocalizedField } from '../utils/localization';

const resolveLanguage = () => {
    if (typeof window !== 'undefined') {
        const stored = String(localStorage.getItem('portfolio.language') || '').toLowerCase();
        if (stored === 'km' || stored === 'en') return stored;
    }

    if (typeof document !== 'undefined') {
        const docLang = String(document.documentElement.lang || '').toLowerCase();
        if (docLang.startsWith('km')) return 'km';
    }

    return 'en';
};

const MaintenancePage = ({ error, resetErrorBoundary, title, message }) => {
    const language = resolveLanguage();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);

    const safeText = (value, fallback = '') => {
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);

        if (value && typeof value === 'object') {
            const localized = getLocalizedField(value, language);
            if (localized) return localized;
            try {
                return JSON.stringify(value);
            } catch {
                return fallback;
            }
        }

        return fallback;
    };

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

    const resolvedTitle = safeText(title) || (error ? tr('Temporary Hiccup', 'បញ្ហាបណ្តោះអាសន្ន') : tr('Under Maintenance', 'កំពុងថែទាំប្រព័ន្ធ'));
    const resolvedMessage = safeText(message) || (error
        ? tr("We encountered an unexpected error while preparing this page. Don't worry, it's usually temporary.", 'មានកំហុសមិនបានរំពឹងទុកពេលរៀបចំទំព័រនេះ។ កុំបារម្ភ វាជាបញ្ហាបណ្តោះអាសន្ន។')
        : tr("We're currently fine-tuning some details to bring you the best experience. Please check back in a moment!", 'យើងកំពុងកែសម្រួលលម្អិតខ្លះៗ ដើម្បីផ្តល់បទពិសោធន៍ល្អបំផុត។ សូមត្រលប់មកវិញបន្តិចទៀត!'));
    const errorDetail = safeText(error?.statusText) || safeText(error?.message) || tr('Unknown error', 'កំហុសមិនស្គាល់');

    return (
        <div className={styles.maintenanceWrapper}>
            <motion.div
                className={styles.content}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
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
                            ease: 'easeInOut'
                        }}
                    >
                        {error ? <AlertCircle size={40} /> : <Wrench size={40} />}
                    </motion.div>
                </div>

                <h1 className={styles.title}>{resolvedTitle}</h1>
                <p className={styles.message}>{resolvedMessage}</p>

                <div className={styles.actions}>
                    <button onClick={handleHomeClick} className={styles.primaryBtn}>
                        <Home size={18} /> {tr('Back to Home', 'ត្រឡប់ទៅទំព័រដើម')}
                    </button>
                    <button onClick={handleRefresh} className={styles.secondaryBtn}>
                        <RefreshCcw size={18} /> {tr('Try Again', 'សាកល្បងម្តងទៀត')}
                    </button>
                </div>

                {error && (
                    <details className={styles.errorDetail}>
                        <summary>{tr('Technical Details', 'ព័ត៌មានបច្ចេកទេស')}</summary>
                        <pre>{errorDetail}</pre>
                    </details>
                )}
            </motion.div>

            <div className={styles.bgGlow} />
        </div>
    );
};

export default MaintenancePage;
