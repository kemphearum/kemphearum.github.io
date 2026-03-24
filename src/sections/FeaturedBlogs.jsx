import React from 'react';
import { useQuery } from '@tanstack/react-query';
import BlogService from '../services/BlogService';
import styles from '../pages/Blog.module.scss';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Link } from 'react-router';

const FeaturedBlogs = () => {
    const { data: postsData, isLoading: loading } = useQuery({
        staleTime: 60000,
        gcTime: 300000,
        refetchOnWindowFocus: false,
        queryKey: ['posts'],
        queryFn: () => BlogService.getAll('createdAt', 'desc')
    });

    const posts = postsData || [];

    // Priority: Items marked as 'featured'
    let featuredList = posts.filter((p) => p.visible !== false && p.featured === true);

    // Filter: Visible posts for the "View All" count
    const visiblePosts = posts.filter((p) => p.visible !== false);

    // Fallback: If no hand-picked featured posts, show the 3 newest visible ones
    if (featuredList.length === 0) {
        featuredList = [...visiblePosts].sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
        });
    } else {
        // Even if hand-picked, sort by latest
        featuredList.sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
        });
    }

    // Always limit to 3 for consistent layout
    featuredList = featuredList.slice(0, 3);

    return (
        <section id="blog" className={styles.postsSection} style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
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
                                            <span className={styles.readMore}>Read Article -&gt;</span>
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
                        className={styles.viewAllWrap}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <Link to="/blog" className={styles.viewAllBtn}>
                            View All Blogs -&gt;
                        </Link>
                    </motion.div>
                )}
            </div>
        </section>
    );
};

export default FeaturedBlogs;

