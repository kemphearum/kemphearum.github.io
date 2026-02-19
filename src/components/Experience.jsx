import React from 'react';
import { useFirebaseCollection } from '../hooks/useFirebaseData';
import styles from './Experience.module.scss';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const Experience = () => {
    const { data: experiences, loading } = useFirebaseCollection('experience', 'createdAt', 'desc');

    // Only show visible experiences
    const visibleExperiences = experiences.filter(e => e.visible !== false);

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
                                            {exp.description ? exp.description.split('\n').map((line, i) => (
                                                line.trim() && <p key={i} className={styles.descLine}>
                                                    <span className={styles.bullet}>▹</span>
                                                    {line.trim().startsWith('•') ? line.substring(1).trim() : line.trim()}
                                                </p>
                                            )) : null}
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
