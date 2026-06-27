import React from 'react';
import { Button } from '@/shared/components/ui';
import { useTranslation } from '../../../../hooks/useTranslation';
import styles from './SettingsDomainSection.module.scss';

const SeoSection = ({ settingsData, setSettingsData, onSave, loading }) => {
    const { t } = useTranslation();
    const seo = settingsData.seo || {};
    const update = (key, value) => setSettingsData({ ...settingsData, seo: { ...seo, [key]: value } });

    return (
        <form onSubmit={onSave} className={styles.section}>
            <div className={styles.intro}>
                <h3>{t('admin.settings.seo.title')}</h3>
                <p>{t('admin.settings.seo.description')}</p>
            </div>

            <label className={styles.field}>
                <span>{t('admin.settings.seo.metaTitle')}</span>
                <input type="text" value={seo.metaTitle || ''} onChange={(e) => update('metaTitle', e.target.value)} placeholder={t('admin.settings.seo.metaTitlePlaceholder')} />
            </label>

            <label className={styles.field}>
                <span>{t('admin.settings.seo.metaDescription')}</span>
                <textarea rows={3} value={seo.metaDescription || ''} onChange={(e) => update('metaDescription', e.target.value)} placeholder={t('admin.settings.seo.metaDescriptionPlaceholder')} />
            </label>

            <label className={styles.field}>
                <span>{t('admin.settings.seo.keywords')}</span>
                <input type="text" value={seo.keywords || ''} onChange={(e) => update('keywords', e.target.value)} placeholder={t('admin.settings.seo.keywordsPlaceholder')} />
            </label>

            <label className={styles.field}>
                <span>{t('admin.settings.seo.ogImage')}</span>
                <input type="text" value={seo.ogImage || ''} onChange={(e) => update('ogImage', e.target.value)} placeholder="https://..." />
            </label>

            <label className={styles.field}>
                <span>{t('admin.settings.seo.twitterHandle')}</span>
                <input type="text" value={seo.twitterHandle || ''} onChange={(e) => update('twitterHandle', e.target.value)} placeholder="@username" />
            </label>

            <div className={styles.actions}>
                <Button type="submit" isLoading={loading} className="ui-primary">{t('admin.settings.actions.save')}</Button>
            </div>
        </form>
    );
};

export default SeoSection;
