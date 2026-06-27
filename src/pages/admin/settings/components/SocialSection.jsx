import React from 'react';
import { Button } from '@/shared/components/ui';
import { useTranslation } from '../../../../hooks/useTranslation';
import styles from './SettingsDomainSection.module.scss';

const SOCIAL_FIELDS = [
    { key: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
    { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
    { key: 'twitter', label: 'X / Twitter', placeholder: 'https://x.com/username' },
    { key: 'email', label: 'Email', placeholder: 'you@example.com' },
    { key: 'website', label: 'Website', placeholder: 'https://...' }
];

const SocialSection = ({ settingsData, setSettingsData, onSave, loading }) => {
    const { t } = useTranslation();
    const social = settingsData.social || {};
    const update = (key, value) => setSettingsData({ ...settingsData, social: { ...social, [key]: value } });

    return (
        <form onSubmit={onSave} className={styles.section}>
            <div className={styles.intro}>
                <h3>{t('admin.settings.social.title')}</h3>
                <p>{t('admin.settings.social.description')}</p>
            </div>

            {SOCIAL_FIELDS.map((field) => (
                <label key={field.key} className={styles.field}>
                    <span>{field.label}</span>
                    <input
                        type="text"
                        value={social[field.key] || ''}
                        onChange={(e) => update(field.key, e.target.value)}
                        placeholder={field.placeholder}
                    />
                </label>
            ))}

            <div className={styles.actions}>
                <Button type="submit" isLoading={loading} className="ui-primary">{t('admin.settings.actions.save')}</Button>
            </div>
        </form>
    );
};

export default SocialSection;
