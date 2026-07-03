import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import {
    Printer, ArrowLeft, Mail, MapPin, Clock,
    Globe, Github, Linkedin, Briefcase, GraduationCap, Award, FolderGit2
} from 'lucide-react';
import styles from './Resume.module.scss';
import MarkdownRenderer from '@/sections/MarkdownRenderer';
import ContentService from '../services/ContentService';
import CommunicationService from '../services/CommunicationService';
import ExperienceService from '../services/ExperienceService';
import EducationService from '../services/EducationService';
import SkillService from '../services/SkillService';
import CertificateService from '../services/CertificateService';
import ProjectService from '../services/ProjectService';
import AwardService from '../services/AwardService';
import PublicationService from '../services/PublicationService';
import SpeakingService from '../services/SpeakingService';
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedField } from '../utils/localization';
import { filterPublished } from '../domain/shared/contentStatus';
import { deriveYearsOfExperience } from '../domain/experience/experienceDomain';
import { generateQrSvg } from '../utils/qrcode';
import { DEFAULT_SITE_URL } from '../utils/SeoHelper';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { auth } from '../firebase';
import UserService from '../services/UserService';
import { isActionAllowed } from '../utils/permissions';
import { ACTIONS } from '../utils/permissionConstants';

const QUERY_OPTS = { staleTime: 60000, gcTime: 300000, refetchOnWindowFocus: false };

const latestYear = (period) => {
    if (!period) return 0;
    if (String(period).toLowerCase().includes('present')) return 9999;
    const years = String(period).match(/[12]\d{3}/g);
    return years ? Math.max(...years.map(Number)) : 0;
};

const getPortfolioUrl = () => {
    if (typeof window === 'undefined') return DEFAULT_SITE_URL;
    const origin = window.location.origin || '';
    return origin && !origin.includes('localhost') ? origin : DEFAULT_SITE_URL;
};

const Resume = () => {
    const { authChecked, isAuthed } = useRequireAuth();
    const { language, t } = useTranslation();
    const navigate = useNavigate();

    const { data: profileRaw, isLoading: l1 } = useQuery({ ...QUERY_OPTS, queryKey: ['content', 'profileInfo'], queryFn: () => ContentService.fetchSection('profileInfo') });
    const { data: homeRaw, isLoading: l2 } = useQuery({ ...QUERY_OPTS, queryKey: ['content', 'home'], queryFn: () => ContentService.fetchSection('home') });
    const { data: commRaw, isLoading: l3 } = useQuery({ ...QUERY_OPTS, queryKey: ['content', 'contact'], queryFn: () => CommunicationService.get() });
    const { data: experienceRaw, isLoading: l4 } = useQuery({ ...QUERY_OPTS, queryKey: ['experience'], queryFn: () => ExperienceService.getAll() });
    const { data: educationRaw, isLoading: l5 } = useQuery({ ...QUERY_OPTS, queryKey: ['education'], queryFn: () => EducationService.getAll() });
    const { data: skillsRaw, isLoading: l6 } = useQuery({ ...QUERY_OPTS, queryKey: ['skills'], queryFn: () => SkillService.getAll() });
    const { data: certsRaw, isLoading: l7 } = useQuery({ ...QUERY_OPTS, queryKey: ['certificates'], queryFn: () => CertificateService.getAll() });
    const { data: projectsRaw, isLoading: l8 } = useQuery({ ...QUERY_OPTS, queryKey: ['projects'], queryFn: () => ProjectService.getAll() });
    const { data: awardsRaw, isLoading: l9 } = useQuery({ ...QUERY_OPTS, queryKey: ['awards'], queryFn: () => AwardService.getAll() });
    const { data: publicationsRaw, isLoading: l10 } = useQuery({ ...QUERY_OPTS, queryKey: ['publications'], queryFn: () => PublicationService.getAll() });
    const { data: speakingRaw, isLoading: l11 } = useQuery({ ...QUERY_OPTS, queryKey: ['speaking'], queryFn: () => SpeakingService.getAll() });

    const isDataLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || l10 || l11;

    const { data: userRecord } = useQuery({
        ...QUERY_OPTS,
        queryKey: ['currentUser', auth.currentUser?.uid],
        queryFn: () => UserService.fetchUserById(auth.currentUser?.uid),
        enabled: !!isAuthed && !!auth.currentUser?.uid
    });

    const { data: rolePermissions } = useQuery({
        ...QUERY_OPTS,
        queryKey: ['rolePermissions'],
        queryFn: () => UserService.fetchRolePermissions(() => {}),
        enabled: !!isAuthed
    });

    const userRole = userRecord?.role || 'pending';
    const isResumeAllowed = useMemo(() => {
        if (!isAuthed || !userRecord || !rolePermissions) return null;
        return isActionAllowed(ACTIONS.VIEW, 'resume', userRole, rolePermissions);
    }, [isAuthed, userRecord, userRole, rolePermissions]);

    const profile = profileRaw || {};
    // Contact details (email, social links, timezone) are owned by content/contact.
    const comm = commRaw || {};
    const social = comm;

    const name = getLocalizedField(homeRaw?.name, language) || 'Kem Phearum';
    const headline = getLocalizedField(profile.resumeHeadline, language)
        || getLocalizedField(profile.currentRole, language)
        || getLocalizedField(homeRaw?.subtitle, language)
        || 'ICT Security & IT Audit Professional';
    const summary = getLocalizedField(profile.summary, language) || getLocalizedField(homeRaw?.description, language);
    const location = getLocalizedField(profile.location, language);

    const experiences = useMemo(() => filterPublished(experienceRaw || [])
        .map((e) => ({ ...e, company: getLocalizedField(e.company, language), role: getLocalizedField(e.role, language), description: getLocalizedField(e.description, language), period: getLocalizedField(e.period, language) || e.period }))
        .sort((a, b) => latestYear(b.period) - latestYear(a.period)), [experienceRaw, language]);

    const education = useMemo(() => filterPublished(educationRaw || [])
        .map((e) => ({ ...e, school: getLocalizedField(e.school, language), degree: getLocalizedField(e.degree, language), fieldOfStudy: getLocalizedField(e.fieldOfStudy, language), period: getLocalizedField(e.period, language) || e.period }))
        .sort((a, b) => latestYear(b.period) - latestYear(a.period)), [educationRaw, language]);

    const skillGroups = useMemo(() => {
        const visible = filterPublished(skillsRaw || []).map((s) => ({ ...s, name: getLocalizedField(s.name, language), category: (s.category || '').trim() || t('resume.otherSkills', 'Other') }));
        const map = new Map();
        visible.forEach((s) => {
            if (!map.has(s.category)) map.set(s.category, []);
            map.get(s.category).push(s.name);
        });
        return Array.from(map, ([category, items]) => ({ category, items }));
    }, [skillsRaw, language, t]);

    const certificates = useMemo(() => filterPublished(certsRaw || [])
        .map((c) => ({ ...c, name: getLocalizedField(c.name, language) }))
        .sort((a, b) => String(b.issueDate || '').localeCompare(String(a.issueDate || ''))), [certsRaw, language]);

    const projects = useMemo(() => {
        const visible = filterPublished(projectsRaw || []).map((p) => ({ ...p, title: getLocalizedField(p.title, language), description: getLocalizedField(p.description, language) }));
        const featured = visible.filter((p) => p.featured);
        return (featured.length ? featured : visible).slice(0, 4);
    }, [projectsRaw, language]);

    const awards = useMemo(() => filterPublished(awardsRaw || [])
        .map((a) => ({ ...a, title: getLocalizedField(a.title, language), organization: getLocalizedField(a.organization, language) }))
        .sort((a, b) => String(b.issueDate || '').localeCompare(String(a.issueDate || ''))), [awardsRaw, language]);

    const publications = useMemo(() => filterPublished(publicationsRaw || [])
        .map((p) => ({ ...p, title: getLocalizedField(p.title, language), publisher: getLocalizedField(p.publisher, language) }))
        .sort((a, b) => String(b.publishDate || '').localeCompare(String(a.publishDate || ''))), [publicationsRaw, language]);

    const speaking = useMemo(() => filterPublished(speakingRaw || [])
        .map((s) => ({ ...s, title: getLocalizedField(s.title, language), eventName: getLocalizedField(s.eventName, language) }))
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))), [speakingRaw, language]);

    const years = Number(profile.yearsExperienceOverride) || deriveYearsOfExperience(experiences);
    const languages = (Array.isArray(profile.languages) ? profile.languages : []).map(l => getLocalizedField(l, language) || getLocalizedField(l, 'en') || (typeof l === 'string' ? l : '')).filter(Boolean);
    const industries = (Array.isArray(profile.industries) ? profile.industries : []).map(i => getLocalizedField(i, language) || getLocalizedField(i, 'en') || (typeof i === 'string' ? i : '')).filter(Boolean);
    const accomplishments = (Array.isArray(profile.accomplishments) ? profile.accomplishments : []).map(a => getLocalizedField(a, language) || getLocalizedField(a, 'en') || (typeof a === 'string' ? a : '')).filter(Boolean);

    const portfolioUrl = getPortfolioUrl();
    const qrSvg = useMemo(() => generateQrSvg(portfolioUrl, { ecc: 'M', margin: 2 }), [portfolioUrl]);

    const handlePrint = () => {
        if (typeof window !== 'undefined') window.print();
    };

    const handleBack = (e) => {
        e.preventDefault();
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate('/');
        }
    };

    if (!authChecked || !isAuthed) return null;

    if (isResumeAllowed === false) {
        return (
            <div className={styles.page}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
                    <h2>{t('restricted.title', 'Access Restricted')}</h2>
                    <p>{t('restricted.description', 'You do not have permission to view this content.')}</p>
                    <Link to="/admin" className={styles.toolbarBtn} style={{ marginTop: '1rem' }}>
                        <ArrowLeft size={16} /> {t('resume.backToAdmin', 'Back to Admin')}
                    </Link>
                </div>
            </div>
        );
    }

    // Wait until role permission is loaded
    if (isResumeAllowed === null) return null;

    return (
        <div className={styles.page}>
            <div className={styles.toolbar} role="toolbar" aria-label={t('resume.toolbar', 'Resume actions')}>
                <a href="/" onClick={handleBack} className={styles.toolbarBtn}>
                    <ArrowLeft size={16} /> {t('resume.back', 'Back')}
                </a>
                <div className={styles.toolbarActions}>
                    <button type="button" className={`${styles.toolbarBtn} ${styles.toolbarBtnPrimary}`} onClick={handlePrint} disabled={isDataLoading} title={t('resume.printSaveHint', 'Use Print dialog to Save as PDF')}>
                        <Printer size={16} /> {t('resume.printOrSave', 'Print / Save PDF')}
                    </button>
                </div>
            </div>

            {isDataLoading ? (
                <article className={styles.sheet}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '2rem' }}>
                            <div style={{ width: '60%', height: '32px', backgroundColor: 'var(--surface-color)', borderRadius: '4px' }}></div>
                            <div style={{ width: '40%', height: '24px', backgroundColor: 'var(--surface-color)', borderRadius: '4px' }}></div>
                            <div style={{ width: '80%', height: '16px', backgroundColor: 'var(--surface-color)', borderRadius: '4px', marginTop: '1rem' }}></div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ width: '30%', height: '24px', backgroundColor: 'var(--surface-color)', borderRadius: '4px' }}></div>
                            <div style={{ width: '100%', height: '16px', backgroundColor: 'var(--surface-color)', borderRadius: '4px' }}></div>
                            <div style={{ width: '90%', height: '16px', backgroundColor: 'var(--surface-color)', borderRadius: '4px' }}></div>
                            <div style={{ width: '95%', height: '16px', backgroundColor: 'var(--surface-color)', borderRadius: '4px' }}></div>
                        </div>
                    </div>
                </article>
            ) : (
                <article className={styles.sheet} style={{ animation: 'fadeIn 0.5s ease-out' }}>
                    <header className={styles.header}>
                    <div className={styles.headerMain}>
                        <h1 className={styles.name}>{name}</h1>
                        <p className={styles.headline}>{headline}</p>
                        <ul className={styles.contactLine}>
                            {social.email && (
                                <li><Mail size={13} /> <a href={`mailto:${social.email}`}>{social.email}</a></li>
                            )}
                            {location && <li><MapPin size={13} /> {location}</li>}
                            {comm.timeZone && <li><Clock size={13} /> {comm.timeZone}</li>}
                            {social.linkedin && (
                                <li><Linkedin size={13} /> <a href={social.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
                            )}
                            {social.github && (
                                <li><Github size={13} /> <a href={social.github} target="_blank" rel="noopener noreferrer">GitHub</a></li>
                            )}
                            {(social.website || portfolioUrl) && (
                                <li><Globe size={13} /> <a href={social.website || portfolioUrl} target="_blank" rel="noopener noreferrer">{(social.website || portfolioUrl).replace(/^https?:\/\//, '')}</a></li>
                            )}
                        </ul>
                    </div>
                    <div className={styles.qr} aria-hidden="true">
                        <div className={styles.qrCode} dangerouslySetInnerHTML={{ __html: qrSvg }} />
                        <span className={styles.qrLabel}>{t('resume.scanToView', 'Scan for live portfolio')}</span>
                    </div>
                </header>

                {summary && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>{t('resume.summary', 'Professional Summary')}</h2>
                        <div className={styles.prose}><MarkdownRenderer content={summary} /></div>
                    </section>
                )}

                {(years > 0 || industries.length > 0) && (
                    <section className={styles.section}>
                        <div className={styles.factGrid}>
                            {years > 0 && (
                                <div className={styles.fact}>
                                    <span className={styles.factValue}>{years}+</span>
                                    <span className={styles.factLabel}>{t('resume.yearsExperience', 'Years experience')}</span>
                                </div>
                            )}
                            {industries.length > 0 && (
                                <div className={styles.fact}>
                                    <span className={styles.factValue}>{industries.join(' · ')}</span>
                                    <span className={styles.factLabel}>{t('resume.industries', 'Industry expertise')}</span>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {accomplishments.length > 0 && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>{t('resume.highlights', 'Key Accomplishments')}</h2>
                        <ul className={styles.bullets}>
                            {accomplishments.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </section>
                )}

                {experiences.length > 0 && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}><Briefcase size={16} /> {t('resume.experience', 'Experience')}</h2>
                        {experiences.map((exp) => (
                            <div key={exp.id} className={styles.entry}>
                                <div className={styles.entryHead}>
                                    <h3 className={styles.entryTitle}>{exp.role}{exp.company ? ` — ${exp.company}` : ''}</h3>
                                    <span className={styles.entryMeta}>{exp.period}{exp.location ? ` · ${exp.location}` : ''}</span>
                                </div>
                                {exp.description && <div className={styles.prose}><MarkdownRenderer content={exp.description} /></div>}
                                {Array.isArray(exp.technologiesUsed) && exp.technologiesUsed.length > 0 && (
                                    <p className={styles.tech}>{exp.technologiesUsed.join(' · ')}</p>
                                )}
                            </div>
                        ))}
                    </section>
                )}

                {skillGroups.length > 0 && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>{t('resume.skills', 'Skills')}</h2>
                        <ul className={styles.skillList}>
                            {skillGroups.map((g) => (
                                <li key={g.category}><strong>{g.category}:</strong> {g.items.join(', ')}</li>
                            ))}
                        </ul>
                    </section>
                )}

                {certificates.length > 0 && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}><Award size={16} /> {t('resume.certifications', 'Certifications')}</h2>
                        <ul className={styles.bullets}>
                            {certificates.map((c) => (
                                <li key={c.id}>{c.name}{c.organization ? ` — ${c.organization}` : ''}{c.issueDate ? ` (${String(c.issueDate).slice(0, 4)})` : ''}</li>
                            ))}
                        </ul>
                    </section>
                )}

                {awards.length > 0 && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>{t('resume.awards', 'Awards & Honors')}</h2>
                        <ul className={styles.bullets}>
                            {awards.map((a) => (
                                <li key={a.id}>{a.title}{a.organization ? ` — ${a.organization}` : ''}{a.issueDate ? ` (${String(a.issueDate).slice(0, 4)})` : ''}</li>
                            ))}
                        </ul>
                    </section>
                )}

                {publications.length > 0 && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>{t('resume.publications', 'Publications')}</h2>
                        <ul className={styles.bullets}>
                            {publications.map((p) => (
                                <li key={p.id}>
                                    {p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer">{p.title}</a> : p.title}
                                    {p.publisher ? ` — ${p.publisher}` : ''}
                                    {p.publishDate ? ` (${String(p.publishDate).slice(0, 4)})` : ''}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {speaking.length > 0 && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>{t('resume.speaking', 'Speaking & Events')}</h2>
                        <ul className={styles.bullets}>
                            {speaking.map((s) => (
                                <li key={s.id}>{s.title}{s.eventName ? ` — ${s.eventName}` : ''}{s.date ? ` (${String(s.date).slice(0, 4)})` : ''}</li>
                            ))}
                        </ul>
                    </section>
                )}

                {education.length > 0 && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}><GraduationCap size={16} /> {t('resume.education', 'Education')}</h2>
                        {education.map((e) => (
                            <div key={e.id} className={styles.entry}>
                                <div className={styles.entryHead}>
                                    <h3 className={styles.entryTitle}>{e.degree}{e.fieldOfStudy ? `, ${e.fieldOfStudy}` : ''}</h3>
                                    <span className={styles.entryMeta}>{e.period}</span>
                                </div>
                                {e.school && <p className={styles.entrySub}>{e.school}</p>}
                            </div>
                        ))}
                    </section>
                )}

                {projects.length > 0 && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}><FolderGit2 size={16} /> {t('resume.projects', 'Selected Projects')}</h2>
                        {projects.map((p) => (
                            <div key={p.id} className={styles.entry}>
                                <h3 className={styles.entryTitle}>{p.title}</h3>
                                {p.description && <p className={styles.entrySub}>{p.description}</p>}
                                {Array.isArray(p.techStack) && p.techStack.length > 0 && (
                                    <p className={styles.tech}>{p.techStack.join(' · ')}</p>
                                )}
                            </div>
                        ))}
                    </section>
                )}

                {languages.length > 0 && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>{t('resume.languages', 'Languages')}</h2>
                        <p>{languages.join(' · ')}</p>
                    </section>
                )}

                <footer className={styles.footer}>
                    {t('resume.generatedFrom', 'Generated from')} <a href={portfolioUrl}>{portfolioUrl.replace(/^https?:\/\//, '')}</a>
                </footer>
            </article>
            )}
        </div>
    );
};

export default Resume;
