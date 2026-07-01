import { useRef } from 'react';
import { useLoaderData } from 'react-router';
import { motion } from 'framer-motion';
import { toPng, toJpeg } from 'html-to-image';
import { Printer, ImageDown, UserPlus, Phone, Mail, Share2, Link } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { getLocalizedField } from '../../utils/localization';
import { DEFAULT_SITE_URL } from '../../utils/SeoHelper';
import { generateVCard, downloadVCard } from './utils/VCardGenerator';

import DigitalCard from './components/DigitalCard';
import styles from './CardPage.module.scss';

export default function CardPage() {
    const { settings, profile, communication } = useLoaderData();
    const { language, t } = useTranslation();
    const exportRef = useRef(null);

    const site = settings?.site || {};
    const social = communication || {};
    const portfolioUrl = site.canonicalUrl || DEFAULT_SITE_URL;
    const cardUrl = `${portfolioUrl}/card`;
    
    const name = profile?.name ? getLocalizedField(profile.name, language) : '';
    const title = profile?.currentRole ? getLocalizedField(profile.currentRole, language) : '';
    const location = profile?.location ? getLocalizedField(profile.location, language) : '';
    const company = profile?.subtitle ? getLocalizedField(profile.subtitle, language) : (profile?.company ? getLocalizedField(profile.company, language) : '');
    const photoUrl = profile?.profileImageUrl || site.ogImageUrl || '';

    // VCard Download Handler
    const handleDownloadVCard = () => {
        const vCardData = generateVCard(profile || {}, social, portfolioUrl);
        downloadVCard(vCardData, `${name.replace(/\s+/g, '_')}.vcf`);
    };

    // Share Handler
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${name} - Digital Name Card`,
                    text: `Check out ${name}'s digital profile!`,
                    url: cardUrl,
                });
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            navigator.clipboard.writeText(cardUrl);
            alert(t('card.copied', 'URL copied to clipboard!'));
        }
    };

    // Export as Image
    const handleDownloadImage = async (format = 'png') => {
        if (!exportRef.current) return;
        try {
            const dataUrl = format === 'png'
                ? await toPng(exportRef.current, { backgroundColor: '#ffffff', pixelRatio: 3 })
                : await toJpeg(exportRef.current, { backgroundColor: '#ffffff', quality: 0.95, pixelRatio: 3 });
                
            const link = document.createElement('a');
            link.download = `${name.replace(/\s+/g, '_')}_Card.${format}`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to download image', err);
            alert('Failed to save image. Please try again.');
        }
    };

    // Print Handler
    const handlePrint = () => {
        window.print();
    };

    return (
        <main className={styles.cardPage}>
            <motion.div 
                className={styles.container}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                
                <div>
                    <DigitalCard 
                        name={name}
                        title={title}
                        company={company}
                        photoUrl={photoUrl}
                        location={location}
                        social={social}
                        portfolioUrl={portfolioUrl}
                        cardUrl={cardUrl}
                        onDownloadVCard={handleDownloadVCard}
                        onShare={handleShare}
                    />
                </div>

                {/* Hidden clone specifically designed for clean exporting */}
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                    <div ref={exportRef} style={{ width: '1050px', height: '600px', display: 'flex' }}>
                        <DigitalCard 
                            name={name}
                            title={title}
                            company={company}
                            photoUrl={photoUrl}
                            location={location}
                            social={social}
                            portfolioUrl={portfolioUrl}
                            cardUrl={cardUrl}
                            onDownloadVCard={() => {}}
                            onShare={() => {}}
                            exportMode={true}
                        />
                    </div>
                </div>

                {/* External Action Buttons */}
                <div className={styles.externalActions}>
                    <button 
                        onClick={handleDownloadVCard} 
                        className={styles.actionBtn}
                    >
                        <UserPlus size={18} />
                        <div className={styles.btnText}>
                            <span>{t('card.actions.saveMain', 'Save Contact')}</span>
                            <span className={styles.btnSubtext}>.vcf</span>
                        </div>
                    </button>
                    {social?.phone && (
                        <a 
                            href={`tel:${social.phone}`} 
                            className={styles.actionBtn}
                        >
                            <Phone size={18} />
                            <span>{t('card.actions.call', 'Call Me')}</span>
                        </a>
                    )}
                    {social?.email && (
                        <a 
                            href={`mailto:${social.email}`} 
                            className={styles.actionBtn}
                        >
                            <Mail size={18} />
                            <span>{t('card.actions.email', 'Email Me')}</span>
                        </a>
                    )}
                    <button 
                        onClick={handleShare} 
                        className={styles.actionBtn}
                    >
                        {navigator.share ? <Share2 size={18} /> : <Link size={18} />}
                        <span>{t('card.actions.share', 'Share Card')}</span>
                    </button>
                    <button onClick={handlePrint} className={styles.actionBtn}>
                        <Printer size={18} />
                        <span>{t('card.print', 'Print Card')}</span>
                    </button>
                    <button onClick={() => handleDownloadImage('png')} className={styles.actionBtn}>
                        <ImageDown size={18} />
                        <span>{t('card.saveImage', 'Save as Image')}</span>
                    </button>
                </div>
            </motion.div>
        </main>
    );
}
