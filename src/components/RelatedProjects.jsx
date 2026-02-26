import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
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
                const q = query(
                    collection(db, "projects"),
                    where("visible", "==", true)
                );

                const querySnapshot = await getDocs(q);
                let allVisibleProjects = querySnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(project => project.id !== currentProjectId);

                // Sort by createdAt descending
                allVisibleProjects.sort((a, b) => {
                    const timeA = a.createdAt?.seconds || 0;
                    const timeB = b.createdAt?.seconds || 0;
                    return timeB - timeA;
                });

                let projectsData = [];

                if (techStack && techStack.length > 0) {
                    // Find projects with matching tech stack
                    projectsData = allVisibleProjects.filter(project =>
                        project.techStack && project.techStack.some(t => techStack.includes(t))
                    );
                }

                // Use matches if found, otherwise fall back to newest
                if (projectsData.length > 0) {
                    projectsData = projectsData.slice(0, 3);
                } else {
                    projectsData = allVisibleProjects.slice(0, 3);
                }

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
