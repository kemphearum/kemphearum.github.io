import React from 'react';
import { useQuery } from '@tanstack/react-query';
import EducationService from '../services/EducationService';
import styles from './Education.module.scss';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import MarkdownRenderer from './MarkdownRenderer';
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedField } from '../utils/localization';
import { GraduationCap } from 'lucide-react';

const Education = () => {
    const { language, t } = useTranslation();
    const { data: educationsData, isLoading: loading } = useQuery({
        staleTime: 60000,
        gcTime: 300000,
        refetchOnWindowFocus: false,
        queryKey: ['education'],
        queryFn: () => EducationService.getAll()
    });

    const educations = educationsData || [];

    // Filter and sort visible educations by year (descending)
    const visibleEducations = educations
        .filter(e => e.visible === true)
        .sort((a, b) => {
            const startA = a.startYear || 0;
            const startB = b.startYear || 0;
            return startB - startA;
        })
        .map((exp) => ({
            ...exp,
            school: getLocalizedField(exp.school, language),
            degree: getLocalizedField(exp.degree, language),
            fieldOfStudy: getLocalizedField(exp.fieldOfStudy, language),
            description: getLocalizedField(exp.description, language),
            period: getLocalizedField(exp.period, language) || exp.period
        }));

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

    if (!loading && visibleEducations.length === 0) {
        return null; // Don't show the section if it's empty
    }

    return (
        <section id="education" className={styles.section}>
            <div className={styles.container}>
                <motion.h2
                    className={styles.sectionTitle}
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    {t('education.title')}
                </motion.h2>

                {loading ? (
                    <div className={styles.timeline}>
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className={styles.timelineItem}>
                                <div className={styles.skeletonCard}>
                                    <div className={styles.skeletonLine} style={{ width: '60%', height: '24px' }} />
                                    <div className={styles.skeletonLine} style={{ width: '40%', height: '16px' }} />
                                    <div className={styles.skeletonLine} style={{ width: '30%', height: '14px' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.timeline}>
                        {visibleEducations.map((exp, index) => (
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
                                        <h3 className={styles.degree}>
                                            {exp.degree}
                                            {exp.fieldOfStudy ? ` in ${exp.fieldOfStudy}` : ''}
                                        </h3>
                                        <div className={styles.meta}>
                                            <span className={styles.school}>
                                                <GraduationCap size={16} style={{ marginRight: '8px' }} />
                                                {exp.school}
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
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default Education;
