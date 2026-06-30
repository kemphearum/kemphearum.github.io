import React, { useState, useEffect } from 'react';
import AuthService from '../services/AuthService';
import { useTranslation } from '../hooks/useTranslation';
import { getLanguageValue } from '../utils/localization';
import MarkdownRenderer from '@/sections/MarkdownRenderer';
import { AlertCircle, Beaker, Settings, Wrench, Clock } from 'lucide-react';
import { useLocation } from 'react-router';
import styles from './SiteStatusOverlay.module.scss';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

/**
 * Renders a site status overlay (watermark or blocking dialog)
 * based on the global settings configuration.
 */
const SiteStatusOverlay = ({ config }) => {
    const { language } = useTranslation();
    const location = useLocation();
    const [isAdminAuthed, setIsAdminAuthed] = useState(false);

    useEffect(() => {
        const unsubscribe = AuthService.onAuthChange((user) => {
            setIsAdminAuthed(!!user);
        });
        return () => unsubscribe();
    }, []);

    // Default to 'live' if undefined
    const status = config?.siteStatus || 'live';
    const rawType = config?.siteStatusType || 'watermark';
    
    // If admin is authenticated, downgrade blocking dialogs to watermarks
    const type = isAdminAuthed ? 'watermark' : rawType;

    useEffect(() => {
        if (status !== 'live' && type === 'watermark') {
            document.body.style.paddingBottom = '45px';
            document.documentElement.style.setProperty('--status-banner-height', '45px');
        } else {
            document.body.style.paddingBottom = '';
            document.documentElement.style.removeProperty('--status-banner-height');
        }
        return () => {
            document.body.style.paddingBottom = '';
            document.documentElement.style.removeProperty('--status-banner-height');
        };
    }, [status, type]);

    // Do not block or show watermark on the admin portal
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/login')) {
        return null;
    }

    // Do not render anything if the site is live
    if (status === 'live') return null;

    const rawMessage = config?.siteStatusMessage;
    // Default fallback messages if none provided
    let fallbackEn = status === 'maintenance' 
        ? "We're currently performing scheduled maintenance. Please check back soon."
        : "We are conducting final system testing and validation for the upcoming release. Some feature sets may be limited or exhibit issues during this controlled beta phase.";
    
    let fallbackKm = status === 'maintenance'
        ? "យើងកំពុងធ្វើការថែទាំប្រព័ន្ធ។ សូមត្រឡប់មកវិញនៅពេលក្រោយ។"
        : "យើងកំពុងសាកល្បងកែលម្អ ដើម្បីធានាបាននូវគុណភាព។ មុខងារខ្លះអាចមិនទាន់ដំណើរការល្អ ឬមានកំណត់។";
        
    const messageEn = getLanguageValue(rawMessage, 'en', true) || fallbackEn;
    const messageKm = getLanguageValue(rawMessage, 'km', false) || fallbackKm;
    const activeMessage = language === 'km' ? messageKm : messageEn;

    const isMaintenance = status === 'maintenance';



    if (type === 'dialog') {
        if (!isMaintenance) {
            // Beta Testing Full Page Overlay
            const progress = config?.testingProgress ?? 85;
            const endDate = config?.testingEndDate || 'TBD';
            const feedbackUrl = config?.testingFeedbackUrl || '#';

            return (
                <div className={`${styles.dialogOverlay} ${styles.blocking}`}>
                    <motion.div 
                        className={styles.betaContent}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                        <div className={styles.textContent}>
                            <h1 className={styles.title}>
                                {language === 'km' ? 'គេហទំព័រកំពុងសាកល្បង' : 'PRE-RELEASE TESTING IN PROGRESS'}
                            </h1>
                            <div className={styles.subtitle}>
                                {language === 'km' ? 'PRE-RELEASE TESTING IN PROGRESS' : 'គេហទំព័រកំពុងសាកល្បង'}
                            </div>
                            
                            <div className={styles.description}>
                                <MarkdownRenderer content={activeMessage} />
                            </div>

                            <div className={styles.progressSection}>
                                <div className={styles.progressMeta}>
                                    <span>{language === 'km' ? 'វឌ្ឍនភាព' : 'Progress'}:</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className={styles.progressBarContainer}>
                                    <motion.div 
                                        className={styles.progressBar}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                                    />
                                </div>
                            </div>

                            {endDate && endDate !== 'TBD' && (
                                <div className={styles.endDate}>
                                    {language === 'km' ? 'ថ្ងៃបញ្ចប់ការសាកល្បង៖' : 'Beta Testing Phase Ends:'} [{new Date(endDate).toLocaleDateString(language === 'km' ? 'km-KH' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}]
                                </div>
                            )}

                            {feedbackUrl && (
                                <a href={feedbackUrl} target="_blank" rel="noopener noreferrer" className={styles.actionBtn}>
                                    <span className={styles.enTitle}>Submit Feedback / Bug Report</span>
                                    <span className={styles.kmTitle}>បញ្ជូនមតិយោបល់ / រាយការណ៍បញ្ហា</span>
                                </a>
                            )}
                        </div>

                        <div className={styles.graphicContent}>
                            <div className={styles.orbit} />
                            <div className={styles.orbit2} />
                            <div className={styles.centerLogo}>
                                <span className={styles.kp}>KP</span>
                                <div className={styles.gears}>
                                    <Settings size={120} strokeWidth={1} />
                                </div>
                            </div>
                            <motion.div 
                                className={styles.betaBadge}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1, rotate: -10 }}
                                transition={{ delay: 0.8, type: 'spring' }}
                            >
                                BETA
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            );
        }

        // Standard Maintenance Blocking Dialog
        const contactUrl = config?.maintenanceContactUrl;
        const progress = config?.maintenanceProgress ?? 0;
        const endDate = config?.maintenanceEndDate || '';

        return (
            <div className={`${styles.dialogOverlay} ${styles.blocking}`}>
                <motion.div 
                    className={styles.betaContent}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    <div className={styles.textContent}>
                        <h1 className={styles.title}>
                            {language === 'km' ? 'គេហទំព័រកំពុងថែទាំ' : 'Website Under Maintenance'}
                        </h1>
                        <div className={styles.subtitle}>
                            {language === 'km' ? 'Website Under Maintenance' : 'គេហទំព័រកំពុងថែទាំ'}
                        </div>
                        
                        <div className={styles.description}>
                            <MarkdownRenderer content={activeMessage} />
                        </div>

                        <div className={styles.progressSection}>
                            <div className={styles.progressMeta}>
                                <span>{language === 'km' ? 'វឌ្ឍនភាព' : 'Progress'}:</span>
                                <span>{progress}%</span>
                            </div>
                            <div className={styles.progressBarContainer}>
                                <motion.div 
                                    className={styles.progressBar}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                                />
                            </div>
                        </div>

                        {endDate && (
                            <div className={styles.endDate}>
                                {language === 'km' ? 'ថ្ងៃរំពឹងទុកត្រឡប់មកវិញ៖' : 'Expected return:'} [{new Date(endDate).toLocaleDateString(language === 'km' ? 'km-KH' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}]
                            </div>
                        )}

                        {contactUrl && (
                            <a href={contactUrl} target="_blank" rel="noopener noreferrer" className={styles.actionBtn}>
                                <span className={styles.enTitle}>Contact for urgent inquiries</span>
                                <span className={styles.kmTitle}>យើងខ្ញុំសម្រាប់សាកសួរ</span>
                            </a>
                        )}
                    </div>

                    <div className={styles.graphicContent}>
                        <div className={styles.orbit} />
                        <div className={styles.orbit2} />
                        <div className={styles.centerLogo}>
                            <span className={styles.kp}>KP</span>
                            <div className={styles.gears}>
                                <Settings size={100} strokeWidth={1} style={{ position: 'absolute', top: -10, left: -10 }} />
                                <Settings size={80} strokeWidth={1} style={{ position: 'absolute', bottom: -10, right: -10, animationDirection: 'reverse' }} />
                                <Clock size={60} strokeWidth={1.5} style={{ position: 'absolute', zIndex: 3, opacity: 0.9 }} color="#fff" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Watermark Type
    const repeatText = isMaintenance ? 'MAINTENANCE...' : 'TESTING...';
    const bannerColor = isMaintenance ? '#ef4444' : '#60a5fa';

    return (
        <>
            <div className={styles.watermarkOverlay}>
                <div className={styles.watermarkText} style={{ color: isMaintenance ? 'rgba(239, 68, 68, 0.03)' : 'rgba(255, 255, 255, 0.03)' }}>
                    {Array.from({ length: 50 }).map((_, i) => (
                        <span key={i}>{repeatText}</span>
                    ))}
                </div>
            </div>
            <div className={styles.bottomBanner}>
                <div className={styles.bannerLeft}>
                    {isMaintenance ? <Wrench size={16} color={bannerColor} /> : <Beaker size={16} color={bannerColor} />}
                    <span style={{ color: bannerColor }}>
                        {isMaintenance ? 'MAINTENANCE MODE (LIVE & ACCESSIBLE)' : 'TEST MODE (LIVE & ACCESSIBLE)'}
                    </span>
                </div>
                <div className={styles.bannerRight}>
                    <span style={{ opacity: 0.7 }}>
                        {isMaintenance 
                            ? (language === 'km' ? 'នេះគឺជាបរិស្ថានថែទាំប្រព័ន្ធ' : 'Maintenance Environment')
                            : (language === 'km' ? 'នេះគឺជាបរិស្ថានសាកល្បង' : 'Testing Environment')
                        }
                    </span>
                </div>
            </div>
        </>
    );
};

export default SiteStatusOverlay;
