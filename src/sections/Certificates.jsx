import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Award, ExternalLink, Building2, Calendar } from 'lucide-react';
import CertificateService from '../services/CertificateService';
import { SectionHeader } from '@/shared/components/ui';
import styles from './Certificates.module.scss';
import { useTranslation } from '../hooks/useTranslation';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { getLocalizedField } from '../utils/localization';
import { filterPublished } from '../domain/shared/contentStatus';

const formatMonth = (value, language) => {
    if (!value || typeof value !== 'string') return '';
    const match = value.match(/^(\d{4})-(\d{2})/);
    if (!match) return value;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
    return new Intl.DateTimeFormat(language === 'km' ? 'km-KH' : 'en-US', { month: 'short', year: 'numeric' }).format(date);
};

const Certificates = ({ isStandalone = false }) => {
    const { language, t } = useTranslation();
    const enabled = useFeatureFlag('showCertificates');

    const { data: certificatesData, isLoading } = useQuery({
        staleTime: 60000,
        gcTime: 300000,
        refetchOnWindowFocus: false,
        queryKey: ['certificates'],
        queryFn: () => CertificateService.getAll('createdAt', 'desc')
    });

    const certificates = useMemo(() => filterPublished(certificatesData || [])
        .map((cert) => ({
            ...cert,
            name: getLocalizedField(cert.name, language),
            description: getLocalizedField(cert.description, language)
        }))
        .sort((a, b) => {
            if (!!b.featured !== !!a.featured) return b.featured ? 1 : -1;
            const dateDiff = String(b.issueDate || '').localeCompare(String(a.issueDate || ''));
            if (dateDiff !== 0) return dateDiff;
            return (a.order || 0) - (b.order || 0);
        }), [certificatesData, language]);

    if (!enabled) return null;
    if (!isLoading && certificates.length === 0) return null;

    return (
        <section id="certificates" className={`${styles.section} ${isStandalone ? styles.standalone : ''}`}>
            <div className={styles.container}>
                <SectionHeader title={t('certificates.title')} subtitle={t('certificates.subtitle')} />

                {isLoading ? (
                    <div className={styles.grid}>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className={styles.skeletonCard} />
                        ))}
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {certificates.map((cert, index) => (
                            <motion.article
                                key={cert.id}
                                className={styles.card}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.2 }}
                                transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
                            >
                                <div className={styles.cardIcon}><Award size={22} /></div>
                                <h3 className={styles.cardTitle}>{cert.name}</h3>
                                {cert.organization && (
                                    <p className={styles.cardMeta}><Building2 size={14} /> {cert.organization}</p>
                                )}
                                {cert.issueDate && (
                                    <p className={styles.cardMeta}><Calendar size={14} /> {formatMonth(cert.issueDate, language)}</p>
                                )}
                                {cert.credentialId && (
                                    <p className={styles.credential}>{t('certificates.credentialId')}: {cert.credentialId}</p>
                                )}
                                {cert.url && (
                                    <a className={styles.verify} href={cert.url} target="_blank" rel="noopener noreferrer">
                                        {t('certificates.verify')} <ExternalLink size={14} />
                                    </a>
                                )}
                            </motion.article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default Certificates;
