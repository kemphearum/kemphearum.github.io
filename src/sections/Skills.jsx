import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import SkillService from '../services/SkillService';
import { SectionHeader } from '@/shared/components/ui';
import styles from './Skills.module.scss';
import { useTranslation } from '../hooks/useTranslation';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { getLocalizedField } from '../utils/localization';
import { filterPublished } from '../domain/shared/contentStatus';

const LEVEL_VALUE = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };

const Skills = ({ isStandalone = false }) => {
    const { language, t } = useTranslation();
    const enabled = useFeatureFlag('showSkills');

    const { data: skillsData, isLoading } = useQuery({
        staleTime: 60000,
        gcTime: 300000,
        refetchOnWindowFocus: false,
        queryKey: ['skills'],
        queryFn: () => SkillService.getAll('createdAt', 'desc')
    });

    const grouped = useMemo(() => {
        const visible = filterPublished(skillsData || [])
            .map((skill) => ({
                ...skill,
                name: getLocalizedField(skill.name, language),
                level: skill.level || 'intermediate',
                category: (skill.category || '').trim() || t('skills.uncategorized')
            }))
            .sort((a, b) => {
                if (!!b.featured !== !!a.featured) return b.featured ? 1 : -1;
                if ((a.order || 0) !== (b.order || 0)) return (a.order || 0) - (b.order || 0);
                return a.name.localeCompare(b.name);
            });

        const byCategory = new Map();
        visible.forEach((skill) => {
            if (!byCategory.has(skill.category)) byCategory.set(skill.category, []);
            byCategory.get(skill.category).push(skill);
        });
        return Array.from(byCategory, ([category, items]) => ({ category, items }));
    }, [skillsData, language, t]);

    if (!enabled) return null;
    if (!isLoading && grouped.length === 0) return null;

    return (
        <section id="skills" className={`${styles.section} ${isStandalone ? styles.standalone : ''}`}>
            <div className={styles.container}>
                <SectionHeader title={t('skills.title')} subtitle={t('skills.subtitle')} />

                {isLoading ? (
                    <div className={styles.grid}>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className={styles.skeletonCard} />
                        ))}
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {grouped.map((group, index) => (
                            <motion.div
                                key={group.category}
                                className={styles.categoryCard}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.2 }}
                                transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
                            >
                                <h3 className={styles.categoryTitle}>{group.category}</h3>
                                <ul className={styles.skillList}>
                                    {group.items.map((skill) => (
                                        <li key={skill.id} className={styles.skill}>
                                            <div className={styles.skillMain}>
                                                {skill.iconUrl && (
                                                    <img src={skill.iconUrl} alt={`${skill.name} icon`} className={styles.skillIcon} loading="lazy" width="20" height="20" />
                                                )}
                                                <div className={styles.skillInfo}>
                                                    <span className={styles.skillName}>{skill.name}</span>
                                                    {Number(skill.yearsOfExperience) > 0 && (
                                                        <span className={styles.skillYears}>{skill.yearsOfExperience} yrs</span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={styles.levelDots} aria-label={t(`skills.levels.${skill.level}`)} title={t(`skills.levels.${skill.level}`)}>
                                                {[1, 2, 3, 4].map((dot) => (
                                                    <span
                                                        key={dot}
                                                        className={`${styles.dot} ${dot <= (LEVEL_VALUE[skill.level] || 2) ? styles.dotActive : ''}`}
                                                    />
                                                ))}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default Skills;
