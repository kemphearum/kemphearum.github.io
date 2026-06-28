import React from 'react';
import { useQuery } from '@tanstack/react-query';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Briefcase, Award, FolderGit2, ShieldCheck } from 'lucide-react';
import styles from './CareerHighlights.module.scss';
import { useTranslation } from '../hooks/useTranslation';
import ExperienceService from '../services/ExperienceService';
import ProjectService from '../services/ProjectService';
import CertificateService from '../services/CertificateService';
import SkillService from '../services/SkillService';
import { filterPublished } from '../domain/shared/contentStatus';

const CareerHighlights = () => {
    const { t } = useTranslation();

    const { data: experiencesData } = useQuery({
        staleTime: 60000,
        gcTime: 300000,
        refetchOnWindowFocus: false,
        queryKey: ['experience'],
        queryFn: () => ExperienceService.getAll()
    });

    const { data: projectsData } = useQuery({
        staleTime: 60000,
        gcTime: 300000,
        refetchOnWindowFocus: false,
        queryKey: ['projects'],
        queryFn: () => ProjectService.getAll()
    });

    const { data: certificatesData } = useQuery({
        staleTime: 60000,
        gcTime: 300000,
        refetchOnWindowFocus: false,
        queryKey: ['certificates'],
        queryFn: () => CertificateService.getAll()
    });

    const { data: skillsData } = useQuery({
        staleTime: 60000,
        gcTime: 300000,
        refetchOnWindowFocus: false,
        queryKey: ['skills'],
        queryFn: () => SkillService.getAll()
    });

    // Calculate stats
    const yearsOfExp = React.useMemo(() => {
        const visible = filterPublished(experiencesData || []);
        if (!visible.length) return 0;
        let minYear = 9999;
        let maxYear = 0;
        visible.forEach(exp => {
            if (!exp.period) return;
            const years = exp.period.match(/[12]\d{3}/g);
            if (years) {
                years.forEach(y => {
                    const yearNum = Number(y);
                    if (yearNum < minYear) minYear = yearNum;
                    if (yearNum > maxYear) maxYear = yearNum;
                });
            }
            if (exp.period.toLowerCase().includes('present')) {
                maxYear = new Date().getFullYear();
            }
        });
        if (minYear === 9999) return 0;
        return maxYear - minYear;
    }, [experiencesData]);

    const projectsCount = filterPublished(projectsData || []).length;
    const certsCount = filterPublished(certificatesData || []).length;
    
    // Count advanced/expert skills
    const advancedSkillsCount = filterPublished(skillsData || []).filter(s => s.level === 'advanced' || s.level === 'expert').length;

    const stats = [
        {
            icon: <Briefcase size={24} />,
            value: yearsOfExp > 0 ? `${yearsOfExp}+` : '-',
            label: t('career.stats.years', 'Years Experience')
        },
        {
            icon: <FolderGit2 size={24} />,
            value: projectsCount > 0 ? projectsCount : '-',
            label: t('career.stats.projects', 'Projects Delivered')
        },
        {
            icon: <Award size={24} />,
            value: certsCount > 0 ? certsCount : '-',
            label: t('career.stats.certifications', 'Certifications')
        },
        {
            icon: <ShieldCheck size={24} />,
            value: advancedSkillsCount > 0 ? `${advancedSkillsCount}+` : '-',
            label: t('career.stats.coreSkills', 'Core Skills')
        }
    ];

    if (!experiencesData && !projectsData && !certificatesData) return null;

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.grid}>
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            className={styles.statCard}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <div className={styles.iconWrapper}>
                                {stat.icon}
                            </div>
                            <div className={styles.statInfo}>
                                <h3 className={styles.statValue}>{stat.value}</h3>
                                <p className={styles.statLabel}>{stat.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CareerHighlights;
