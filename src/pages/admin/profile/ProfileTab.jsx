import React, { useState } from 'react';
import { Save } from 'lucide-react';
import UserService from '../../../services/UserService';
import BaseService from '../../../services/BaseService';
import { useActivity } from '../../../hooks/useActivity';
import { useTranslation } from '../../../hooks/useTranslation';

const ProfileTab = ({ user, userId, userDisplayName, setUserDisplayName, showToast }) => {
    const { t } = useTranslation();
    const [isSaving, setIsSaving] = useState(false);
    const { trackWrite } = useActivity();

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!userId) return;

        const normalizedName = (userDisplayName || '').trim();
        if (normalizedName === (user?.displayName || '').trim()) {
            showToast(t('admin.profile.messages.noChanges'), 'info');
            return;
        }

        setIsSaving(true);
        const { error } = await BaseService.safe(() => UserService.updateProfile(userId, normalizedName, trackWrite));

        if (error) {
            showToast(error, 'error');
        } else {
            setUserDisplayName(normalizedName);
            showToast(t('admin.profile.messages.saved'));
        }
        setIsSaving(false);
    };

    return (
        <div className="ui-card">
            <div className="ui-cardHeader"><h3>{t('admin.profile.title')}</h3></div>
            <form onSubmit={handleSaveProfile}>
                <div className="ui-formGroup">
                    <label>{t('admin.profile.displayName')}</label>
                    <input type="text" placeholder={t('admin.profile.displayNamePlaceholder')} value={userDisplayName} onChange={(e) => setUserDisplayName(e.target.value)} />
                    <span className="ui-hint">{t('admin.profile.displayNameHint')}</span>
                </div>
                <div className="ui-formGroup">
                    <label>{t('admin.profile.emailAddress')}</label>
                    <input type="text" value={user.email} disabled style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-secondary)', opacity: 0.7 }} />
                </div>
                <div className="ui-formFooter">
                    <button type="submit" disabled={isSaving} className="ui-button ui-button--primary">
                        {isSaving ? <><span className="ui-spinner" /> {t('admin.profile.saving')}</> : <><Save size={18} /> {t('admin.common.save')}</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfileTab;
