import React, { useState } from 'react';
import { useFirebaseCollection } from '../hooks/useFirebaseData';
import ProjectCard from './ProjectCard';
import styles from './Projects.module.scss';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

const Projects = () => {
    const { data: projects, loading } = useFirebaseCollection('projects', 'createdAt', 'asc');
    const [filter, setFilter] = useState('All');

    // Extract unique tech-stack tags for filtering
    const allTags = projects.reduce((acc, proj) => {
        if (proj.techStack) {
            proj.techStack.forEach(tag => {
                if (!acc.includes(tag)) acc.push(tag);
            });
        }
        return acc;
    }, []);

    const filteredProjects = filter === 'All'
        ? projects
        : projects.filter(p => p.techStack && p.techStack.includes(filter));

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
    };

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

                {!loading && projects.length > 0 && (
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
                        {allTags.slice(0, 8).map(tag => (
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
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.1 }}
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredProjects.length > 0 ? (
                                filteredProjects.map(project => (
                                    <motion.div
                                        key={project.id}
                                        variants={itemVariants}
                                        layout
                                        exit={{ opacity: 0, scale: 0.9 }}
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
                        </AnimatePresence>
                    </motion.div>
                )}

                {!loading && projects.length === 0 && (
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
