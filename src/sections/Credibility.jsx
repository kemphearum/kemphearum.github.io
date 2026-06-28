import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, BookOpen, Mic } from 'lucide-react';
import styles from './Credibility.module.scss';
import AwardService from '../services/AwardService';
import PublicationService from '../services/PublicationService';
import SpeakingService from '../services/SpeakingService';
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedField } from '../utils/localization';
import { filterPublished } from '../domain/shared/contentStatus';
import MarkdownRenderer from './MarkdownRenderer';

const QUERY_OPTS = { staleTime: 300000, gcTime: 900000, refetchOnWindowFocus: false };

const Credibility = () => {
    const { language, t } = useTranslation();

    const { data: awardsRaw } = useQuery({ ...QUERY_OPTS, queryKey: ['awards'], queryFn: () => AwardService.getAll() });
    const { data: publicationsRaw } = useQuery({ ...QUERY_OPTS, queryKey: ['publications'], queryFn: () => PublicationService.getAll() });
    const { data: speakingRaw } = useQuery({ ...QUERY_OPTS, queryKey: ['speaking'], queryFn: () => SpeakingService.getAll() });

    const awards = useMemo(() => filterPublished(awardsRaw || [])
        .map((a) => ({ ...a, title: getLocalizedField(a.title, language), organization: getLocalizedField(a.organization, language), description: getLocalizedField(a.description, language) }))
        .sort((a, b) => String(b.issueDate || '').localeCompare(String(a.issueDate || ''))).slice(0, 3), [awardsRaw, language]);
    const publications = useMemo(() => filterPublished(publicationsRaw || [])
        .map((p) => ({ ...p, title: getLocalizedField(p.title, language), publisher: getLocalizedField(p.publisher, language), description: getLocalizedField(p.description, language) }))
        .sort((a, b) => String(b.publishDate || '').localeCompare(String(a.publishDate || ''))).slice(0, 3), [publicationsRaw, language]);
    const speaking = useMemo(() => filterPublished(speakingRaw || [])
        .map((s) => ({ ...s, title: getLocalizedField(s.title, language), eventName: getLocalizedField(s.eventName, language), description: getLocalizedField(s.description, language) }))
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))).slice(0, 3), [speakingRaw, language]);

    if (!awards.length && !publications.length && !speaking.length) {
        return null; // Nothing to show
    }

    return (
        <section className={`section ${styles.credibility}`}>
            <div className="container">
                <div className="section-header">
                    <h2 className="section-title">{t('credibility.title', 'Trust & Credibility')}</h2>
                    <p className="section-subtitle">{t('credibility.subtitle', 'Industry recognition, thoughts, and community involvement.')}</p>
                </div>

                <div className={styles.grid}>
                    {awards.length > 0 && (
                        <div className={styles.column}>
                            <h3 className={styles.columnTitle}><Award size={18} /> {t('credibility.awards', 'Awards & Honors')}</h3>
                            <div className={styles.list}>
                                {awards.map((item) => (
                                    <div key={item.id} className={styles.card}>
                                        <div className={styles.cardTitle}>{item.title}</div>
                                        <div className={styles.cardMeta}>{item.organization} {item.issueDate && `· ${String(item.issueDate).slice(0,4)}`}</div>
                                        {item.description && <div className={styles.cardDesc}><MarkdownRenderer content={item.description} /></div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {publications.length > 0 && (
                        <div className={styles.column}>
                            <h3 className={styles.columnTitle}><BookOpen size={18} /> {t('credibility.publications', 'Publications')}</h3>
                            <div className={styles.list}>
                                {publications.map((item) => (
                                    <div key={item.id} className={styles.card}>
                                        <div className={styles.cardTitle}>
                                            {item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a> : item.title}
                                        </div>
                                        <div className={styles.cardMeta}>{item.publisher} {item.publishDate && `· ${String(item.publishDate).slice(0,4)}`}</div>
                                        {item.description && <div className={styles.cardDesc}><MarkdownRenderer content={item.description} /></div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {speaking.length > 0 && (
                        <div className={styles.column}>
                            <h3 className={styles.columnTitle}><Mic size={18} /> {t('credibility.speaking', 'Speaking Events')}</h3>
                            <div className={styles.list}>
                                {speaking.map((item) => (
                                    <div key={item.id} className={styles.card}>
                                        <div className={styles.cardTitle}>{item.title}</div>
                                        <div className={styles.cardMeta}>{item.eventName} {item.date && `· ${String(item.date).slice(0,4)}`}</div>
                                        {item.description && <div className={styles.cardDesc}><MarkdownRenderer content={item.description} /></div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default Credibility;
