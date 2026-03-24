
import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function loader() {
    const docRef = doc(db, 'settings', 'global');
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
}

export function meta({ data }) {
    const site = data?.site || data || {};
    const title = `Blog | ${site.title || "Kem Phearum"}`;
    return [
        { title },
        { name: "description", content: "Latest thoughts, tutorials, and project updates." },
        { property: "og:title", content: title },
    ];
}
import { useQuery } from '@tanstack/react-query';
import BlogService from '../services/BlogService';
import SettingsService from '../services/SettingsService';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';
import styles from './Blog.module.scss'; // We need to create this

const Blog = () => {
    const { data: postsData, isLoading: loadingPosts } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
        queryKey: ['posts'],
        queryFn: () => BlogService.getAll("createdAt", "desc")
    });

    const { data: globalConfig } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
        queryKey: ['settings', 'global'],
        queryFn: () => SettingsService.fetchGlobalSettings()
    });

    const settings = globalConfig?.site || globalConfig;

    const posts = postsData || [];
    const loading = loadingPosts;
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState(null);

    // Pagination
    const itemsPerPage = 5;
    const [currentPage, setCurrentPage] = useState(1);

    // Extract all unique tags from visible posts
    const allTags = React.useMemo(() => {
        const tags = new Set();
        posts.forEach(post => {
            if (post.visible && post.tags) {
                post.tags.forEach(tag => tags.add(tag));
            }
        });
        return Array.from(tags).sort();
    }, [posts]);

    const displayTags = settings?.blogFilters
        ? settings.blogFilters.split(',').map(s => s.trim()).filter(s => s)
        : allTags.slice(0, 8);

    // Filter visible posts by search term and selected tag
    const visiblePosts = posts.filter(post => {
        if (!post.visible) return false;

        const matchesSearch =
            post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesTag = selectedTag ? post.tags?.includes(selectedTag) : true;

        return matchesSearch && matchesTag;
    });

    // Reset pagination when search or filter changes
    const handleSearchChange = (val) => {
        setSearchTerm(val);
        setCurrentPage(1);
    };

    const handleTagChange = (tag) => {
        setSelectedTag(tag === selectedTag ? null : tag);
        setCurrentPage(1);
    };

    const handleAllTags = () => {
        setSelectedTag(null);
        setCurrentPage(1);
    };

    // Pagination Logic
    const totalPages = Math.ceil(visiblePosts.length / itemsPerPage);
    const paginatedPosts = visiblePosts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
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
                                onChange={(e) => handleSearchChange(e.target.value)}
                            />
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </motion.div>

                        {displayTags.length > 0 && (
                            <motion.div
                                className={styles.tagFilter}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <button
                                    className={`${styles.filterTag} ${selectedTag === null ? styles.active : ''}`}
                                    onClick={handleAllTags}
                                >
                                    All
                                </button>
                                {displayTags.map(tag => (
                                    <button
                                        key={tag}
                                        className={`${styles.filterTag} ${selectedTag === tag ? styles.active : ''}`}
                                        onClick={() => handleTagChange(tag)}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </motion.div>
                        )}
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
                        ) : paginatedPosts.length > 0 ? (
                            <div className={styles.grid}>
                                {paginatedPosts.map((post, index) => (
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
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <h3>No posts found</h3>
                                <p>Try adjusting your search terms.</p>
                            </div>
                        )}

                        {/* Pagination Controls */}
                        {!loading && totalPages > 1 && (
                            <motion.div
                                className={styles.pagination}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                <button
                                    className={styles.pageBtn}
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    aria-label="Previous Page"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                </button>

                                <div className={styles.pageNumbers}>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i + 1}
                                            className={`${styles.pageNumber} ${currentPage === i + 1 ? styles.activePage : ''}`}
                                            onClick={() => setCurrentPage(i + 1)}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    className={styles.pageBtn}
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    aria-label="Next Page"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </button>
                            </motion.div>
                        )}
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
};

export default Blog;
