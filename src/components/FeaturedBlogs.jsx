import React from 'react';
import { useFirebaseCollection } from '../hooks/useFirebaseData';
import styles from '../pages/Blog.module.scss';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const FeaturedBlogs = () => {
    const { data: posts, loading } = useFirebaseCollection('posts', 'createdAt', 'desc');

    // Priority: Items marked as 'featured'
    let featuredList = posts.filter(p => p.visible !== false && p.featured === true);

    // Filter: Visible posts for the "View All" count
    const visiblePosts = posts.filter(p => p.visible !== false);

    // Fallback: If no hand-picked featured posts, show the 3 newest visible ones
    if (featuredList.length === 0) {
        featuredList = [...visiblePosts].sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
        }).slice(0, 3);
    }

    return (
        <section id="featured-blogs" className={styles.postsSection} style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
            <div className={styles.container}>
                <motion.h2
                    className="section-title"
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ textAlign: 'center', marginBottom: '3rem' }}
                >
                    Featured Blogs
                </motion.h2>

                {loading ? (
                    <div className={styles.grid}>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className={styles.skeletonCard} />
                        ))}
                    </div>
                ) : (
                    <motion.div className={styles.grid}>
                        {featuredList.length > 0 ? (
                            featuredList.map((post, index) => (
                                <motion.article
                                    key={post.id || `post-${index}`}
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
                            ))
                        ) : (
                            <div className={styles.emptyState}>
                                <p>No featured blogs found.</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {!loading && visiblePosts.length > 3 && (
                    <motion.div
                        style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <Link to="/blog" style={{
                            padding: '0.8rem 2rem',
                            borderRadius: '50px',
                            background: 'var(--glass-surface)',
                            border: '1px solid var(--glass-border)',
                            color: 'white',
                            textDecoration: 'none',
                            fontWeight: '500',
                            transition: 'all 0.3s ease'
                        }}>
                            View All Blogs →
                        </Link>
                    </motion.div>
                )}
            </div>
        </section>
    );
};

export default FeaturedBlogs;
