import React, { useState } from 'react';
import MessageService from '../services/MessageService';
import { serverTimestamp } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import ContentService from '../services/ContentService';
import { useAnalytics } from '../hooks/useAnalytics';
import styles from './Contact.module.scss';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import MarkdownRenderer from './MarkdownRenderer';
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedField } from '../utils/localization';

const Contact = () => {
    const { trackEvent } = useAnalytics();
    const { language, t } = useTranslation();
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [status, setStatus] = useState(null);

    const { data, isLoading: loading } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
        queryKey: ['content', 'contact'],
        queryFn: () => ContentService.fetchSection('contact')
    });

    const rawContactContent = data || { introText: '' };
    const contactContent = {
        ...rawContactContent,
        introText: getLocalizedField(rawContactContent.introText, language)
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Rate limiting logic
        const lastSubmitTime = localStorage.getItem('lastContactSubmit');
        if (lastSubmitTime) {
            const timeDiff = Date.now() - parseInt(lastSubmitTime, 10);
            // Limit to once every 5 minutes (300,000 ms)
            if (timeDiff < 300000) {
                setStatus('rate_limited');
                setTimeout(() => setStatus(null), 5000);
                return;
            }
        }

        setStatus('sending');
        try {
            await MessageService.create({
                ...formData,
                isRead: false,
                createdAt: serverTimestamp()
            }, null); // no trackWrite because this is public frontend

            localStorage.setItem('lastContactSubmit', Date.now().toString());
            setStatus('success');
            setFormData({ name: '', email: '', message: '' });
            trackEvent('contact_form_submit');
            setTimeout(() => setStatus(null), 5000);
        } catch (error) {
            console.error("Error submitting form: ", error);
            setStatus('error');
        }
    };

    return (
        <section id="contact" className={styles.section}>
            <div className={styles.container}>
                <motion.h2
                    className="section-title"
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    {t('contact.title')}
                </motion.h2>
                <div className={styles.content}>
                    {loading ? (
                        <div className={styles.skeletonText} />
                    ) : (
                        <motion.div
                            className={styles.text}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            viewport={{ once: true }}
                        >
                            <MarkdownRenderer content={contactContent.introText} />
                        </motion.div>
                    )}

                    <motion.form
                        className={styles.form}
                        onSubmit={handleSubmit}
                        aria-busy={status === 'sending'}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", duration: 0.8, delay: 0.3 }}
                        viewport={{ once: true }}
                    >
                        <div className={styles.formRow}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="name">{t('contact.name')}</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder={t('contact.namePlaceholder')}
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="email">{t('contact.email')}</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder={t('contact.emailPlaceholder')}
                                />
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="message">{t('contact.message')}</label>
                            <textarea
                                id="message"
                                name="message"
                                rows="5"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                placeholder={t('contact.messagePlaceholder')}
                            ></textarea>
                        </div>

                        <motion.button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={status === 'sending'}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                        >
                            {status === 'sending' ? (
                                <span className={styles.sendingState}>
                                    <span className={styles.spinner} />
                                    {t('contact.sending')}
                                </span>
                            ) : (
                                <span className={styles.btnContent}>
                                    {t('contact.send')}
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                                    </svg>
                                </span>
                            )}
                        </motion.button>

                        <AnimatePresence>
                            {status === 'success' && (
                                <motion.div
                                    className={styles.success}
                                    role="status"
                                    aria-live="polite"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    {t('contact.success')}
                                </motion.div>
                            )}
                            {status === 'error' && (
                                <motion.div
                                    className={styles.error}
                                    role="alert"
                                    aria-live="assertive"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    {t('contact.error')}
                                </motion.div>
                            )}
                            {status === 'rate_limited' && (
                                <motion.div
                                    className={`${styles.error} ${styles.rateLimited}`}
                                    role="alert"
                                    aria-live="assertive"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    {t('contact.rateLimited')}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.form>
                </div>
            </div>
        </section>
    );
};

export default Contact;
