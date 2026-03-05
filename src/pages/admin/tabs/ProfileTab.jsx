import React, { useState } from 'react';
import { Save } from 'lucide-react';
import styles from '../../Admin.module.scss';
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
        <div className={styles.card}>
            <div className={styles.cardHeader}><h3>👤 Edit Profile</h3></div>
            <form onSubmit={handleSaveProfile} className={styles.form}>
                <div className={styles.inputGroup}>
                    <label>Display Name</label>
                    <input type="text" placeholder="Kem Phearum" value={userDisplayName} onChange={(e) => setUserDisplayName(e.target.value)} />
                    <span className={styles.hint}>This name will be displayed in the Admin sidebar instead of your email address.</span>
                </div>
                <div className={styles.inputGroup}>
                    <label>Email Address</label>
                    <input type="text" value={user.email} disabled style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-secondary)', opacity: 0.7 }} />
                </div>
                <div className={styles.formFooter}>
                    <button type="submit" disabled={isSaving} className={styles.submitBtn}>
                        {isSaving ? <><span className={styles.spinner} /> Saving...</> : <><Save size={18} /> Save</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfileTab;
