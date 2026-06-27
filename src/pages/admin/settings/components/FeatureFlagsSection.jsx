import React from 'react';
import { Button } from '@/shared/components/ui';
import { useTranslation } from '../../../../hooks/useTranslation';
import styles from './SettingsDomainSection.module.scss';

const FLAGS = [
    { key: 'showProjects', labelKey: 'admin.tabs.projects' },
    { key: 'showBlog', labelKey: 'admin.tabs.blog' },
    { key: 'showExperience', labelKey: 'admin.tabs.experience' },
    { key: 'showSkills', labelKey: 'admin.tabs.skills' },
    { key: 'showCertificates', labelKey: 'admin.tabs.certificates' },
    { key: 'showContact', labelKey: 'admin.settings.featureFlags.contact' }
];

const FeatureFlagsSection = ({ settingsData, setSettingsData, onSave, loading }) => {
    const { t } = useTranslation();
    const flags = settingsData.featureFlags || {};
    const toggle = (key, value) => setSettingsData({ ...settingsData, featureFlags: { ...flags, [key]: value } });

    return (
        <form onSubmit={onSave} className={styles.section}>
            <div className={styles.intro}>
                <h3>{t('admin.settings.featureFlags.title')}</h3>
                <p>{t('admin.settings.featureFlags.description')}</p>
            </div>

            {FLAGS.map((flag) => {
                const enabled = flags[flag.key] !== false;
                return (
                    <label key={flag.key} className={styles.toggleRow}>
                        <span>{t('admin.settings.featureFlags.showLabel', { label: t(flag.labelKey) })}</span>
                        <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => toggle(flag.key, e.target.checked)}
                        />
                    </label>
                );
            })}

            <div className={styles.actions}>
                <Button type="submit" isLoading={loading} className="ui-primary">{t('admin.settings.actions.save')}</Button>
            </div>
        </form>
    );
};

export default FeatureFlagsSection;
