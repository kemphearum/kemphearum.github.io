import React, { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import ProjectCard from './ProjectCard';
import styles from './Projects.module.scss';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                // Query projects
                const q = query(collection(db, "projects"));
                const querySnapshot = await getDocs(q);
                const projectsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setProjects(projectsData);
            } catch (error) {
                console.error("Error fetching projects: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    return (
        <section id="projects" className={styles.section}>
            <div className={styles.container}>
                <h2 className="section-title">Featured Projects</h2>

                {loading ? (
                    <div className={styles.loading}>Loading projects...</div>
                ) : (
                    <div className={styles.grid}>
                        {projects.length > 0 ? (
                            projects.map(project => (
                                <ProjectCard key={project.id} project={project} /> // Ensure ProjectCard is correctly imported
                            ))
                        ) : (
                            <div className={styles.empty}>
                                <p>No projects found yet.</p>
                                <p className={styles.hint}>Visit /admin to add projects.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

export default Projects;
