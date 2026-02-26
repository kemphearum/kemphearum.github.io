import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import styles from './RelatedArticles.module.scss'; // Reuse blog card styles where possible or create new

const RelatedArticles = ({ currentPostId, tags }) => {
    const [relatedPosts, setRelatedPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRelatedPosts = async () => {
            setLoading(true);
            try {
                let postsData = [];

                // A complex query with 'array-contains-any' and 'orderBy' requires a custom Firestore Index.
                // To avoid breaking the app deployment flow for the user, we fetch the visible posts 
                // and locally sort/filter them. It's efficient enough for a portfolio blog.
                const q = query(
                    collection(db, "posts"),
                    where("visible", "==", true)
                );

                const querySnapshot = await getDocs(q);
                let allVisiblePosts = querySnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(post => post.id !== currentPostId); // Exclude the current post

                // Sort by createdAt descending locally
                allVisiblePosts.sort((a, b) => {
                    const timeA = a.createdAt?.seconds || 0;
                    const timeB = b.createdAt?.seconds || 0;
                    return timeB - timeA;
                });

                if (tags && tags.length > 0) {
                    // Try to find posts with matching tags
                    postsData = allVisiblePosts.filter(post =>
                        post.tags && post.tags.some(t => tags.includes(t))
                    );
                }

                // If we found matches, slice to 3. If no matches or no tags provided, just use the 3 most recent
                if (postsData.length > 0) {
                    postsData = postsData.slice(0, 3);
                } else {
                    postsData = allVisiblePosts.slice(0, 3);
                }

                setRelatedPosts(postsData);
            } catch (error) {
                console.error("Error fetching related articles:", error);
            } finally {
                setLoading(false);
            }
        };

        if (currentPostId) {
            fetchRelatedPosts();
        }
    }, [currentPostId, tags]);

    if (loading || relatedPosts.length === 0) return null;

    return (
        <div className={styles.relatedSection}>
            <div className={styles.header}>
                <h3>Related Articles</h3>
                <div className={styles.divider}></div>
            </div>

            <div className={styles.grid}>
                {relatedPosts.map((post, index) => (
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
