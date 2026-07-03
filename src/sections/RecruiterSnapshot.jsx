import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
 
import { motion } from 'framer-motion';
import { BadgeCheck, MapPin, Clock, FileText, Send, Sparkles } from 'lucide-react';
import styles from './RecruiterSnapshot.module.scss';
import ContentService from '../services/ContentService';
import CommunicationService from '../services/CommunicationService';
import SkillService from '../services/SkillService';
import CertificateService from '../services/CertificateService';
import ProjectService from '../services/ProjectService';
import ExperienceService from '../services/ExperienceService';
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedField } from '../utils/localization';
import { filterPublished } from '../domain/shared/contentStatus';
import { deriveYearsOfExperience } from '../domain/experience/experienceDomain';

const QUERY_OPTS = { staleTime: 60000, gcTime: 300000, refetchOnWindowFocus: false };
// Availability status values are defined by the Communication tab (content/contact).
const AVAILABILITY_CLASS = {
    open: 'open',
    freelance: 'freelance',
    limited: 'freelance',
    busy: 'closed'
};

const RecruiterSnapshot = () => {
    const { language, t } = useTranslation();

    const { data: profileRaw } = useQuery({ ...QUERY_OPTS, queryKey: ['content', 'profileInfo'], queryFn: () => ContentService.fetchSection('profileInfo') });
    const { data: commRaw } = useQuery({ ...QUERY_OPTS, queryKey: ['content', 'contact'], queryFn: () => CommunicationService.get() });
    const { data: skillsRaw } = useQuery({ ...QUERY_OPTS, queryKey: ['skills'], queryFn: () => SkillService.getAll() });
    const { data: certsRaw } = useQuery({ ...QUERY_OPTS, queryKey: ['certificates'], queryFn: () => CertificateService.getAll() });
    const { data: projectsRaw } = useQuery({ ...QUERY_OPTS, queryKey: ['projects'], queryFn: () => ProjectService.getAll() });
    const { data: experienceRaw } = useQuery({ ...QUERY_OPTS, queryKey: ['experience'], queryFn: () => ExperienceService.getAll() });

    const profile = profileRaw || {};
    const comm = commRaw || {};

    const coreExpertise = useMemo(() => {
        const visible = filterPublished(skillsRaw || []);
        const advanced = visible.filter((s) => s.level === 'advanced' || s.level === 'expert' || s.featured);
        return (advanced.length ? advanced : visible).slice(0, 8).map((s) => getLocalizedField(s.name, language));
    }, [skillsRaw, language]);

    const featuredProjects = useMemo(() => {
        const visible = filterPublished(projectsRaw || []);
        const featured = visible.filter((p) => p.featured);
        return (featured.length ? featured : visible).slice(0, 3).map((p) => ({ ...p, title: getLocalizedField(p.title, language) }));
    }, [projectsRaw, language]);

    const certCount = filterPublished(certsRaw || []).length;
    const years = Number(profile.yearsExperienceOverride) || deriveYearsOfExperience(filterPublished(experienceRaw || []));

    const currentRole = getLocalizedField(profile.currentRole, language);
    const summary = getLocalizedField(profile.summary, language);
    const location = getLocalizedField(profile.location, language);
    const accomplishments = Array.isArray(profile.accomplishments) ? profile.accomplishments.slice(0, 4) : [];
    const workTypes = Array.isArray(profile.workTypes) ? profile.workTypes : [];
    const industries = Array.isArray(profile.industries) ? profile.industries : [];

    // Availability + timezone are owned by the Communication tab (content/contact).
    const availabilityStatus = comm.availabilityStatus || '';
    const availabilityMessage = getLocalizedField(comm.availabilityMessage, language);
    const timezone = comm.timeZone || '';

    // Backward compatible: render nothing until a professional profile is configured.
    const hasContent = currentRole || summary || availabilityStatus || accomplishments.length > 0;
    if (!hasContent) return null;

    const availabilityClass = AVAILABILITY_CLASS[availabilityStatus] || 'open';

    return (
        <section id="recruiter" className={styles.section} aria-labelledby="recruiter-heading">
            <div className={styles.container}>
                <motion.div
                    className={styles.card}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className={styles.head}>
                        <div className={styles.headMain}>
                            <span className={styles.eyebrow}><Sparkles size={14} /> {t('recruiter.eyebrow', 'Recruiter quick view')}</span>
                            <h2 id="recruiter-heading" className={styles.title}>
                                {currentRole || t('recruiter.title', 'At a glance')}
                            </h2>
                            <ul className={styles.metaLine}>
                                {years > 0 && <li><BadgeCheck size={14} /> {t('recruiter.years', '{{count}}+ years experience').replace('{{count}}', years)}</li>}
                                {location && <li><MapPin size={14} /> {location}</li>}
                                {timezone && <li><Clock size={14} /> {timezone}</li>}
                            </ul>
                        </div>
                        {availabilityStatus && (
                            <div className={`${styles.availability} ${styles[availabilityClass]}`}>
                                <span className={styles.availabilityDot} aria-hidden="true" />
                                <div className={styles.availabilityText}>
                                    <strong>{t(`recruiter.availability.${availabilityStatus}`, 'Available')}</strong>
                                    {availabilityMessage && <span>{availabilityMessage}</span>}
                                </div>
                            </div>
                        )}
                    </div>

                    {summary && <p className={styles.summary}>{summary}</p>}

                    <div className={styles.grid}>
                        {coreExpertise.length > 0 && (
                            <div className={styles.block}>
                                <h3 className={styles.blockTitle}>{t('recruiter.coreExpertise', 'Core expertise')}</h3>
                                <div className={styles.tags}>
                                    {coreExpertise.map((skill) => <span key={skill} className={styles.tag}>{skill}</span>)}
                                </div>
                            </div>
                        )}

                        {accomplishments.length > 0 && (
                            <div className={styles.block}>
                                <h3 className={styles.blockTitle}>{t('recruiter.accomplishments', 'Recent accomplishments')}</h3>
                                <ul className={styles.bullets}>
                                    {accomplishments.map((item, i) => {
                                        const text = getLocalizedField(item, language) || getLocalizedField(item, 'en') || (typeof item === 'string' ? item : '');
                                        return text ? <li key={i}>{text}</li> : null;
                                    })}
                                </ul>
                            </div>
                        )}

                        {workTypes.length > 0 && (
                            <div className={styles.block}>
                                <h3 className={styles.blockTitle}>{t('recruiter.workTypes', 'Open to')}</h3>
                                <div className={styles.tagsRow}>
                                    {workTypes.map((w, i) => {
                                        const text = getLocalizedField(w, language) || getLocalizedField(w, 'en') || (typeof w === 'string' ? w : '');
                                        return text ? <span key={i} className={styles.tagSoft}>{text}</span> : null;
                                    })}
                                </div>
                            </div>
                        )}

                        {industries.length > 0 && (
                            <div className={styles.block}>
                                <h3 className={styles.blockTitle}>{t('recruiter.industries', 'Domain experience')}</h3>
                                <div className={styles.tagsRow}>
                                    {industries.map((ind, i) => {
                                        const text = getLocalizedField(ind, language) || getLocalizedField(ind, 'en') || (typeof ind === 'string' ? ind : '');
                                        return text ? <span key={i} className={styles.tagSoft}>{text}</span> : null;
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.statsRow}>
                        {years > 0 && <span className={styles.stat}><strong>{years}+</strong> {t('recruiter.statsYears', 'years')}</span>}
                        {certCount > 0 && <span className={styles.stat}><strong>{certCount}</strong> {t('recruiter.statsCerts', 'certifications')}</span>}
                        {featuredProjects.length > 0 && (
                            <span className={styles.statProjects}>
                                {t('recruiter.featured', 'Featured:')} {featuredProjects.map((p, i) => (
                                    <React.Fragment key={p.id}>
                                        {i > 0 && ', '}
                                        {p.slug ? <Link to={`/projects/${p.slug}`}>{getLocalizedField(p.title, language) || getLocalizedField(p.title, 'en') || p.title}</Link> : getLocalizedField(p.title, language) || getLocalizedField(p.title, 'en') || p.title}
                                    </React.Fragment>
                                ))}
                            </span>
                        )}
                    </div>

                    <div className={styles.actions}>
                        <Link to="/resume" className={styles.primaryBtn}>
                            <FileText size={16} /> {t('recruiter.viewResume', 'View résumé')}
                        </Link>
                        <a href="/#contact" className={styles.secondaryBtn}>
                            <Send size={16} /> {t('recruiter.getInTouch', 'Get in touch')}
                        </a>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default RecruiterSnapshot;
