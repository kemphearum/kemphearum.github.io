import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './LanguageSwitcher.module.scss';

const LanguageSwitcher = () => {
    const { language, setLanguage, t } = useTranslation();
    const usFlag = String.fromCodePoint(0x1f1fa, 0x1f1f8);
    const khFlag = String.fromCodePoint(0x1f1f0, 0x1f1ed);
    const options = [
        { code: 'en', flag: usFlag, label: 'English' },
        { code: 'km', flag: khFlag, label: 'Khmer' }
    ];

    return (
        <div className={styles.switcher} role="group" aria-label={t('language.label')}>
            {options.map((option) => (
                <button
                    key={option.code}
                    type="button"
                    className={`${styles.option} ${language === option.code ? styles.active : ''}`}
                    onClick={() => setLanguage(option.code)}
                    aria-pressed={language === option.code}
                    aria-label={option.label}
                    title={option.label}
                >
                    <span className={styles.flag} aria-hidden="true">{option.flag}</span>
                    <span className={styles.srOnly}>{option.label}</span>
                </button>
            ))}
        </div>
    );
};

export default LanguageSwitcher;
