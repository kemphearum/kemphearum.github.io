import React, { useState } from 'react';
import { useFirebaseCollection, useFirebaseDoc } from '../hooks/useFirebaseData';
import ProjectCard from './ProjectCard';
import styles from './Projects.module.scss';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const Projects = () => {
    const { data: projects, loading } = useFirebaseCollection('projects', 'createdAt', 'asc');
    const { data: settings } = useFirebaseDoc('content', 'settings');
    const [filter, setFilter] = useState('All');

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

    const filteredProjects = filter === 'All'
        ? visibleProjects
        : visibleProjects.filter(p => Array.isArray(p.techStack) && p.techStack.some(t => t.trim() === filter));








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

                {!loading && visibleProjects.length > 0 && (
                    <motion.div
                        className={styles.filters}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        <button
                            className={`${styles.filterBtn} ${filter === 'All' ? styles.active : ''}`}
                            onClick={() => setFilter('All')}
                        >
                            All
                        </button>
                        {displayTags.map(tag => (
                            <button
                                key={tag}
                                className={`${styles.filterBtn} ${filter === tag ? styles.active : ''}`}
                                onClick={() => setFilter(tag)}
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
                        {filteredProjects.length > 0 ? (
                            filteredProjects.map(project => (
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
                                <p>No projects match this filter.</p>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {!loading && visibleProjects.length === 0 && (
                    <div className={styles.empty}>
                        <p>No projects found yet.</p>
                        <p className={styles.hint}>Visit /admin to add projects.</p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default Projects;
