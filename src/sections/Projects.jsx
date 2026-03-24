import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ProjectService from '../services/ProjectService';
import SettingsService from '../services/SettingsService';
import ProjectCard from './ProjectCard';
import styles from './Projects.module.scss';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedField } from '../utils/localization';

const Projects = () => {
    const { language, t } = useTranslation();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
    const ALL_FILTER = '__all__';
    const { data: projectsData, isLoading: loadingProjects } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
        queryKey: ['projects'],
        queryFn: () => ProjectService.getAll("createdAt", "desc")
    });

    const { data: globalConfig } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
        queryKey: ['settings', 'global'],
        queryFn: () => SettingsService.fetchGlobalSettings()
    });

    const settings = globalConfig?.site || globalConfig;

    const projects = (projectsData || []).map((project) => ({
        ...project,
        title: getLocalizedField(project.title, language),
        description: getLocalizedField(project.description, language),
        content: getLocalizedField(project.content, language)
    }));
    const loading = loadingProjects;
    const [filter, setFilter] = useState(ALL_FILTER);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination definitions
    const itemsPerPage = 5;
    const [currentPage, setCurrentPage] = useState(1);

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        setCurrentPage(1);
    };

    const handleSearchChange = (val) => {
        setSearchTerm(val);
        setCurrentPage(1);
    };

    // Only show visible projects (strictly check for true)
    const visibleProjects = projects.filter(p => p.visible === true);

    // Extract unique tech-stack tags for filtering (trimmed and deduped)
    const allTags = visibleProjects.reduce((acc, proj) => {
        if (Array.isArray(proj.techStack)) {
            proj.techStack.forEach(tag => {
                const trimmed = tag.trim();
                if (trimmed && !acc.includes(trimmed)) acc.push(trimmed);
            });
        }
        return acc;
    }, []);

    const displayTags = settings?.projectFilters
        ? settings.projectFilters.split(',').map(s => s.trim()).filter(s => s)
        : allTags.slice(0, 8);

    // Apply search + tag filter
    const filteredProjects = visibleProjects.filter(p => {
        const matchesSearch = searchTerm === '' ||
            p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (Array.isArray(p.techStack) && p.techStack.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));

        const matchesFilter = filter === ALL_FILTER ||
            (Array.isArray(p.techStack) && p.techStack.some(t => t.trim() === filter));

        return matchesSearch && matchesFilter;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
    const paginatedProjects = filteredProjects.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <section id="projects" className={styles.section}>
            <div className={styles.container}>
                <motion.h2
                    className="section-title"
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    {t('projects.title')}
                </motion.h2>

                {/* Search Bar */}
                <motion.div
                    className={styles.searchBar}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 }}
                >
                    <input
                        type="text"
                        id="projects-search"
                        name="projects-search"
                        placeholder={t('projects.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        aria-label={t('projects.searchAria')}
                    />
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </motion.div>

                {!loading && visibleProjects.length > 0 && (
                    <motion.div
                        className={styles.filters}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        <button
                            className={`${styles.filterBtn} ${filter === ALL_FILTER ? styles.active : ''}`}
                            onClick={() => handleFilterChange(ALL_FILTER)}
                        >
                            {t('projects.filterAll')}
                        </button>
                        {displayTags.map(tag => (
                            <button
                                key={tag}
                                className={`${styles.filterBtn} ${filter === tag ? styles.active : ''}`}
                                onClick={() => handleFilterChange(tag)}
                            >
                                {tag}
                            </button>
                        ))}
                    </motion.div>
                )}

                {loading ? (
                    <div className={styles.grid}>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className={styles.skeletonCard}>
                                <div className={styles.skeletonImage} />
                                <div className={styles.skeletonBody}>
                                    <div className={styles.skeletonLine} style={{ width: '70%', height: '22px' }} />
                                    <div className={styles.skeletonLine} style={{ width: '100%', height: '50px' }} />
                                    <div className={styles.skeletonTags}>
                                        {[...Array(3)].map((_, j) => (
                                            <div key={j} className={styles.skeletonPill} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        className={styles.grid}
                    >
                        {paginatedProjects.length > 0 ? (
                            paginatedProjects.map(project => (
                                <motion.div
                                    key={project.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <ProjectCard project={project} />
                                </motion.div>
                            ))
                        ) : (
                            <motion.div
                                className={styles.empty}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <p>{t('projects.emptyFiltered')}</p>
                            </motion.div>
                        )}
                    </motion.div>
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

                {!loading && visibleProjects.length === 0 && (
                    <div className={styles.empty}>
                        <p>{t('projects.empty')}</p>
                        <p className={styles.hint}>{t('projects.hint')}</p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default Projects;
