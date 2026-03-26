import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLoaderData } from 'react-router';
import BlogService from '../services/BlogService';
import { useActivity } from '../hooks/useActivity';
import MarkdownRenderer from '@/sections/MarkdownRenderer';
import { calculateReadTime } from '../utils/helpers';
import { generateMetaTags } from '../utils/SeoHelper';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowUp, X, Calendar, Clock, Tag,
    Copy, Check, ArrowLeft, ChevronRight, Maximize2,
    Facebook, Instagram, Linkedin, Send
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';

import RelatedArticles from '@/sections/RelatedArticles';
import TableOfContents from '@/sections/TableOfContents';
import styles from './BlogPost.module.scss';
import { getLocalizedField } from '../utils/localization';
import { useTranslation } from '../hooks/useTranslation';

const getMetaLanguage = () => {
    if (typeof window === 'undefined') return 'en';
    return localStorage.getItem('portfolio.language') === 'km' ? 'km' : 'en';
};

export async function loader({ params }) {
    try {
        return await BlogService.fetchPostBySlug(params.slug);
    } catch (e) {
        console.error("Blog detail loader failed:", e);
        return null;
    }
}

export function meta({ data }) {
    const language = getMetaLanguage();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
    if (!data) return [{ title: `${tr('Post Not Found', 'រកមិនឃើញអត្ថបទ')} | Kem Phearum` }];

    const title = getLocalizedField(data.title, language);
    const excerpt = getLocalizedField(data.excerpt, language);
    const content = getLocalizedField(data.content, language);

    return generateMetaTags({
        title,
        description: excerpt || content?.substring(0, 160).replace(/[#*`]/g, '') + '...',
        image: data.coverImage,
        type: 'article'
    });
}

const BlogPost = () => {
    const { language } = useTranslation();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
    const { slug } = useParams();
    const loaderData = useLoaderData();
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [readProgress, setReadProgress] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [instaCopied, setInstaCopied] = useState(false);
    const { trackRead } = useActivity();

    const { data: post, isLoading: loading, isError } = useQuery({
        staleTime: 5 * 60 * 1000,
        gcTime: 300000,
        refetchOnWindowFocus: false,
        queryKey: ['post', slug],
        queryFn: async () => {
            const postData = await BlogService.fetchPostBySlug(slug, trackRead);
            if (!postData) throw new Error(tr('Post not found', 'រកមិនឃើញអត្ថបទ'));
            trackRead(0, `Viewed blog: ${getLocalizedField(postData.title, 'en')}`);
            return postData;
        },
        initialData: loaderData || undefined,
        retry: false
    });

    const error = isError ? tr('Failed to load post details', 'ផ្ទុកព័ត៌មានលម្អិតអត្ថបទបរាជ័យ') : null;
    const localizedPost = post ? {
        ...post,
        title: getLocalizedField(post.title, language),
        excerpt: getLocalizedField(post.excerpt, language),
        content: getLocalizedField(post.content, language)
    } : null;

    // Scroll tracking
    const handleScroll = useCallback(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        setReadProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
        setShowScrollTop(scrollTop > 400);
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // Lightbox Scroll Lock
    useEffect(() => {
        const handleKey = (e) => { 
            if (e.key === 'Escape') setLightboxOpen(false); 
        };
        if (lightboxOpen) {
            document.addEventListener('keydown', handleKey);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [lightboxOpen]);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    // Share helpers (SSR-safe URL construction)
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

    const handleCopyLink = () => {
        navigator.clipboard.writeText(currentUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    const shareToFacebook = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, '_blank');
    };
    const shareToInstagram = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: localizedPost.title,
                    url: currentUrl
                });
            } else {
                await navigator.clipboard.writeText(currentUrl);
                setInstaCopied(true);
                setTimeout(() => setInstaCopied(false), 2500);
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };
    const shareToLinkedIn = () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`, '_blank');
    };
    const shareToTelegram = () => {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(localizedPost.title)}`, '_blank');
    };

    const formatDate = (timestamp) => {
        if (!timestamp?.seconds) return tr('Recently Published', 'ទើបបានបោះពុម្ព');
        return new Date(timestamp.seconds * 1000).toLocaleDateString(language === 'km' ? 'km-KH' : 'en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className={styles.articlePage}>
                    <div className={styles.container}>
                        <div className={styles.loadingContainer}>
                            <div className={styles.spinner}></div>
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (error || !post) {
        return (
            <>
                <Navbar />
                <div className={styles.articlePage}>
                    <div className={styles.container}>
                        <div className={styles.errorContainer}>
                            <h2>404</h2>
                            <p>{error || tr('Post not found', 'រកមិនឃើញអត្ថបទ')}</p>
                            <Link to="/blog" className={styles.backBtn}>
                                <ArrowLeft size={16} /> {tr('Back to Blog', 'ត្រឡប់ទៅប្លុក')}
                            </Link>
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    const coverImg = post.coverImage;

    return (
        <>
            {/* Reading Progress */}
            <div className={styles.progressBar} style={{ width: `${readProgress}%` }} />

            <Navbar />

            <main className={styles.articlePage}>
                <div className={styles.container}>

                    {/* Breadcrumb */}
                    <motion.nav
                        className={styles.breadcrumb}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Link to="/blog"><ArrowLeft size={14} /> {tr('Blog', 'ប្លុក')}</Link>
                        <ChevronRight size={14} className={styles.separator} />
                        <span className={styles.current}>{localizedPost.title}</span>
                    </motion.nav>

                    <motion.div
                        className={styles.featuredImage}
                        onClick={() => coverImg && setLightboxOpen(true)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                    >
                        {coverImg ? (
                            <img src={coverImg} alt={localizedPost.title} width="1200" height="630" />
                        ) : (
                            <div className={styles.heroPlaceholder}>
                                <span>{localizedPost.title}</span>
                            </div>
                        )}
                        <div className={styles.imageOverlay} />
                        {coverImg && (
                            <span className={styles.viewHint}>
                                <Maximize2 size={12} /> {tr('View', 'មើល')}
                            </span>
                        )}
                    </motion.div>

                    {/* Two-Column Layout */}
                    <div className={styles.twoColumn}>

                        {/* LEFT: Main Content */}
                        <motion.article
                            className={styles.mainContent}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                        >
                            <h1 className={styles.articleTitle}>{localizedPost.title}</h1>

                            <div className={styles.markdownBody}>
                                <MarkdownRenderer content={localizedPost.content} />
                            </div>



                            {/* Related Articles */}
                            <div className={styles.bottomSection}>
                                <RelatedArticles currentPostId={localizedPost.id} tags={localizedPost.tags} />

                                <div className={styles.shareCta}>
                                    <h3>{tr('Thanks for reading!', 'អរគុណសម្រាប់ការអាន!')}</h3>
                                    <Link to="/blog" className={styles.backBtn}>
                                        <ArrowLeft size={16} /> {tr('Read More Articles', 'អានអត្ថបទបន្ថែម')}
                                    </Link>
                                </div>
                            </div>
                        </motion.article>

                        {/* RIGHT: Sidebar */}
                        <motion.aside
                            className={styles.sidebar}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            {/* Table of Contents */}
                            <TableOfContents content={localizedPost.content} />

                            {/* Article Info */}
                            <div className={styles.sidebarCard}>
                                <h4>{tr('Article Info', 'ព័ត៌មានអត្ថបទ')}</h4>
                                <div className={styles.infoList}>
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}><Calendar size={14} /> {tr('Published', 'បានបោះពុម្ព')}</span>
                                        <span className={styles.value}>{formatDate(post.createdAt)}</span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}><Clock size={14} /> {tr('Read Time', 'ពេលអាន')}</span>
                                        <span className={styles.value}>{calculateReadTime(localizedPost.content)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Tags */}
                            {localizedPost.tags && localizedPost.tags.length > 0 && (
                                <div className={styles.sidebarCard}>
                                    <h4>{tr('Tags', 'ស្លាក')}</h4>
                                    <div className={styles.tagsList}>
                                        {localizedPost.tags.map((tag, idx) => (
                                            <span key={idx} className={styles.tagChip}>#{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Share */}
                            <div className={styles.sidebarCard}>
                                <h4>{tr('Share Article', 'ចែករំលែកអត្ថបទ')}</h4>
                                <div className={styles.shareButtons}>
                                    <button
                                        className={`${styles.shareBtn} ${copied ? styles.copied : ''}`}
                                        onClick={handleCopyLink}
                                        aria-label={tr('Copy link', 'ចម្លងតំណ')}
                                    >
                                        {copied
                                            ? <><Check size={14} /> {tr('Copied!', 'បានចម្លង!')}</>
                                            : <><Copy size={14} /> {tr('Copy Link', 'ចម្លងតំណ')}</>}
                                    </button>
                                    <button
                                        className={`${styles.shareBtn} ${styles.shareFacebook}`}
                                        onClick={shareToFacebook}
                                        aria-label={tr('Share on Facebook', 'ចែករំលែកលើ Facebook')}
                                    >
                                        <Facebook size={14} /> {tr('Share on Facebook', 'ចែករំលែកលើ Facebook')}
                                    </button>
                                    <button
                                        className={`${styles.shareBtn} ${styles.shareInstagram} ${instaCopied ? styles.copied : ''}`}
                                        onClick={shareToInstagram}
                                        aria-label={tr('Share on Instagram', 'ចែករំលែកលើ Instagram')}
                                    >
                                        {instaCopied
                                            ? <><Check size={14} /> {tr('Link Copied!', 'បានចម្លងតំណ!')}</>
                                            : <><Instagram size={14} /> {tr('Share on Instagram', 'ចែករំលែកលើ Instagram')}</>}
                                    </button>
                                    <button
                                        className={`${styles.shareBtn} ${styles.shareLinkedIn}`}
                                        onClick={shareToLinkedIn}
                                        aria-label={tr('Share on LinkedIn', 'ចែករំលែកលើ LinkedIn')}
                                    >
                                        <Linkedin size={14} /> {tr('Share on LinkedIn', 'ចែករំលែកលើ LinkedIn')}
                                    </button>
                                    <button
                                        className={`${styles.shareBtn} ${styles.shareTelegram}`}
                                        onClick={shareToTelegram}
                                        aria-label={tr('Share on Telegram', 'ចែករំលែកលើ Telegram')}
                                    >
                                        <Send size={14} /> {tr('Share on Telegram', 'ចែករំលែកលើ Telegram')}
                                    </button>
                                </div>
                            </div>
                        </motion.aside>
                    </div>
                </div>
            </main>

            {/* Scroll To Top */}
            <AnimatePresence>
                {showScrollTop && (
                    <motion.button
                        className={styles.scrollTopBtn}
                        onClick={scrollToTop}
                        aria-label={tr('Scroll to top', 'រមូរទៅកំពូល')}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.25 }}
                    >
                        <ArrowUp size={20} />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxOpen && (
                    <motion.div
                        className={styles.lightbox}
                        onClick={() => setLightboxOpen(false)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <button 
                            className={styles.lightboxClose} 
                            onClick={() => setLightboxOpen(false)} 
                            aria-label={tr('Close', 'បិទ')}
                        >
                            <X size={22} />
                        </button>
                        <motion.img
                            src={coverImg}
                            alt={localizedPost.title}
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <Footer />
        </>
    );
};

export default BlogPost;
