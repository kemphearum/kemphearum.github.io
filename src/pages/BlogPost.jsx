import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import BlogService from '../services/BlogService';
import { useActivity } from '../hooks/useActivity';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { calculateReadTime } from '../utils/helpers';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowUp, X, Calendar, Clock, Tag,
    Share2, Copy, Check, ArrowLeft, ChevronRight,
    Facebook, Instagram, Linkedin
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

import RelatedArticles from '../components/RelatedArticles';
import styles from './BlogPost.module.scss';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function loader({ params }) {
    const q = query(collection(db, 'posts'), where("slug", "==", params.slug));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data();
    }
    return null;
}

export function meta({ data }) {
    if (!data) return [{ title: "Post Not Found | Kem Phearum" }];
    const tags = [
        { title: `${data.title} | Blog - Kem Phearum` },
        { name: "description", content: data.excerpt || 'Read this article by Kem Phearum' },
        { property: "og:title", content: data.title },
        { property: "og:description", content: data.excerpt },
        { property: "og:type", content: "article" },
    ];
    if (data.coverImage) {
        tags.push({ property: "og:image", content: data.coverImage });
    }
    return tags;
}

const BlogPost = () => {
    const { slug } = useParams();
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [readProgress, setReadProgress] = useState(0);
    const [copied, setCopied] = useState(false);
    const [instaCopied, setInstaCopied] = useState(false);
    const { trackRead } = useActivity();

    const { data: post, isLoading: loading, isError } = useQuery({
        queryKey: ['post', slug],
        queryFn: async () => {
            const postData = await BlogService.fetchPostBySlug(slug, trackRead);
            if (!postData) throw new Error('Post not found');
            trackRead(0, `Viewed blog: ${postData.title}`);
            return postData;
        },
        retry: false
    });

    const error = isError ? 'Failed to load post details' : null;

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
                    title: post.title,
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
        if (!timestamp?.seconds) return 'Recently Published';
        return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
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
                            <p>{error || "Post not found"}</p>
                            <Link to="/blog" className={styles.backBtn}>
                                <ArrowLeft size={16} /> Back to Blog
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
                        <Link to="/blog"><ArrowLeft size={14} /> Blog</Link>
                        <ChevronRight size={14} className={styles.separator} />
                        <span className={styles.current}>{post.title}</span>
                    </motion.nav>

                    {/* Contained Featured Image */}
                    <motion.div
                        className={styles.featuredImage}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                    >
                        {coverImg ? (
                            <img src={coverImg} alt={post.title} />
                        ) : (
                            <div className={styles.heroPlaceholder}>
                                <span>{post.title}</span>
                            </div>
                        )}
                        <div className={styles.imageOverlay} />
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
                            <h1 className={styles.articleTitle}>{post.title}</h1>

                            <div className={styles.markdownBody}>
                                <MarkdownRenderer content={post.content} />
                            </div>



                            {/* Related Articles */}
                            <div className={styles.bottomSection}>
                                <RelatedArticles currentPostId={post.id} tags={post.tags} />

                                <div className={styles.shareCta}>
                                    <h3>Thanks for reading!</h3>
                                    <Link to="/blog" className={styles.backBtn}>
                                        <ArrowLeft size={16} /> Read More Articles
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
                            {/* Article Info */}
                            <div className={styles.sidebarCard}>
                                <h4>Article Info</h4>
                                <div className={styles.infoList}>
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}><Calendar size={14} /> Published</span>
                                        <span className={styles.value}>{formatDate(post.createdAt)}</span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}><Clock size={14} /> Read Time</span>
                                        <span className={styles.value}>{calculateReadTime(post.content)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Tags */}
                            {post.tags && post.tags.length > 0 && (
                                <div className={styles.sidebarCard}>
                                    <h4>Tags</h4>
                                    <div className={styles.tagsList}>
                                        {post.tags.map((tag, idx) => (
                                            <span key={idx} className={styles.tagChip}>#{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Share */}
                            <div className={styles.sidebarCard}>
                                <h4>Share Article</h4>
                                <div className={styles.shareButtons}>
                                    <button
                                        className={`${styles.shareBtn} ${copied ? styles.copied : ''}`}
                                        onClick={handleCopyLink}
                                        aria-label="Copy link"
                                    >
                                        {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Link</>}
                                    </button>
                                    <button
                                        className={`${styles.shareBtn} ${styles.shareFacebook}`}
                                        onClick={shareToFacebook}
                                        aria-label="Share on Facebook"
                                    >
                                        <Facebook size={14} /> Share on Facebook
                                    </button>
                                    <button
                                        className={`${styles.shareBtn} ${styles.shareInstagram} ${instaCopied ? styles.copied : ''}`}
                                        onClick={shareToInstagram}
                                        aria-label="Share on Instagram"
                                    >
                                        {instaCopied ? <><Check size={14} /> Link Copied!</> : <><Instagram size={14} /> Share on Instagram</>}
                                    </button>
                                    <button
                                        className={`${styles.shareBtn} ${styles.shareLinkedIn}`}
                                        onClick={shareToLinkedIn}
                                        aria-label="Share on LinkedIn"
                                    >
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
                        className={styles.scrollTopBtn}
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

            <Footer />
        </>
    );
};

export default BlogPost;
