import React, { useState } from 'react';
import { Save } from 'lucide-react';
import UserService from '../../../services/UserService';
import BaseService from '../../../services/BaseService';
import { useActivity } from '../../../hooks/useActivity';

const ProfileTab = ({ user, userId, userDisplayName, setUserDisplayName, showToast }) => {
    const [isSaving, setIsSaving] = useState(false);
    const { trackWrite } = useActivity();

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!userId) return;

        setIsSaving(true);
        const { error } = await BaseService.safe(() => UserService.updateProfile(userId, userDisplayName, trackWrite));
        if (error) showToast(error, 'error');
        else showToast('Profile saved!');
        setIsSaving(false);
    };

    return (
        <div className="ui-card">
            <div className="ui-cardHeader"><h3>👤 Edit Profile</h3></div>
            <form onSubmit={handleSaveProfile}>
                <div className="ui-formGroup">
                    <label>Display Name</label>
                    <input type="text" placeholder="Kem Phearum" value={userDisplayName} onChange={(e) => setUserDisplayName(e.target.value)} />
                    <span className="ui-hint">This name will be displayed in the Admin sidebar instead of your email address.</span>
                </div>
                <div className="ui-formGroup">
                    <label>Email Address</label>
                    <input type="text" value={user.email} disabled style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-secondary)', opacity: 0.7 }} />
                </div>
                <div className="ui-formFooter">
                    <button type="submit" disabled={isSaving} className="ui-button ui-button--primary">
                        {isSaving ? <><span className="ui-spinner" /> Saving...</> : <><Save size={18} /> Save</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfileTab;
