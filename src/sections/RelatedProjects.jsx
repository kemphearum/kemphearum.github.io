import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import ProjectService from '../services/ProjectService';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import ProjectCard from './ProjectCard';
import styles from './RelatedProjects.module.scss';
import { useTranslation } from '../hooks/useTranslation';

const RelatedProjects = ({ currentProjectId, techStack }) => {
    const { t } = useTranslation();
    const { data: relatedProjectsData, isLoading: loading } = useQuery({
        staleTime: 60000,
        gcTime: 300000,
        refetchOnWindowFocus: false,
        queryKey: ['relatedProjects', currentProjectId, techStack],
        queryFn: () => ProjectService.fetchRelatedProjects(currentProjectId, techStack, null),
        enabled: !!currentProjectId
    });

    const relatedProjects = relatedProjectsData || [];

    if (loading || relatedProjects.length === 0) return null;

    return (
        <div className={styles.relatedSection}>
            <div className={styles.header}>
                <h3>{t('related.projects')}</h3>
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
                {t('related.viewAllProjects')} <span>-&gt;</span>
            </Link>
        </div>
    );
};

export default RelatedProjects;

