import React from 'react';
import { useQuery } from '@tanstack/react-query';
import ContentService from '../services/ContentService';
import styles from './About.module.scss';
 
import { motion } from 'framer-motion';
import MarkdownRenderer from './MarkdownRenderer';
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedField } from '../utils/localization';
import SkillService from '../services/SkillService';
import { filterPublished } from '../domain/shared/contentStatus';

const About = () => {
    const { language, t } = useTranslation();
    const { data, isLoading: loading } = useQuery({
        staleTime: 60000,
        gcTime: 300000,
        refetchOnWindowFocus: false,
        queryKey: ['content', 'about'],
        queryFn: () => ContentService.fetchSection('about')
    });

    const { data: skillsData, isLoading: skillsLoading } = useQuery({
        staleTime: 60000,
        gcTime: 300000,
        refetchOnWindowFocus: false,
        queryKey: ['skills'],
        queryFn: () => SkillService.getAll()
    });

    const rawContent = data || {
        bio: ""
    };

    const content = {
        ...rawContent,
        bio: getLocalizedField(rawContent.bio, language)
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.06 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
    };

    return (
        <section id="about" className={styles.section}>
            <div className={styles.container}>
                <motion.h2
                    className="section-title"
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    {t('about.title')}
                </motion.h2>
                <div className={styles.content}>
                    {loading ? (
                        <div className={styles.skeletonWrapper}>
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className={styles.skeletonLine} style={{ width: `${90 - i * 15}%` }} />
                            ))}
                            <div className={styles.skeletonSkills}>
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className={styles.skeletonPill} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <motion.div
                            className={styles.text}
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                        >
                            <div className={styles.bioText}>
                                <MarkdownRenderer content={content.bio} />
                            </div>
                            <p className={styles.subtext}>{t('about.skills')}</p>
                            {skillsLoading ? (
                                <div className={styles.skeletonSkills}>
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className={styles.skeletonPill} />
                                    ))}
                                </div>
                            ) : (
                                <motion.div
                                    className={styles.skillsList}
                                    variants={containerVariants}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                >
                                    {(() => {
                                        const visible = filterPublished(skillsData || []);
                                        const featured = visible.filter((s) => s.featured || s.level === 'expert' || s.level === 'advanced');
                                        const skills = (featured.length ? featured : visible).slice(0, 15); // Show top 15
                                        
                                        return skills.map((skill) => {
                                            const text = getLocalizedField(skill.name, language) || getLocalizedField(skill.name, 'en');
                                            if (!text) return null;
                                            return (
                                                <motion.span
                                                    key={skill.id}
                                                    variants={itemVariants}
                                                    className={styles.skillTag}
                                                    whileHover={{ scale: 1.05, y: -3 }}
                                                >
                                                    {text}
                                                </motion.span>
                                            );
                                        });
                                    })()}
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default About;
