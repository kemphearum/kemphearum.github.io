import React from 'react';
import styles from './ProjectCard.module.scss';

const ProjectCard = ({ project }) => {
    return (
        <div className={styles.card}>
            <img src={project.imageUrl || 'https://via.placeholder.com/400x250'} alt={project.title} className={styles.image} />
            <div className={styles.content}>
                <h3 className={styles.title}>{project.title}</h3>
                <p className={styles.description}>{project.description}</p>
                <div className={styles.tags}>
                    {project.techStack && project.techStack.map((tech, index) => (
                        <span key={index} className={styles.tag}>{tech}</span>
                    ))}
                </div>
                <div className={styles.links}>
                    {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">GitHub</a>}
                    {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Live Demo</a>}
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;
