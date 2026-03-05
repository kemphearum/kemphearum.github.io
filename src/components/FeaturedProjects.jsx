import React from 'react';
import { useQuery } from '@tanstack/react-query';
import ProjectService from '../services/ProjectService';
import ProjectCard from './ProjectCard';
import styles from './Projects.module.scss';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const FeaturedProjects = () => {
    const { data: projectsData, isLoading: loading } = useQuery({
        queryKey: ['projects'],
        queryFn: () => ProjectService.getAll()
    });

    const projects = projectsData || [];

    // Priority: Items marked as 'featured'
    let featuredList = projects.filter(p => p.visible !== false && p.featured === true);

    // Filter: Visible projects for the "View All" count
    const visibleProjects = projects.filter(p => p.visible !== false);

    // Fallback: If no hand-picked featured projects, show the 3 newest visible ones
    if (featuredList.length === 0) {
        featuredList = [...visibleProjects].sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
        }).slice(0, 3);
    }

    return (
        <section id="projects" className={styles.section}>
            <div className={styles.container}>
                <motion.h2
                    className="section-title"
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    Featured Projects
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
                            featuredList.map(project => (
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
                                <p>No featured projects found.</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {!loading && visibleProjects.length > 3 && (
                    <motion.div
                        style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <Link to="/projects" className={styles.viewAllBtn} style={{
                            padding: '0.8rem 2rem',
                            borderRadius: '50px',
                            background: 'var(--glass-surface)',
                            border: '1px solid var(--glass-border)',
                            color: 'white',
                            textDecoration: 'none',
                            fontWeight: '500',
                            transition: 'all 0.3s ease'
                        }}>
                            View All Projects →
                        </Link>
                    </motion.div>
                )}
            </div>
        </section>
    );
};

export default FeaturedProjects;
