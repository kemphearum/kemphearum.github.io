
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from './BlogPost.module.scss';
import rehypeRaw from 'rehype-raw';

const BlogPost = () => {
    const { slug } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                // Try to find by slug first
                const q = query(collection(db, "posts"), where("slug", "==", slug));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const docData = querySnapshot.docs[0].data();
                    setPost({ id: querySnapshot.docs[0].id, ...docData });
                } else {
                    // Fallback: try by ID if slug fails (backward compatibility)
                    // But we won't implement that for now to keep clean URLs
                    setError('Post not found');
                }
            } catch (err) {
                console.error("Error fetching post:", err);
                setError('Failed to load post');
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchPost();
    }, [slug]);

    if (loading) {
        return (
            <>
                <Navbar />
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                </div>
                <Footer />
            </>
        );
    }

    if (error || !post) {
        return (
            <>
                <Navbar />
                <div className={styles.errorContainer}>
                    <h2>404</h2>
                    <p>{error || "Post not found"}</p>
                    <Link to="/blog" className={styles.backBtn}>← Back to Blog</Link>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Navbar />
            <motion.article
                className={styles.articlePage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div className={styles.heroImage} style={{ backgroundImage: `url(${post.coverImage || ''})` }}>
                    <div className={styles.overlay}></div>
                    <div className={styles.heroContent}>
                        <div className={styles.container}>
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Link to="/blog" className={styles.backLink}>← Back to Blog</Link>
                                <div className={styles.meta}>
                                    <span>{post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                                    {post.tags && post.tags.length > 0 && <span className={styles.tag}>{post.tags[0]}</span>}
                                </div>
                                <h1>{post.title}</h1>
                            </motion.div>
                        </div>
                    </div>
                </div>

                <div className={styles.container}>
                    <div className={styles.contentWrapper}>
                        <div className={styles.markdownContent}>
                            <ReactMarkdown rehypePlugins={[rehypeRaw]}>{post.content}</ReactMarkdown>
                        </div>

                        <div className={styles.shareSection}>
                            <h3>Thanks for reading!</h3>
                            <Link to="/blog" className={styles.backBtn}>Read More Articles</Link>
                        </div>
                    </div>
                </div>
            </motion.article>
            <Footer />
        </>
    );
};

export default BlogPost;
