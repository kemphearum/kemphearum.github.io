import React from 'react';
import { useQuery } from '@tanstack/react-query';
import ProjectService from '../services/ProjectService';
import ProjectCard from './ProjectCard';
import styles from './Projects.module.scss';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Link } from 'react-router';
import { useTranslation } from '../hooks/useTranslation';

const FeaturedProjects = () => {
    const { t } = useTranslation();
    const { data: projectsData, isLoading: loading } = useQuery({
        staleTime: 60000,
        gcTime: 300000,
        refetchOnWindowFocus: false,
        queryKey: ['projects'],
        queryFn: () => ProjectService.getAll('createdAt', 'desc')
    });

    const projects = projectsData || [];

    // Priority: Items marked as 'featured'
    let featuredList = projects.filter((p) => p.visible !== false && p.featured === true);

    // Filter: Visible projects for the "View All" count
    const visibleProjects = projects.filter((p) => p.visible !== false);

    // Fallback: If no hand-picked featured projects, show the 3 newest visible ones
    if (featuredList.length === 0) {
        featuredList = [...visibleProjects].sort((a, b) => {
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
        <section id="projects" className={styles.section}>
            <div className={styles.container}>
                <motion.h2
                    className="section-title"
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    {t('featuredProjects.title')}
                </motion.h2>

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
                    <motion.div className={styles.grid}>
                        {featuredList.length > 0 ? (
                            featuredList.map((project) => (
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
                            <div className={styles.empty}>
                                <p>{t('featuredProjects.empty')}</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {!loading && visibleProjects.length > 3 && (
                    <motion.div
                        className={styles.viewAllWrap}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <Link to="/projects" className={styles.viewAllBtn}>
                            {t('featuredProjects.viewAll')}
                        </Link>
                    </motion.div>
                )}
            </div>
        </section>
    );
};

export default FeaturedProjects;

