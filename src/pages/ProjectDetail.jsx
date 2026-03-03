import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useActivity } from '../hooks/useActivity';
import { Helmet } from 'react-helmet-async';
import MarkdownRenderer from '../components/MarkdownRenderer';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowUp, ExternalLink, Code, X, Calendar,
    Share2, Copy, Check, ArrowLeft, Maximize2, ChevronRight
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import RelatedProjects from '../components/RelatedProjects';
import styles from './ProjectDetail.module.scss';

const ProjectDetail = () => {
    const { slug } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [readProgress, setReadProgress] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const { trackRead } = useActivity();

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

    // Fetch project
    useEffect(() => {
        const fetchProject = async () => {
            try {
                const q = query(collection(db, "projects"), where("slug", "==", slug));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const docData = querySnapshot.docs[0].data();
                    if (docData.visible === false) {
                        setError('Project not found');
                    } else {
                        setProject({ id: querySnapshot.docs[0].id, ...docData });
                        trackRead(querySnapshot.size, `Viewed project: ${docData.title}`);
                    }
                } else {
                    setError('Project not found');
                }
            } catch (err) {
                console.error("Error fetching project:", err);
                setError('Failed to load project details');
            } finally {
                setLoading(false);
            }
        };
        if (slug) fetchProject();
    }, [slug, trackRead]);

    // Share helpers
    const currentUrl = window.location.href;
    const handleCopyLink = () => {
        navigator.clipboard.writeText(currentUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    const shareToTwitter = () => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out "${project.title}"`)} &url=${encodeURIComponent(currentUrl)}`, '_blank');
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

    const heroImg = project.imageUrl || 'https://placehold.co/1200x600/1a1a2e/6C63FF?text=Project';

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
                        onClick={() => project.imageUrl && setLightboxOpen(true)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                    >
                        <img src={heroImg} alt={project.title} />
                        <div className={styles.imageOverlay} />
                        {project.imageUrl && (
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

                            {/* Share */}
                            <div className={styles.shareSection}>
                                <h3><Share2 size={16} /> Share this project</h3>
                                <p>Know someone who'd find this interesting?</p>
                                <div className={styles.shareButtons}>
                                    <button className={`${styles.shareBtn} ${copied ? styles.copied : ''}`} onClick={handleCopyLink}>
                                        {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Link</>}
                                    </button>
                                    <button className={`${styles.shareBtn} ${styles.shareTwitter}`} onClick={shareToTwitter}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                        Twitter
                                    </button>
                                    <button className={`${styles.shareBtn} ${styles.shareLinkedIn}`} onClick={shareToLinkedIn}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                                        LinkedIn
                                    </button>
                                </div>
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
