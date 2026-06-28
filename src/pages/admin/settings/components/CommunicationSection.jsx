import React from 'react';
import { Button } from '@/shared/components/ui';
import { useTranslation } from '../../../../hooks/useTranslation';
import styles from './SettingsDomainSection.module.scss';

const CONTACT_FIELDS = [
    { key: 'email', label: 'Email', placeholder: 'you@example.com' },
    { key: 'telegramUsername', label: 'Telegram Username', placeholder: '@username' },
    { key: 'telegramUrl', label: 'Telegram URL', placeholder: 'https://t.me/username' },
    { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
    { key: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
    { key: 'twitter', label: 'X / Twitter', placeholder: 'https://x.com/username' },
    { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/username' },
    { key: 'whatsapp', label: 'WhatsApp', placeholder: '+1234567890' },
    { key: 'phone', label: 'Phone', placeholder: '+1234567890' },
    { key: 'calendly', label: 'Calendly', placeholder: 'https://calendly.com/username' },
];

const PREFERRED_CONTACT_OPTIONS = [
    { value: 'Telegram', label: 'Telegram' },
    { value: 'Email', label: 'Email' },
    { value: 'LinkedIn', label: 'LinkedIn' },
    { value: 'WhatsApp', label: 'WhatsApp' },
];

const CommunicationSection = ({ settingsData, setSettingsData, onSave, loading }) => {
    const { t } = useTranslation();
    const communication = settingsData.communication || {};
    
    // Ensure we have a working copy with defaults where necessary
    const update = (key, value) => setSettingsData({ ...settingsData, communication: { ...communication, [key]: value } });
    
    // Availability from global settings (falling back to empty string to allow component to fallback to profileInfo)
    const availabilityStatus = communication.availabilityStatus || '';
    const responseTime = communication.responseTime || '';
    const timeZone = communication.timeZone || '';
    const preferredContactMethod = communication.preferredContactMethod || '';
    const telegramEnabled = communication.telegramEnabled !== false; // default true if not set

    return (
        <form onSubmit={onSave} className={styles.section}>
            <div className={styles.intro}>
                <h3>{t('admin.settings.communication.title', 'Communication & Contact')}</h3>
                <p>{t('admin.settings.communication.description', 'Manage how visitors can reach you and what is displayed in the Get In Touch section.')}</p>
            </div>

            <fieldset className={styles.fieldGroup}>
                <legend>Status & Preferences</legend>
                <label className={styles.field}>
                    <span>Availability Status</span>
                    <select
                        value={availabilityStatus}
                        onChange={(e) => update('availabilityStatus', e.target.value)}
                    >
                        <option value="">-- Use Profile Settings --</option>
                        <option value="available">Available for opportunities</option>
                        <option value="limited">Limited availability</option>
                        <option value="unavailable">Not currently available</option>
                    </select>
                </label>
                <label className={styles.field}>
                    <span>Response Time</span>
                    <input
                        type="text"
                        value={responseTime}
                        onChange={(e) => update('responseTime', e.target.value)}
                        placeholder="e.g. Usually replies within 24 hours"
                    />
                </label>
                <label className={styles.field}>
                    <span>Time Zone</span>
                    <input
                        type="text"
                        value={timeZone}
                        onChange={(e) => update('timeZone', e.target.value)}
                        placeholder="e.g. UTC+7 (Cambodia)"
                    />
                </label>
                <label className={styles.field}>
                    <span>Preferred Contact Method</span>
                    <select
                        value={preferredContactMethod}
                        onChange={(e) => update('preferredContactMethod', e.target.value)}
                    >
                        <option value="">-- None --</option>
                        {PREFERRED_CONTACT_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </label>
            </fieldset>

            <fieldset className={styles.fieldGroup}>
                <legend>Telegram Integration</legend>
                <label className={styles.checkboxField}>
                    <input
                        type="checkbox"
                        checked={telegramEnabled}
                        onChange={(e) => update('telegramEnabled', e.target.checked)}
                    />
                    <span>Enable Telegram Contact (Primary CTA & QR Code)</span>
                </label>
                {telegramEnabled && (
                    <div style={{ marginLeft: '1.5rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label className={styles.field}>
                            <span>Telegram Username</span>
                            <input
                                type="text"
                                value={communication.telegramUsername || ''}
                                onChange={(e) => update('telegramUsername', e.target.value)}
                                placeholder="@username"
                            />
                        </label>
                        <label className={styles.field}>
                            <span>Telegram URL</span>
                            <input
                                type="url"
                                value={communication.telegramUrl || ''}
                                onChange={(e) => update('telegramUrl', e.target.value)}
                                placeholder="https://t.me/username"
                            />
                        </label>
                        <label className={styles.field}>
                            <span>Custom QR Code Image URL (Optional)</span>
                            <input
                                type="url"
                                value={communication.telegramQrCodeImage || ''}
                                onChange={(e) => update('telegramQrCodeImage', e.target.value)}
                                placeholder="Leaves blank to auto-generate from URL"
                            />
                            <small>If provided, this image will be used instead of auto-generating a QR code.</small>
                        </label>
                    </div>
                )}
            </fieldset>

            <fieldset className={styles.fieldGroup}>
                <legend>Contact Links</legend>
                {CONTACT_FIELDS.filter(f => !f.key.startsWith('telegram')).map((field) => (
                    <label key={field.key} className={styles.field}>
                        <span>{field.label}</span>
                        <input
                            type="text"
                            value={communication[field.key] || ''}
                            onChange={(e) => update(field.key, e.target.value)}
                            placeholder={field.placeholder}
                        />
                    </label>
                ))}
            </fieldset>

            <div className={styles.actions}>
                <Button type="submit" isLoading={loading} className="ui-primary">{t('admin.settings.actions.save')}</Button>
            </div>
        </form>
    );
};

export default CommunicationSection;
