
import React, { useState, useEffect } from 'react';
import { useFirebaseCollection } from '../hooks/useFirebaseData';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from './Blog.module.scss'; // We need to create this

const Blog = () => {
    const { data: posts, loading } = useFirebaseCollection('posts', 'createdAt', 'desc');
    const [searchTerm, setSearchTerm] = useState('');

    // Filter visible posts and by search term
    const visiblePosts = posts.filter(post =>
        post.visible &&
        (post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    return (
        <>
            <Navbar />
            <main className={styles.blogPage}>
                <section className={styles.hero}>
                    <div className={styles.container}>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            Blog & Insights
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            Thoughts on development, security, and tech.
                        </motion.p>

                        <motion.div
                            className={styles.searchBar}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </motion.div>
                    </div>
                </section>

                <section className={styles.postsSection}>
                    <div className={styles.container}>
                        {loading ? (
                            <div className={styles.grid}>
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className={styles.skeletonCard} />
                                ))}
                            </div>
                        ) : visiblePosts.length > 0 ? (
                            <div className={styles.grid}>
                                {visiblePosts.map((post, index) => (
                                    <motion.article
                                        key={post.id}
                                        className={styles.postCard}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Link to={`/blog/${post.slug || post.id}`} className={styles.cardLink}>
                                            <div className={styles.imageWrapper}>
                                                {post.coverImage ? (
                                                    <img src={post.coverImage} alt={post.title} loading="lazy" />
                                                ) : (
                                                    <div className={styles.placeholderImage}>
                                                        <span>{post.title.charAt(0)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className={styles.content}>
                                                <div className={styles.meta}>
                                                    <span className={styles.date}>
                                                        {post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                                    </span>
                                                    {post.tags && post.tags.length > 0 && (
                                                        <span className={styles.tag}>{post.tags[0]}</span>
                                                    )}
                                                </div>
                                                <h3>{post.title}</h3>
                                                <p>{post.excerpt}</p>
                                                <span className={styles.readMore}>Read Article →</span>
                                            </div>
                                        </Link>
                                    </motion.article>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <h3>No posts found</h3>
                                <p>Try adjusting your search terms.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
};

export default Blog;
