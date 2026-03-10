import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProjectService from '../services/ProjectService';
import { useActivity } from '../hooks/useActivity';
import { Helmet } from 'react-helmet-async';
import MarkdownRenderer from '../components/MarkdownRenderer';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowUp, ExternalLink, Code, X, Calendar,
    Share2, Copy, Check, ArrowLeft, Maximize2, ChevronRight,
    Facebook, Instagram, Linkedin
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import RelatedProjects from '../components/RelatedProjects';
import styles from './ProjectDetail.module.scss';

const ProjectDetail = () => {
    const { slug } = useParams();
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [readProgress, setReadProgress] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [instaCopied, setInstaCopied] = useState(false);
    const { trackRead } = useActivity();

    const { data: project, isLoading: loading, isError } = useQuery({
        queryKey: ['project', slug],
        queryFn: async () => {
            const projectData = await ProjectService.fetchProjectBySlug(slug);
            if (!projectData) throw new Error('Project not found');
            trackRead(0, `Viewed project: ${projectData.title}`);
            return projectData;
        },
        retry: false
    });

    const error = isError ? 'Failed to load project details' : null;

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


    // Share helpers
    const currentUrl = window.location.href;
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
                    title: project.title,
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

    const formatDate = (timestamp) => {
        if (!timestamp?.seconds) return 'Recently Added';
        return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
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
                            <p>{error || "Project not found"}</p>
                            <Link to="/projects" className={styles.backBtn}>
                                <ArrowLeft size={16} /> Back to Projects
                            </Link>
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    const heroImg = project.imageUrl;

    return (
        <>
            <Helmet>
                <title>{project.title} | Projects - Kem Phearum</title>
                <meta name="description" content={project.description || 'Project details'} />
                <meta property="og:title" content={project.title} />
                <meta property="og:description" content={project.description} />
                <meta property="og:type" content="article" />
                {project.imageUrl && <meta property="og:image" content={project.imageUrl} />}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={project.title} />
                <meta name="twitter:description" content={project.description} />
                {project.imageUrl && <meta name="twitter:image" content={project.imageUrl} />}
            </Helmet>

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
                        <Link to="/projects"><ArrowLeft size={14} /> Projects</Link>
                        <ChevronRight size={14} className={styles.separator} />
                        <span className={styles.current}>{project.title}</span>
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
                            <img src={heroImg} alt={project.title} />
                        ) : (
                            <div className={styles.heroPlaceholder}>
                                <span>{project.title}</span>
                            </div>
                        )}
                        <div className={styles.imageOverlay} />
                        {heroImg && (
                            <span className={styles.viewHint}>
                                <Maximize2 size={12} /> View
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
                            <h1 className={styles.projectTitle}>{project.title}</h1>
                            {project.description && (
                                <p className={styles.projectDescription}>{project.description}</p>
                            )}

                            <div className={styles.markdownBody}>
                                <MarkdownRenderer content={project.content || 'No detailed overview provided for this project yet.'} />
                            </div>



                            {/* Related Projects */}
                            <RelatedProjects currentProjectId={project.id} techStack={project.techStack} />

                            <div className={styles.bottomCta}>
                                <h3>Thanks for checking out this project!</h3>
                                <Link to="/projects" className={styles.backBtn}>
                                    <ArrowLeft size={16} /> Browse All Projects
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
                            {/* Project Info */}
                            <div className={styles.sidebarCard}>
                                <h4>Project Info</h4>
                                <div className={styles.infoList}>
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}><Calendar size={14} /> Date</span>
                                        <span className={styles.value}>{formatDate(project.createdAt)}</span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}>Status</span>
                                        {project.liveUrl ? (
                                            <span className={styles.statusLive}>Live</span>
                                        ) : (
                                            <span className={styles.value}>{project.githubUrl ? 'Open Source' : 'In Progress'}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Tech Stack */}
                            {project.techStack && project.techStack.length > 0 && (
                                <div className={styles.sidebarCard}>
                                    <h4>Tech Stack</h4>
                                    <div className={styles.techTags}>
                                        {project.techStack.map((tech, idx) => (
                                            <span key={idx} className={styles.techChip}>{tech}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            {(project.liveUrl || project.githubUrl) && (
                                <div className={styles.sidebarCard}>
                                    <h4>Links</h4>
                                    <div className={styles.sidebarActions}>
                                        {project.liveUrl && (
                                            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className={styles.actionBtnPrimary}>
                                                <ExternalLink size={16} /> Live Demo
                                            </a>
                                        )}
                                        {project.githubUrl && (
                                            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className={styles.actionBtnSecondary}>
                                                <Code size={16} /> Source Code
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Share */}
                            <div className={styles.sidebarCard}>
                                <h4>Share Project</h4>
                                <div className={styles.shareButtons}>
                                    <button className={`${styles.shareBtn} ${copied ? styles.copied : ''}`} onClick={handleCopyLink}>
                                        {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Link</>}
                                    </button>
                                    <button className={`${styles.shareBtn} ${styles.shareFacebook}`} onClick={shareToFacebook}>
                                        <Facebook size={14} /> Share on Facebook
                                    </button>
                                    <button className={`${styles.shareBtn} ${styles.shareInstagram} ${instaCopied ? styles.copied : ''}`} onClick={shareToInstagram}>
                                        {instaCopied ? <><Check size={14} /> Link Copied!</> : <><Instagram size={14} /> Share on Instagram</>}
                                    </button>
                                    <button className={`${styles.shareBtn} ${styles.shareLinkedIn}`} onClick={shareToLinkedIn}>
                                        <Linkedin size={14} /> Share on LinkedIn
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
                        aria-label="Scroll to top"
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
                        <button className={styles.lightboxClose} onClick={() => setLightboxOpen(false)} aria-label="Close">
                            <X size={22} />
                        </button>
                        <motion.img
                            src={heroImg}
                            alt={project.title}
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
