import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getLocalizedField } from '../utils/localization';

const getMetaLanguage = () => {
    if (typeof window === 'undefined') return 'en';
    return localStorage.getItem('portfolio.language') === 'km' ? 'km' : 'en';
};

export async function loader() {
    const docRef = doc(db, 'settings', 'global');
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
}

export function meta({ data }) {
    const language = getMetaLanguage();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
    const site = data?.site || data || {};
    const title = `${tr('Blog', 'ប្លុក')} | ${getLocalizedField(site.title, language) || "Kem Phearum"}`;
    const description = getLocalizedField(site.blogDescription || site.description, language)
        || tr("Latest thoughts, tutorials, and project updates.", "គំនិតថ្មីៗ មេរៀន និងបច្ចុប្បន្នភាពគម្រោងចុងក្រោយ។");
    return [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
    ];
}

import { useQuery } from '@tanstack/react-query';
import BlogService from '../services/BlogService';
import SettingsService from '../services/SettingsService';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Link } from 'react-router';
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';
import styles from './Blog.module.scss';
import { useTranslation } from '../hooks/useTranslation';

const Blog = () => {
    const { language, t } = useTranslation();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
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

    const posts = (postsData || []).map((post) => ({
        ...post,
        title: getLocalizedField(post.title, language),
        excerpt: getLocalizedField(post.excerpt, language),
        content: getLocalizedField(post.content, language)
    }));
    const loading = loadingPosts;
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState(null);

    const itemsPerPage = 5;
    const [currentPage, setCurrentPage] = useState(1);

    const allTags = React.useMemo(() => {
        const tags = new Set();
        posts.forEach(post => {
            if (post.visible && post.tags) {
                post.tags.forEach(tag => tags.add(tag));
            }
        });
        return Array.from(tags).sort();
    }, [posts]);

    const displayTags = React.useMemo(() => {
        const rawFilters = settings?.blogFilters;
        const localizedFilters = getLocalizedField(rawFilters, language);
        const source = Array.isArray(localizedFilters)
            ? localizedFilters.join(',')
            : String(localizedFilters ?? '');

        const parsed = source
            .replace(/\n/g, ',')
            .replace(/;/g, ',')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);

        return parsed.length > 0 ? parsed : allTags.slice(0, 8);
    }, [settings?.blogFilters, language, allTags]);

    const visiblePosts = posts.filter(post => {
        if (!post.visible) return false;

        const matchesSearch =
            post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesTag = selectedTag ? post.tags?.includes(selectedTag) : true;
        return matchesSearch && matchesTag;
    });

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
                        <motion.h2
                            className="section-title"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {t('blog.title')}
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            {t('blog.subtitle')}
                        </motion.p>

                        <motion.div
                            className={styles.searchBar}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <input
                                type="text"
                                id="blog-search"
                                name="blog-search"
                                placeholder={t('blog.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                aria-label={t('blog.searchAria')}
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
                                    {t('blog.filterAll')}
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
                                                        {post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : t('blog.justNow')}
                                                    </span>
                                                    {post.tags && post.tags.length > 0 && (
                                                        <span className={styles.tag}>{post.tags[0]}</span>
                                                    )}
                                                </div>
                                                <h3>{post.title}</h3>
                                                <p>{post.excerpt}</p>
                                                <span className={styles.readMore}>{t('blog.readMore')}</span>
                                            </div>
                                        </Link>
                                    </motion.article>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <h3>{t('blog.emptyTitle')}</h3>
                                <p>{t('blog.emptyDescription')}</p>
                            </div>
                        )}

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
                                    aria-label={tr('Previous Page', 'ទំព័រមុន')}
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
                                    aria-label={tr('Next Page', 'ទំព័របន្ទាប់')}
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
