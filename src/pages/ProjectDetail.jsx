import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLoaderData } from 'react-router';
import ProjectService from '../services/ProjectService';
import { useActivity } from '../hooks/useActivity';
import MarkdownRenderer from '@/sections/MarkdownRenderer';
import { generateMetaTags } from '../utils/SeoHelper';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowUp, ExternalLink, Code, X, Calendar, Clock,
    Copy, Check, ArrowLeft, Maximize2, ChevronRight,
    Facebook, Instagram, Linkedin, Send
} from 'lucide-react';
import { calculateReadTime } from '../utils/helpers';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';
import RelatedProjects from '@/sections/RelatedProjects';
import TableOfContents from '@/sections/TableOfContents';
import styles from './ProjectDetail.module.scss';
import { getLocalizedField } from '../utils/localization';
import { useTranslation } from '../hooks/useTranslation';

const getMetaLanguage = () => {
    if (typeof window === 'undefined') return 'en';
    return localStorage.getItem('portfolio.language') === 'km' ? 'km' : 'en';
};

export async function loader({ params }) {
    try {
        return await ProjectService.fetchProjectBySlug(params.slug);
    } catch (e) {
        console.error("Project detail loader failed:", e);
        return null;
    }
}

export function meta({ data }) {
    const language = getMetaLanguage();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
    if (!data) return [{ title: `${tr('Project Not Found', 'រកមិនឃើញគម្រោង')} | Kem Phearum` }];

    const title = getLocalizedField(data.title, language);
    const description = getLocalizedField(data.description, language);

    return generateMetaTags({
        title,
        description: description || tr('Project details and technical implementation.', 'ព័ត៌មានលម្អិតគម្រោង និងការអនុវត្តបច្ចេកទេស។'),
        image: data.imageUrl,
        type: 'article'
    });
}

const ProjectDetail = () => {
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

    const { data: project, isLoading: loading, isError } = useQuery({
        staleTime: 5 * 60 * 1000,
        gcTime: 300000,
        refetchOnWindowFocus: false,
        queryKey: ['project', slug],
        queryFn: async () => {
            const projectData = await ProjectService.fetchProjectBySlug(slug);
            if (!projectData) throw new Error(tr('Project not found', 'រកមិនឃើញគម្រោង'));
            trackRead(0, `Viewed project: ${getLocalizedField(projectData.title, 'en')}`);
            return projectData;
        },
        initialData: loaderData || undefined,
        retry: false
    });

    const error = isError ? tr('Failed to load project details', 'ផ្ទុកព័ត៌មានលម្អិតគម្រោងបរាជ័យ') : null;
    const localizedProject = project ? {
        ...project,
        title: getLocalizedField(project.title, language),
        description: getLocalizedField(project.description, language),
        content: getLocalizedField(project.content, language)
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

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    // Lightbox
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') setLightboxOpen(false); };
        if (lightboxOpen) {
            document.addEventListener('keydown', handleKey);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [lightboxOpen]);


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
                    title: localizedProject.title,
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
        window.open(`https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(localizedProject.title)}`, '_blank');
    };

    const formatDate = (timestamp) => {
        if (!timestamp?.seconds) return tr('Recently Added', 'ទើបបានបន្ថែម');
        return new Date(timestamp.seconds * 1000).toLocaleDateString(language === 'km' ? 'km-KH' : 'en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className={styles.detailPage}>
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

    if (error || !project) {
        return (
            <>
                <Navbar />
                <div className={styles.detailPage}>
                    <div className={styles.container}>
                        <div className={styles.errorContainer}>
                            <h2>404</h2>
                            <p>{error || tr('Project not found', 'រកមិនឃើញគម្រោង')}</p>
                            <Link to="/projects" className={styles.backBtn}>
                                <ArrowLeft size={16} /> {tr('Back to Projects', 'ត្រឡប់ទៅគម្រោង')}
                            </Link>
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    const heroImg = localizedProject.imageUrl;

    return (
        <>
            {/* Reading Progress */}
            <div className={styles.progressBar} style={{ width: `${readProgress}%` }} />

            <Navbar />

            <main className={styles.detailPage}>
                <div className={styles.container}>

                    {/* Breadcrumb */}
                    <motion.nav
                        className={styles.breadcrumb}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Link to="/projects"><ArrowLeft size={14} /> {tr('Projects', 'គម្រោង')}</Link>
                        <ChevronRight size={14} className={styles.separator} />
                        <span className={styles.current}>{localizedProject.title}</span>
                    </motion.nav>

                    {/* Contained Featured Image */}
                    <motion.div
                        className={styles.featuredImage}
                        onClick={() => heroImg && setLightboxOpen(true)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                    >
                        {heroImg ? (
                            <img src={heroImg} alt={localizedProject.title} width="1200" height="630" />
                        ) : (
                            <div className={styles.heroPlaceholder}>
                                <span>{localizedProject.title}</span>
                            </div>
                        )}
                        <div className={styles.imageOverlay} />
                        {heroImg && (
                            <span className={styles.viewHint}>
                                <Maximize2 size={12} /> {tr('View', 'មើល')}
                            </span>
                        )}
                    </motion.div>

                    {/* Two-Column Layout */}
                    <div className={styles.twoColumn}>

                        {/* LEFT: Main Content */}
                        <motion.div
                            className={styles.mainContent}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                        >
                            <h1 className={styles.projectTitle}>{localizedProject.title}</h1>
                            {localizedProject.description && (
                                <p className={styles.projectDescription}>{localizedProject.description}</p>
                            )}

                            <div className={styles.markdownBody}>
                                <MarkdownRenderer content={localizedProject.content || tr('No detailed overview provided for this project yet.', 'មិនទាន់មានការពិពណ៌នាលម្អិតសម្រាប់គម្រោងនេះនៅឡើយទេ។')} />
                            </div>



                            {/* Related Projects */}
                            <RelatedProjects currentProjectId={localizedProject.id} techStack={localizedProject.techStack} />

                            <div className={styles.bottomCta}>
                                <h3>{tr('Thanks for checking out this project!', 'អរគុណសម្រាប់ការមើលគម្រោងនេះ!')}</h3>
                                <Link to="/projects" className={styles.backBtn}>
                                    <ArrowLeft size={16} /> {tr('Browse All Projects', 'មើលគម្រោងទាំងអស់')}
                                </Link>
                            </div>
                        </motion.div>

                        {/* RIGHT: Sidebar */}
                        <motion.aside
                            className={styles.sidebar}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            {/* Table of Contents */}
                            <TableOfContents content={localizedProject.content} />

                            {/* Project Info */}
                            <div className={styles.sidebarCard}>
                                <h4>{tr('Project Info', 'ព័ត៌មានគម្រោង')}</h4>
                                <div className={styles.infoList}>
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}><Calendar size={14} /> {tr('Date', 'កាលបរិច្ឆេទ')}</span>
                                        <span className={styles.value}>{formatDate(localizedProject.createdAt)}</span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}><Clock size={14} /> {tr('Read Time', 'ពេលអាន')}</span>
                                        <span className={styles.value}>{calculateReadTime(localizedProject.content || '')}</span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}>{tr('Status', 'ស្ថានភាព')}</span>
                                        {localizedProject.liveUrl ? (
                                            <span className={styles.statusLive}>{tr('Live', 'កំពុងដំណើរការ')}</span>
                                        ) : (
                                            <span className={styles.value}>{localizedProject.githubUrl ? tr('Open Source', 'ប្រភពបើកចំហ') : tr('In Progress', 'កំពុងអភិវឌ្ឍ')}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Tech Stack */}
                            {localizedProject.techStack && localizedProject.techStack.length > 0 && (
                                <div className={styles.sidebarCard}>
                                    <h4>{tr('Tech Stack', 'បច្ចេកវិទ្យាប្រើប្រាស់')}</h4>
                                    <div className={styles.techTags}>
                                        {localizedProject.techStack.map((tech, idx) => (
                                            <span key={idx} className={styles.techChip}>{tech}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            {(localizedProject.liveUrl || localizedProject.githubUrl) && (
                                <div className={styles.sidebarCard}>
                                    <h4>{tr('Links', 'តំណភ្ជាប់')}</h4>
                                    <div className={styles.sidebarActions}>
                                        {localizedProject.liveUrl && (
                                            <a href={localizedProject.liveUrl} target="_blank" rel="noopener noreferrer" className={styles.actionBtnPrimary}>
                                                <ExternalLink size={16} /> {tr('Live Demo', 'សាកល្បងផ្ទាល់')}
                                            </a>
                                        )}
                                        {localizedProject.githubUrl && (
                                            <a href={localizedProject.githubUrl} target="_blank" rel="noopener noreferrer" className={styles.actionBtnSecondary}>
                                                <Code size={16} /> {tr('Source Code', 'កូដប្រភព')}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Share */}
                            <div className={styles.sidebarCard}>
                                <h4>{tr('Share Project', 'ចែករំលែកគម្រោង')}</h4>
                                <div className={styles.shareButtons}>
                                    <button className={`${styles.shareBtn} ${copied ? styles.copied : ''}`} onClick={handleCopyLink} aria-label={tr('Copy link', 'ចម្លងតំណ')}>
                                        {copied
                                            ? <><Check size={14} /> {tr('Copied!', 'បានចម្លង!')}</>
                                            : <><Copy size={14} /> {tr('Copy Link', 'ចម្លងតំណ')}</>}
                                    </button>
                                    <button className={`${styles.shareBtn} ${styles.shareFacebook}`} onClick={shareToFacebook} aria-label={tr('Share on Facebook', 'ចែករំលែកលើ Facebook')}>
                                        <Facebook size={14} /> {tr('Share on Facebook', 'ចែករំលែកលើ Facebook')}
                                    </button>
                                    <button className={`${styles.shareBtn} ${styles.shareInstagram} ${instaCopied ? styles.copied : ''}`} onClick={shareToInstagram} aria-label={tr('Share on Instagram', 'ចែករំលែកលើ Instagram')}>
                                        {instaCopied
                                            ? <><Check size={14} /> {tr('Link Copied!', 'បានចម្លងតំណ!')}</>
                                            : <><Instagram size={14} /> {tr('Share on Instagram', 'ចែករំលែកលើ Instagram')}</>}
                                    </button>
                                    <button className={`${styles.shareBtn} ${styles.shareLinkedIn}`} onClick={shareToLinkedIn} aria-label={tr('Share on LinkedIn', 'ចែករំលែកលើ LinkedIn')}>
                                        <Linkedin size={14} /> {tr('Share on LinkedIn', 'ចែករំលែកលើ LinkedIn')}
                                    </button>
                                    <button className={`${styles.shareBtn} ${styles.shareTelegram}`} onClick={shareToTelegram} aria-label={tr('Share on Telegram', 'ចែករំលែកលើ Telegram')}>
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
                        className={styles.scrollTop}
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
                        <button className={styles.lightboxClose} onClick={() => setLightboxOpen(false)} aria-label={tr('Close', 'បិទ')}>
                            <X size={22} />
                        </button>
                        <motion.img
                            src={heroImg}
                            alt={localizedProject.title}
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

export default ProjectDetail;
