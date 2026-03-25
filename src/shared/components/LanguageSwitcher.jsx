import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import styles from './LanguageSwitcher.module.scss';

const LanguageSwitcher = () => {
    const { language, setLanguage } = useLanguage();

    const languages = [
        { code: 'en', label: 'EN' },
        { code: 'km', label: 'ខ្មែរ' }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.pillContainer}>
                {/* Sliding Background */}
                <motion.div 
                    className={styles.activeIndicator}
                    initial={false}
                    animate={{
                        x: language === 'en' ? '0%' : '100%'
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30
                    }}
                />
                
                {languages.map((lang) => (
                    <button
                        key={lang.code}
                        className={`${styles.langButton} ${language === lang.code ? styles.active : ''}`}
                        onClick={() => setLanguage(lang.code)}
                        aria-label={`Switch to ${lang.label}`}
                    >
                        <span className={styles.buttonText}>{lang.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default LanguageSwitcher;
