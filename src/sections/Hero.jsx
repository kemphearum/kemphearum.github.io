import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import ContentService from '../services/ContentService';
import { useAnalytics } from '../hooks/useAnalytics';
import styles from './Hero.module.scss';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import MarkdownRenderer from './MarkdownRenderer';
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedField } from '../utils/localization';
import { normalizeSectionTarget } from '../utils/sectionNavigation';
import { Download, Send } from 'lucide-react';

const Hero = () => {
    const { trackEvent } = useAnalytics();
    const { language, t } = useTranslation();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
    const navigate = useNavigate();

    const handleSectionLinkClick = (e, target) => {
        const targetId = normalizeSectionTarget(target);
        const element = document.getElementById(targetId);

        if (element) {
            if (e) e.preventDefault();
            element.scrollIntoView({ behavior: 'smooth' });
            const nextUrl = targetId === 'home' ? '/' : `/#${targetId}`;
            window.history.replaceState(null, '', nextUrl);
            return;
        }

        // Element not found (likely on another page)
        if (e && !target.startsWith('/')) {
            e.preventDefault();
            const nextUrl = targetId === 'home' ? '/' : `/#${targetId}`;
            navigate(nextUrl);
        }
    };

    const { data, isLoading: loading } = useQuery({
        staleTime: 60000,
        gcTime: 300000,
        refetchOnWindowFocus: false,
        queryKey: ['content', 'home'],
        queryFn: () => ContentService.fetchSection('home')
    });

    const rawContent = data || {
        greeting: '',
        name: '',
        subtitle: '',
        description: '',
        ctaText: '',
        ctaLink: '',
        profileImageUrl: ''
    };

    const content = {
        ...rawContent,
        greeting: getLocalizedField(rawContent.greeting, language),
        name: getLocalizedField(rawContent.name, language),
        subtitle: getLocalizedField(rawContent.subtitle, language),
        description: getLocalizedField(rawContent.description, language),
        ctaText: getLocalizedField(rawContent.ctaText, language)
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
    };

    return (
        <section id="home" className={styles.hero}>
            <div className={styles.particles}>
                {[...Array(6)].map((_, i) => (
                    <div key={i} className={styles.particle} style={{
                        '--delay': `${i * 2}s`,
                        '--x': `${10 + (i % 4) * 20}%`,
                        '--y': `${10 + (i % 3) * 30}%`,
                        '--size': `${60 + i * 30}px`
                    }} />
                ))}
            </div>

            <motion.div
                className={styles.container}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div
                    className={styles.content}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {loading ? (
                        <div className={styles.skeleton}>
                            <div className={styles.skeletonLine} style={{ width: '120px', height: '18px' }} />
                            <div className={styles.skeletonLine} style={{ width: '320px', height: '48px' }} />
                            <div className={styles.skeletonLine} style={{ width: '280px', height: '36px' }} />
                            <div className={styles.skeletonLine} style={{ width: '100%', height: '60px' }} />
                        </div>
                    ) : (
                        <>
                            <motion.p variants={itemVariants} className={styles.greeting}>
                                <span className={styles.greetingIcon}>👋</span> {content.greeting}
                            </motion.p>
                            <motion.h1 variants={itemVariants} className={styles.title}>
                                {content.name}
                            </motion.h1>
                            <motion.h2 variants={itemVariants} className={styles.subtitle}>
                                {content.subtitle}
                            </motion.h2>
                            <motion.div variants={itemVariants} className={styles.description}>
                                <MarkdownRenderer content={content.description} />
                            </motion.div>
                            <motion.div variants={itemVariants} className={styles.cta}>
                                <Link 
                                    to={content.ctaLink || "/#experience"}
                                    onClick={(e) => {
                                        trackEvent('hero_cta_clicked', { link: content.ctaLink || "#experience" });
                                        handleSectionLinkClick(e, content.ctaLink || '#experience');
                                    }}
                                    className={styles.ctaButton}
                                >
                                    {content.ctaText || t('hero.defaultCta')}
                                    <Download size={18} />
                                </Link>
                                <Link 
                                    to="/#contact"
                                    onClick={(e) => {
                                        trackEvent('hero_contact_clicked');
                                        handleSectionLinkClick(e, '#contact');
                                    }}
                                    className={styles.ctaSecondary}
                                >
                                    {t('hero.contactCta')}
                                    <Send size={18} />
                                </Link>
                            </motion.div>
                        </>
                    )}
                </motion.div>
                <motion.div variants={itemVariants} className={styles.imageWrapper}>
                    <div className={styles.imageContainer}>
                        <div className={styles.imageGlow} />
                        {(content.profileImageUrl || loading) && (
                            <img
                                src={content.profileImageUrl || "https://ui-avatars.com/api/?name=Kem+Phearum&background=6C63FF&color=fff&size=350"}
                                alt={t('common.profile')}
                                className={styles.profileImage}
                                width="320"
                                height="320"
                            />
                        )}
                        <div className={styles.imageRing} />
                    </div>
                </motion.div>
            </motion.div>

            <motion.div
                className={styles.scrollIndicator}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
            >
                <div className={styles.mouse}>
                    <div className={styles.wheel} />
                </div>
            </motion.div>
        </section>
    );
};

export default Hero;
