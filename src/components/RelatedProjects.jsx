import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProjectService from '../services/ProjectService';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import ProjectCard from './ProjectCard';
import styles from './RelatedProjects.module.scss';

const RelatedProjects = ({ currentProjectId, techStack }) => {
    const [relatedProjects, setRelatedProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRelatedProjects = async () => {
            setLoading(true);
            try {
                // Fetch using new ProjectService endpoint
                const projectsData = await ProjectService.fetchRelatedProjects(currentProjectId, techStack, null);
                setRelatedProjects(projectsData);
            } catch (error) {
                console.error("Error fetching related projects:", error);
            } finally {
                setLoading(false);
            }
        };

        if (currentProjectId) {
            fetchRelatedProjects();
        }
    }, [currentProjectId, techStack]);

    if (loading || relatedProjects.length === 0) return null;

    return (
        <div className={styles.relatedSection}>
            <div className={styles.header}>
                <h3>Related Projects</h3>
                <div className={styles.divider}></div>
            </div>

            <div className={styles.grid}>
                {relatedProjects.map((project, index) => (
                    <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1, duration: 0.4 }}
                    >
                        <ProjectCard project={project} />
                    </motion.div>
                ))}
            </div>

            <Link to="/projects" className={styles.viewAllLink}>
                View All Projects <span>→</span>
            </Link>
        </div>
    );
};

export default RelatedProjects;
