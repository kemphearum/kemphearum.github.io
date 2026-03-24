import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import BlogService from '../services/BlogService';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import styles from './RelatedArticles.module.scss'; // Reuse blog card styles where possible or create new
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedField } from '../utils/localization';

const RelatedArticles = ({ currentPostId, tags }) => {
    const { language, t } = useTranslation();
    const { data: relatedPostsData, isLoading: loading } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
        queryKey: ['relatedPosts', currentPostId, tags],
        queryFn: () => BlogService.fetchRelatedPosts(currentPostId, tags, null),
        enabled: !!currentPostId
    });

    const relatedPosts = (relatedPostsData || []).map((post) => ({
        ...post,
        title: getLocalizedField(post.title, language),
        excerpt: getLocalizedField(post.excerpt, language),
        content: getLocalizedField(post.content, language)
    }));

    if (loading || relatedPosts.length === 0) return null;

    return (
        <div className={styles.relatedSection}>
            <div className={styles.header}>
                <h3>{t('related.articles')}</h3>
                <div className={styles.divider}></div>
            </div>

            <div className={styles.grid}>
                {relatedPosts.map((post, index) => (
                    <motion.article
                        key={post.id || `related-${index}`}
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
                                <h4>{post.title}</h4>
                                <div className={styles.meta}>
                                    <span className={styles.date}>
                                        {post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : ''}
                                    </span>
                                    {post.tags && post.tags.length > 0 && (
                                        <span className={styles.tag}>{post.tags[0]}</span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    </motion.article>
                ))}
            </div>
        </div>
    );
};

export default RelatedArticles;
