import React from 'react';
import { useQuery } from '@tanstack/react-query';
import ExperienceService from '../services/ExperienceService';
import styles from './Experience.module.scss';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import MarkdownRenderer from './MarkdownRenderer';

const Experience = () => {
    const { data: experiencesData, isLoading: loading } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
        queryKey: ['experience'],
        queryFn: () => ExperienceService.getAll()
    });

    const experiences = experiencesData || [];

    // Filter and sort visible experiences by year (descending)
    const visibleExperiences = experiences
        .filter(e => e.visible === true)
        .sort((a, b) => {
            const getYear = (str) => {
                if (!str) return 0;
                if (str.toLowerCase().includes('present')) return 9999;
                const years = str.match(/[12]\d{3}/g);
                return years ? Math.max(...years.map(Number)) : 0;
            };
            return getYear(b.period) - getYear(a.period);
        });

    const cardVariants = {
        offscreen: { y: 50, opacity: 0 },
        onscreen: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                bounce: 0.3,
                duration: 0.8
            }
        }
    };

    return (
        <section id="experience" className={styles.section}>
            <div className={styles.container}>
                <motion.h2
                    className={styles.sectionTitle}
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    Work Experience
                </motion.h2>

                {loading ? (
                    <div className={styles.timeline}>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className={styles.timelineItem}>
                                <div className={styles.skeletonCard}>
                                    <div className={styles.skeletonLine} style={{ width: '60%', height: '24px' }} />
                                    <div className={styles.skeletonLine} style={{ width: '40%', height: '16px' }} />
                                    <div className={styles.skeletonLine} style={{ width: '30%', height: '14px' }} />
                                    <div className={styles.skeletonLine} style={{ width: '100%', height: '80px', marginTop: '1rem' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.timeline}>
                        {visibleExperiences.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No experience listed yet.</p>
                        ) : (
                            visibleExperiences.map((exp, index) => (
                                <motion.div
                                    key={exp.id}
                                    className={styles.timelineItem}
                                    initial="offscreen"
                                    whileInView="onscreen"
                                    viewport={{ once: true, amount: 0.2 }}
                                    variants={cardVariants}
                                    custom={index}
                                >
                                    <div className={styles.timelineDot}>
                                        <div className={styles.dotInner} />
                                    </div>
                                    <div className={styles.timelineContent}>
                                        <div className={styles.header}>
                                            <h3 className={styles.role}>{exp.role}</h3>
                                            <div className={styles.meta}>
                                                <span className={styles.company}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                                    </svg>
                                                    {exp.company}
                                                </span>
                                                <span className={styles.period}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                                                    </svg>
                                                    {exp.period}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={styles.description}>
                                            {exp.description ? (
                                                <MarkdownRenderer content={exp.description} />
                                            ) : null}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

export default Experience;
