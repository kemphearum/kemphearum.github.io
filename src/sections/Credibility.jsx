import React, { useMemo } from 'react';
 
import { motion } from 'framer-motion';
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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
    };

    return (
        <section className={`section ${styles.credibility}`}>
            <div className="container">
                <motion.div 
                    className="section-header"
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="section-title">{t('credibility.title', 'Trust & Credibility')}</h2>
                    <p className="section-subtitle">{t('credibility.subtitle', 'Industry recognition, thoughts, and community involvement.')}</p>
                </motion.div>

                <div className={styles.grid}>
                    {awards.length > 0 && (
                        <div className={styles.column}>
                            <h3 className={styles.columnTitle}><Award size={18} /> {t('credibility.awards', 'Awards & Honors')}</h3>
                            <motion.div 
                                className={styles.list}
                                variants={containerVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.1 }}
                            >
                                {awards.map((item) => (
                                    <motion.div 
                                        key={item.id} 
                                        className={styles.card}
                                        variants={cardVariants}
                                        whileHover={{ y: -4, boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.15)' }}
                                    >
                                        <div className={styles.cardTitle}>{item.title}</div>
                                        <div className={styles.cardMeta}>{item.organization} {item.issueDate && `· ${String(item.issueDate).slice(0,4)}`}</div>
                                        {item.description && <div className={styles.cardDesc}><MarkdownRenderer content={item.description} /></div>}
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>
                    )}

                    {publications.length > 0 && (
                        <div className={styles.column}>
                            <h3 className={styles.columnTitle}><BookOpen size={18} /> {t('credibility.publications', 'Publications')}</h3>
                            <motion.div 
                                className={styles.list}
                                variants={containerVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.1 }}
                            >
                                {publications.map((item) => (
                                    <motion.div 
                                        key={item.id} 
                                        className={styles.card}
                                        variants={cardVariants}
                                        whileHover={{ y: -4, boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.15)' }}
                                    >
                                        <div className={styles.cardTitle}>
                                            {item.link ? <a href={item.link} target="_blank" rel="noopener noreferrer">{item.title}</a> : item.title}
                                        </div>
                                        <div className={styles.cardMeta}>{item.publisher} {item.publishDate && `· ${String(item.publishDate).slice(0,4)}`}</div>
                                        {item.description && <div className={styles.cardDesc}><MarkdownRenderer content={item.description} /></div>}
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>
                    )}

                    {speaking.length > 0 && (
                        <div className={styles.column}>
                            <h3 className={styles.columnTitle}><Mic size={18} /> {t('credibility.speaking', 'Speaking Events')}</h3>
                            <motion.div 
                                className={styles.list}
                                variants={containerVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.1 }}
                            >
                                {speaking.map((item) => (
                                    <motion.div 
                                        key={item.id} 
                                        className={styles.card}
                                        variants={cardVariants}
                                        whileHover={{ y: -4, boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.15)' }}
                                    >
                                        <div className={styles.cardTitle}>{item.title}</div>
                                        <div className={styles.cardMeta}>{item.eventName} {item.date && `· ${String(item.date).slice(0,4)}`}</div>
                                        {item.description && <div className={styles.cardDesc}><MarkdownRenderer content={item.description} /></div>}
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default Credibility;
