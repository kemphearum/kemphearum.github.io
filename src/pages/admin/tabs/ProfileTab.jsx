import React, { useState } from 'react';
import { Save } from 'lucide-react';
import cardStyles from '../styles/adminCards.module.scss';
import formStyles from '../styles/adminForms.module.scss';
import utilStyles from '../styles/adminUtilities.module.scss';
import styles from '../styles/adminCards.module.scss'; // Defaulting to cardStyles for general structure
import UserService from '../../../services/UserService';
import { useActivity } from '../../../hooks/useActivity';

const ProfileTab = ({ user, userId, userDisplayName, setUserDisplayName, showToast }) => {
    const [isSaving, setIsSaving] = useState(false);
    const { trackWrite } = useActivity();

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!userId) return;

        setIsSaving(true);
        try {
            await UserService.updateProfile(userId, userDisplayName, trackWrite);
            showToast('Profile saved!');
        } catch (error) {
            console.error('Error saving profile:', error);
            showToast(error.message || 'Failed to save profile.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={cardStyles.card}>
            <div className={cardStyles.cardHeader}><h3>👤 Edit Profile</h3></div>
            <form onSubmit={handleSaveProfile} className={formStyles.form}>
                <div className={formStyles.inputGroup}>
                    <label>Display Name</label>
                    <input type="text" placeholder="Kem Phearum" value={userDisplayName} onChange={(e) => setUserDisplayName(e.target.value)} />
                    <span className={formStyles.hint}>This name will be displayed in the Admin sidebar instead of your email address.</span>
                </div>
                <div className={formStyles.inputGroup}>
                    <label>Email Address</label>
                    <input type="text" value={user.email} disabled style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-secondary)', opacity: 0.7 }} />
                </div>
                <div className={formStyles.formFooter}>
                    <button type="submit" disabled={isSaving} className={formStyles.submitBtn}>
                        {isSaving ? <><span className={utilStyles.spinner} /> Saving...</> : <><Save size={18} /> Save</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfileTab;
