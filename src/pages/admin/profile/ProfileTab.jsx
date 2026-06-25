import React, { useState } from 'react';
import { Save, KeyRound } from 'lucide-react';
import UserService from '../../../services/UserService';
import BaseService from '../../../services/BaseService';
import AuthService from '../../../services/AuthService';
import { useActivity } from '../../../hooks/useActivity';
import { useTranslation } from '../../../hooks/useTranslation';
import { formatAuthErrorMessage } from '../adminUtils';
import { Button } from '../../../shared/components/ui';

const ProfileTab = ({ user, userId, userDisplayName, setUserDisplayName, showToast }) => {
    const { t, language } = useTranslation();
    const [isSaving, setIsSaving] = useState(false);
    const { trackWrite } = useActivity();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    const handleSetPassword = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            showToast(t('admin.auth.errors.weakPassword'), 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast(t('admin.profile.password.mismatch'), 'error');
            return;
        }

        setIsSavingPassword(true);
        try {
            await AuthService.setPassword(newPassword, currentPassword);
            trackWrite(1, 'Linked/updated password credential');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            showToast(t('admin.profile.password.saved'));
        } catch (error) {
            const code = error?.code;
            if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
                return;
            }
            if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
                showToast(t('admin.profile.password.currentWrong'), 'error');
                return;
            }
            showToast(formatAuthErrorMessage(error, t, language), 'error');
        } finally {
            setIsSavingPassword(false);
        }
    };

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
                    <Button type="submit" variant="primary" isLoading={isSaving} icon={isSaving ? undefined : Save}>
                        {isSaving ? t('admin.profile.saving') : t('admin.common.save')}
                    </Button>
                </div>
            </form>

            <div className="ui-cardHeader" style={{ marginTop: '1.5rem' }}>
                <h3>{t('admin.profile.password.title')}</h3>
            </div>
            <p className="ui-hint" style={{ marginBottom: '1rem' }}>
                {t('admin.profile.password.intro')}
            </p>
            <form onSubmit={handleSetPassword}>
                <div className="ui-formGroup">
                    <label>{t('admin.profile.password.currentPassword')}</label>
                    <input
                        type="password"
                        autoComplete="current-password"
                        placeholder={t('admin.profile.password.currentPasswordPlaceholder')}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <span className="ui-hint">{t('admin.profile.password.currentPasswordHint')}</span>
                </div>
                <div className="ui-formGroup">
                    <label>{t('admin.profile.password.newPassword')}</label>
                    <input
                        type="password"
                        autoComplete="new-password"
                        placeholder={t('admin.auth.passwordPlaceholder')}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </div>
                <div className="ui-formGroup">
                    <label>{t('admin.profile.password.confirmPassword')}</label>
                    <input
                        type="password"
                        autoComplete="new-password"
                        placeholder={t('admin.auth.passwordPlaceholder')}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>
                <div className="ui-formFooter">
                    <Button type="submit" variant="primary" isLoading={isSavingPassword} icon={isSavingPassword ? undefined : KeyRound}>
                        {isSavingPassword ? t('admin.profile.saving') : t('admin.profile.password.action')}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ProfileTab;
