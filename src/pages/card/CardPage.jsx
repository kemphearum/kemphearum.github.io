import { useRef, useState, useEffect, useCallback } from 'react';
import { useLoaderData } from 'react-router';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { Printer, ImageDown, UserPlus, Phone, Mail, Share2, Link, ExternalLink, Loader } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { getLocalizedField } from '../../utils/localization';
import { DEFAULT_SITE_URL } from '../../utils/SeoHelper';
import { generateVCard, downloadVCard } from './utils/VCardGenerator';

import DigitalCard from './components/DigitalCard';
import LanguageSwitcher from '../../shared/components/LanguageSwitcher';
import styles from './CardPage.module.scss';

// Safe check for navigator.share — guards against SSR context
const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

export default function CardPage() {
    const { settings, profile, communication } = useLoaderData();
    const { language, t } = useTranslation();
    const cardRef = useRef(null);
    const wrapperRef = useRef(null);
    const [isSaving, setIsSaving] = useState(false);
    // Initialize to null — we render the card only after the scale is known
    const [scale, setScale] = useState(null);

    const updateScale = useCallback(() => {
        if (!wrapperRef.current) return;
        const available = wrapperRef.current.getBoundingClientRect().width;
        if (available > 0) {
            setScale(Math.min(1, available / 1050));
        }
    }, []);

    const [base64Photo, setBase64Photo] = useState(null);

    useEffect(() => {
        updateScale();
        const ro = new ResizeObserver(updateScale);
        if (wrapperRef.current) ro.observe(wrapperRef.current);
        return () => ro.disconnect();
    }, [updateScale]);

    const site = settings?.site || {};
    const social = communication || {};
    const portfolioUrl = site.canonicalUrl || DEFAULT_SITE_URL;
    const cardUrl = `${portfolioUrl}/card`;
    
    const name = profile?.name ? getLocalizedField(profile.name, language) : '';
    const title = profile?.currentRole ? getLocalizedField(profile.currentRole, language) : '';
    const location = profile?.location ? getLocalizedField(profile.location, language) : '';
    const company = profile?.subtitle
        ? getLocalizedField(profile.subtitle, language)
        : (profile?.company ? getLocalizedField(profile.company, language) : '');
    const photoUrl = profile?.profileImageUrl || site.ogImageUrl || '';

    // Pre-fetch the image as Base64 to prevent html-to-image from hanging on iOS Safari
    // Safari's canvas engine often crashes when it tries to fetch cross-origin images from inside an SVG foreignObject.
    useEffect(() => {
        if (!photoUrl || photoUrl.startsWith('data:')) {
            setBase64Photo(photoUrl);
            return;
        }
        let isMounted = true;
        const fetchAsBase64 = async () => {
            try {
                // Fetch with no-cache to guarantee we get CORS headers (bypassing disk cache without CORS)
                const res = await fetch(photoUrl, { cache: 'no-cache' });
                const blob = await res.blob();
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (isMounted) setBase64Photo(reader.result);
                };
                reader.readAsDataURL(blob);
            } catch (err) {
                console.warn('Failed to pre-fetch photo as base64, falling back to url:', err);
                if (isMounted) setBase64Photo(photoUrl);
            }
        };
        fetchAsBase64();
        return () => { isMounted = false; };
    }, [photoUrl]);

    const handleDownloadVCard = () => {
        const vCardData = generateVCard(profile || {}, social, portfolioUrl);
        downloadVCard(vCardData, `${(name || 'contact').replace(/\s+/g, '_')}.vcf`);
    };

    const handleShare = async () => {
        if (canNativeShare) {
            try {
                await navigator.share({
                    title: `${name} - Digital Name Card`,
                    text: `Check out ${name}'s digital profile!`,
                    url: cardUrl,
                });
            } catch (err) {
                if (err.name !== 'AbortError') console.error('Error sharing:', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(cardUrl);
                alert(t('card.copied', 'URL copied to clipboard!'));
            } catch {
                alert(`Share this URL: ${cardUrl}`);
            }
        }
    };

    const handleDownloadImage = async () => {
        if (!cardRef.current || isSaving) return;
        setIsSaving(true);
        try {
            const filename = `${(name || 'namecard').replace(/\s+/g, '_')}_Card.png`;
            const opts = {
                cacheBust: true,
                pixelRatio: 2,
                width: 1050,
                height: 600,
                style: { 
                    borderRadius: '0', 
                    transform: 'none',
                    backfaceVisibility: 'visible',
                    WebkitBackfaceVisibility: 'visible',
                    backdropFilter: 'none',
                    WebkitBackdropFilter: 'none',
                    willChange: 'auto'
                },
            };
            
            const renderWithTimeout = (promise, ms = 8000) => 
                Promise.race([
                    promise, 
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Render timeout')), ms))
                ]);

            // First pass primes the image cache, second pass captures it
            // Wrapped in timeout so it never hangs infinitely on mobile
            try {
                await renderWithTimeout(toPng(cardRef.current, opts), 4000);
            } catch (e) {
                // Ignore first pass timeout, might just be slow
                console.warn('First render pass timed out or failed', e);
            }
            
            const dataUrl = await renderWithTimeout(toPng(cardRef.current, opts), 8000);

            // iOS Safari blocks a.click() downloads. Native share sheet is the reliable way.
            if (canNativeShare && navigator.canShare) {
                try {
                    const res = await fetch(dataUrl);
                    const blob = await res.blob();
                    const file = new File([blob], filename, { type: 'image/png' });
                    
                    if (navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            files: [file],
                            title: 'Digital Name Card',
                        });
                        setIsSaving(false);
                        return; // Done using native share sheet
                    }
                } catch (shareErr) {
                    if (shareErr.name !== 'AbortError') console.warn('Share API failed, falling back...', shareErr);
                }
            }

            // Fallback for Desktop or browsers without File sharing
            const link = document.createElement('a');
            link.download = filename;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to download image', err);
            alert('Failed to save image. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrint = () => window.print();

    // Scale is null until ResizeObserver fires — keep wrapper visible but card hidden
    // to avoid a flash of the full 1050px layout on mobile
    const cardStyle = scale === null
        ? { visibility: 'hidden', width: '1050px', height: '600px' }
        : { 
            width: '1050px', 
            height: '600px', 
            transformOrigin: 'top left', 
            transform: `scale(${scale}) translateZ(0)`,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            willChange: 'transform'
        };

    const wrapperHeight = scale === null ? '0px' : `${Math.round(600 * scale)}px`;

    return (
        <main className={styles.cardPage}>
            <div className={styles.topControls}>
                <LanguageSwitcher />
            </div>

            <motion.div
                className={styles.container}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Measurement anchor — always full width, height collapses to match visual card */}
                <div
                    ref={wrapperRef}
                    style={{ width: '100%', maxWidth: '1050px', height: wrapperHeight, overflow: 'visible' }}
                >
                    <div ref={cardRef} style={cardStyle}>
                        <DigitalCard
                            name={name}
                            title={title}
                            company={company}
                            photoUrl={base64Photo || photoUrl}
                            location={location}
                            social={social}
                            portfolioUrl={portfolioUrl}
                            cardUrl={cardUrl}
                            onDownloadVCard={handleDownloadVCard}
                            onShare={handleShare}
                            exportMode={true}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className={styles.externalActions}>
                    <button onClick={handleDownloadVCard} className={styles.actionBtn}>
                        <UserPlus size={18} />
                        <div className={styles.btnText}>
                            <span>{t('card.actions.saveMain', 'Save Contact')}</span>
                            <span className={styles.btnSubtext}>.vcf</span>
                        </div>
                    </button>
                    {social?.phone && (
                        <a href={`tel:${social.phone}`} className={styles.actionBtn}>
                            <Phone size={18} />
                            <span>{t('card.actions.call', 'Call Me')}</span>
                        </a>
                    )}
                    {social?.email && (
                        <a href={`mailto:${social.email}`} className={styles.actionBtn}>
                            <Mail size={18} />
                            <span>{t('card.actions.email', 'Email Me')}</span>
                        </a>
                    )}
                    <button onClick={handleShare} className={styles.actionBtn}>
                        {canNativeShare ? <Share2 size={18} /> : <Link size={18} />}
                        <span>{t('card.actions.share', 'Share Card')}</span>
                    </button>
                    <a href={portfolioUrl} className={styles.actionBtn}>
                        <ExternalLink size={18} />
                        <span>{t('card.actions.portfolio', 'View Portfolio')}</span>
                    </a>
                    <button onClick={handlePrint} className={styles.actionBtn}>
                        <Printer size={18} />
                        <span>{t('card.print', 'Print Card')}</span>
                    </button>
                    <button
                        onClick={handleDownloadImage}
                        className={styles.actionBtn}
                        disabled={isSaving}
                    >
                        {isSaving
                            ? <Loader size={18} className={styles.spinning} />
                            : <ImageDown size={18} />
                        }
                        <span>{isSaving ? t('card.saving', 'Saving…') : t('card.saveImage', 'Save as Image')}</span>
                    </button>
                </div>
            </motion.div>
        </main>
    );
}
