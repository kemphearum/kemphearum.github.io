import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy, Check, Github, Linkedin, Twitter, Globe, Clock, MessageSquare, FileText } from 'lucide-react';
import { generateQrSvg } from '../utils/qrcode';
import { DEFAULT_SITE_URL } from '../utils/SeoHelper';
import CommunicationService from '../services/CommunicationService';
import ResumeService from '../services/ResumeService';
import { useAnalytics } from '../hooks/useAnalytics';
import styles from './Contact.module.scss';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import MarkdownRenderer from './MarkdownRenderer';
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedField } from '../utils/localization';

const getConfiguredContactEndpoint = () => {
    const explicit = String(import.meta.env.VITE_CONTACT_ENDPOINT || '').trim();
    if (explicit) return explicit;
    return null;
};

const DEFAULT_PRIMARY_CONTACT_ORIGIN = 'https://phearum-info.vercel.app';

const getPrimaryContactEndpoint = () => {
    const explicitOrigin = String(import.meta.env.VITE_PRIMARY_CONTACT_ORIGIN || '').trim();
    const origin = explicitOrigin || DEFAULT_PRIMARY_CONTACT_ORIGIN;
    return `${origin.replace(/\/$/, '')}/api/contact`;
};

const getContactEndpoints = () => {
    const endpoints = [];
    const configured = getConfiguredContactEndpoint();
    if (configured) endpoints.push(configured);
    const hostname = typeof window !== 'undefined' ? String(window.location.hostname || '') : '';
    const isVercelHost = hostname.endsWith('.vercel.app');
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

    if (isVercelHost || isLocalHost) {
        // Use same-origin route first when API is expected in this host.
        endpoints.push('/api/contact');
        endpoints.push(getPrimaryContactEndpoint());
    } else {
        // On GitHub Pages/Firebase mirrors, target primary Vercel API directly.
        endpoints.push(getPrimaryContactEndpoint());
    }

    return Array.from(new Set(endpoints));
};

const submitContact = async (payload) => {
    const endpoints = getContactEndpoints();
    let lastError = null;

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                // Use a simple request content type to avoid CORS preflight across mirrors.
                headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
                body: JSON.stringify(payload)
            });

            if (response.ok) return { success: true };
            if (response.status === 429) return { success: false, rateLimited: true };

            // Try next endpoint for typical route-not-found / backend unavailable.
            if ([404, 405, 500, 502, 503].includes(response.status)) {
                lastError = new Error(`Endpoint failed (${endpoint}): ${response.status}`);
                continue;
            }

            lastError = new Error(`Contact endpoint rejected request (${response.status})`);
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error('Unable to submit contact form');
};

const TelegramIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
);

const getPortfolioUrl = () => {
    if (typeof window === 'undefined') return DEFAULT_SITE_URL;
    const origin = window.location.origin || '';
    return origin && !origin.includes('localhost') ? origin : DEFAULT_SITE_URL;
};

const Contact = () => {
    const { trackEvent } = useAnalytics();
    const { language, t } = useTranslation();
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [status, setStatus] = useState(null);
    const [copied, setCopied] = useState(false);

    const portfolioUrl = getPortfolioUrl();

    const { data: commData, isLoading: commLoading } = useQuery({
        staleTime: 60000,
        gcTime: 300000,
        retry: 1,
        refetchOnWindowFocus: false,
        queryKey: ['content', 'contact'],
        queryFn: () => CommunicationService.get()
    });

    const { data: resumeData } = useQuery({
        staleTime: 60000,
        gcTime: 300000,
        retry: 1,
        refetchOnWindowFocus: false,
        queryKey: ['content', 'resume'],
        queryFn: () => ResumeService.get()
    });

    const communication = commData || {};
    const social = communication || {};
    
    const responseTime = getLocalizedField(communication.responseTime, language);
    const timeZone = communication.timeZone;
    const availabilityStatus = communication.availabilityStatus;
    const availabilityMessage = getLocalizedField(communication.availabilityMessage, language);
    const preferredContact = communication.preferredContact || [];
    const introText = getLocalizedField(communication.introText, language);
    const telegramEnabled = communication.telegramEnabled !== false;

    const copyEmail = async () => {
        if (!social.email || typeof navigator === 'undefined' || !navigator.clipboard) return;
        try {
            await navigator.clipboard.writeText(social.email);
            setCopied(true);
            trackEvent('contact_email_copied');
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Clipboard copy failed:', error);
        }
    };

    const socialLinks = [
        { key: 'github', url: social.github, label: 'GitHub', Icon: Github },
        { key: 'linkedin', url: social.linkedin, label: 'LinkedIn', Icon: Linkedin },
        { key: 'twitter', url: social.twitter, label: 'X / Twitter', Icon: Twitter },
        { key: 'telegram', url: social.telegramUrl || social.telegram, label: 'Telegram', Icon: TelegramIcon },
        { key: 'website', url: social.website, label: 'Website', Icon: Globe }
    ].filter((s) => s.url);

    const qrUrl = (telegramEnabled && social.telegramUrl) ? social.telegramUrl : portfolioUrl;
    const qrSvg = useMemo(() => generateQrSvg(qrUrl, { ecc: 'M', margin: 2 }), [qrUrl]);

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
            const result = await submitContact({
                ...formData,
                website: '' // honeypot field
            });

            if (result?.rateLimited) {
                setStatus('rate_limited');
                setTimeout(() => setStatus(null), 5000);
                return;
            }

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
                    {commLoading ? (
                        <div className={styles.skeletonText} />
                    ) : (
                        <motion.div
                            className={styles.text}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            viewport={{ once: true }}
                        >
                            <MarkdownRenderer content={introText} />
                        </motion.div>
                    )}

                    <motion.div
                        className={styles.contactMeta}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        viewport={{ once: true }}
                    >
                        {availabilityStatus && (
                            <div
                                role="status"
                                aria-label={`Availability: ${t(`recruiter.availability.${availabilityStatus}`, 'Available')}${availabilityMessage ? ` — ${availabilityMessage}` : ''}`}
                                className={`${styles.availability} ${styles[`availability--${availabilityStatus}`] || ''}`}
                            >
                                <span className={styles.availabilityDot} aria-hidden="true" />
                                <span>
                                    <strong>{t(`recruiter.availability.${availabilityStatus}`, 'Available')}</strong>
                                    {availabilityMessage ? ` — ${availabilityMessage}` : ''}
                                </span>
                            </div>
                        )}

                        <div className={styles.metaFacts} aria-label="Contact details">
                            {responseTime && (
                                <span className={styles.metaFact}><Clock size={14} aria-hidden="true" /> {t('contact.responseTime', 'Typical response:')} {responseTime}</span>
                            )}
                            {timeZone && (
                                <span className={styles.metaFact}><Globe size={14} aria-hidden="true" /> {timeZone}</span>
                            )}
                            {preferredContact.length > 0 && (
                                <span className={styles.metaFact}><MessageSquare size={14} aria-hidden="true" /> {t('contact.preferred', 'Preferred:')} {preferredContact.join(', ')}</span>
                            )}
                        </div>

                        <div className={styles.metaActions}>
                            {social.email && (
                                <button
                                    type="button"
                                    className={styles.copyBtn}
                                    onClick={copyEmail}
                                    aria-label={copied ? t('contact.emailCopied', 'Copied!') : `${t('contact.copyEmail', 'Copy email address')}: ${social.email}`}
                                    aria-live="polite"
                                >
                                    {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                                    <span>{copied ? t('contact.emailCopied', 'Copied!') : social.email}</span>
                                </button>
                            )}
                        </div>

                        {socialLinks.length > 0 && (
                            <nav className={styles.socials} aria-label="Social links">
                                {/* eslint-disable-next-line no-unused-vars */}
                                {socialLinks.map(({ key, url, label, Icon }) => (
                                    <a key={key} href={url} target="_blank" rel="noopener noreferrer" className={styles.socialBtn} aria-label={label} title={label}>
                                        <Icon size={18} aria-hidden="true" />
                                    </a>
                                ))}
                            </nav>
                        )}
                        
                        {resumeData?.pdfBase64 && resumeData?.publicDownloadEnabled && (
                            <div className={styles.resumeDownloadAction} style={{ marginTop: '1.5rem' }}>
                                <a 
                                    href={resumeData.pdfBase64} 
                                    download="Resume.pdf" 
                                    className="ui-btn ui-btn--outline"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}
                                >
                                    <FileText size={18} />
                                    {t('contact.downloadResume', 'Download Résumé')}
                                </a>
                            </div>
                        )}
                    </motion.div>

                    {telegramEnabled && (
                        <div
                            className={styles.qrPanel}
                            role="region"
                            aria-label={t('contact.qr.label', 'Scan to connect instantly')}
                        >
                            {communication.telegramQrCodeImage ? (
                                <img
                                    src={communication.telegramQrCodeImage}
                                    alt={t('contact.qr.imageAlt', 'Telegram QR code — scan to open chat')}
                                    className={styles.qrImage}
                                    loading="lazy"
                                    width="150"
                                    height="150"
                                />
                            ) : (
                                <div
                                    className={styles.qrCode}
                                    role="img"
                                    aria-label={t('contact.qr.svgAlt', 'QR code linking to Telegram')}
                                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                                />
                            )}
                            <p className={styles.qrCaption}>{t('contact.qr.caption', 'Scan to chat on Telegram')}</p>
                            {social.telegramUsername && <p className={styles.qrUsername}>{social.telegramUsername}</p>}
                            {(social.telegramUrl || social.telegram) && (
                                <a
                                    href={social.telegramUrl || social.telegram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.telegramBtn}
                                    aria-label={`${t('contact.telegram', 'Chat on Telegram')}${social.telegramUsername ? ` (@${social.telegramUsername})` : ''}`}
                                >
                                    <TelegramIcon aria-hidden="true" />
                                    {t('contact.telegram', 'Chat on Telegram')}
                                </a>
                            )}
                        </div>
                    )}

                    <motion.form
                        className={styles.form}
                        onSubmit={handleSubmit}
                        aria-busy={status === 'sending'}
                        aria-describedby={status ? 'contact-status' : undefined}
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
                                    aria-invalid={status === 'error' || status === 'rate_limited'}
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
                                    aria-invalid={status === 'error' || status === 'rate_limited'}
                                    placeholder={t('contact.emailPlaceholder')}
                                />
                            </div>
                        </div>

                        <input
                            type="text"
                            name="website"
                            autoComplete="off"
                            tabIndex="-1"
                            aria-hidden="true"
                            style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
                            onChange={() => {}}
                        />

                        <div className={styles.inputGroup}>
                            <label htmlFor="message">{t('contact.message')}</label>
                            <textarea
                                id="message"
                                name="message"
                                rows="5"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                aria-invalid={status === 'error' || status === 'rate_limited'}
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
                                    id="contact-status"
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
                                    id="contact-status"
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
                                    id="contact-status"
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
