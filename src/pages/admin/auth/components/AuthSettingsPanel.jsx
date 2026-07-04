import React, { useState, useEffect } from 'react';
import PermissionService from '../../../../services/auth/PermissionService';
import { Settings, Save, AlertCircle } from 'lucide-react';
import { Button, Spinner, EmptyState } from '@/shared/components/ui';
import { useAsyncAction } from '../../../../hooks/useAsyncAction';
import { useActivity } from '../../../../hooks/useActivity';
import BaseService from '../../../../services/BaseService';
import { db } from '../../../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
const AuthSettingsPanel = ({ userRole, showToast }) => {
    const { trackWrite } = useActivity();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    const { loading: saving, execute: executeSave } = useAsyncAction({
        showToast,
        errorMessage: 'Failed to save auth settings',
    });

    useEffect(() => {
        let isMounted = true;
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'settings', 'global');
                const snap = await getDoc(docRef);
                if (isMounted) {
                    const data = snap.data()?.auth || {};
                    setSettings({
                        allowPublicRegistration: data.allowPublicRegistration || false,
                        requireEmailVerification: data.requireEmailVerification || false,
                        sessionTimeoutMinutes: data.sessionTimeoutMinutes || 1440,
                        defaultNewUserRole: data.defaultNewUserRole || 'pending'
                    });
                }
            } catch (err) {
                console.error("Failed to load auth settings", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchSettings();
        return () => { isMounted = false; };
    }, []);

    const handleSave = async () => {
        if (!PermissionService.can(userRole, PermissionService.ACTIONS.CONFIGURE, PermissionService.RESOURCES.SETTINGS)) {
            return showToast("Unauthorized", "error");
        }

        await executeSave(async () => {
            const docRef = doc(db, 'settings', 'global');
            await setDoc(docRef, { auth: settings }, { merge: true });
            if (trackWrite) trackWrite(1, 'Updated Auth Settings');
        }, {
            successMessage: "Auth settings saved successfully."
        });
    };

    const handleChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    if (!PermissionService.can(userRole, PermissionService.ACTIONS.CONFIGURE, PermissionService.RESOURCES.SETTINGS)) {
        return (
            <EmptyState 
                title="Superadmin Required"
                description="Only superadministrators can modify authentication settings."
                icon={Settings}
            />
        );
    }

    if (loading || !settings) {
        return (
            <div className="ui-flex-center ui-p-large">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="auth-settings-panel">
            <div className="ui-flex-between ui-mb-medium">
                <h3 className="ui-heading ui-m-0">Global Auth Settings</h3>
                <Button onClick={handleSave} loading={saving}>
                    <Save size={16} /> Save Settings
                </Button>
            </div>

            <div className="ui-card ui-p-medium ui-mb-large">
                <h4 className="ui-heading ui-mb-small">User Registration</h4>
                <p className="ui-text-muted ui-text-sm ui-mb-medium">
                    Control how new users join the platform. Note: Firebase Authentication must also be configured to allow/deny sign-ups.
                </p>

                <div className="ui-form-group ui-mb-medium">
                    <label className="ui-flex-center-gap-small ui-mb-xs">
                        <input 
                            type="checkbox"
                            checked={settings.allowPublicRegistration}
                            onChange={(e) => handleChange('allowPublicRegistration', e.target.checked)}
                        />
                        Allow Public Registration
                    </label>
                    <span className="ui-text-sm ui-text-muted">If disabled, users can only be invited by an Administrator.</span>
                </div>

                <div className="ui-form-group ui-mb-medium">
                    <label className="ui-flex-center-gap-small ui-mb-xs">
                        <input 
                            type="checkbox"
                            checked={settings.requireEmailVerification}
                            onChange={(e) => handleChange('requireEmailVerification', e.target.checked)}
                        />
                        Require Email Verification
                    </label>
                    <span className="ui-text-sm ui-text-muted">New users must verify their email before accessing the dashboard.</span>
                </div>

                <div className="ui-form-group">
                    <label className="ui-label">Default Role for New Users</label>
                    <select 
                        className="ui-input"
                        value={settings.defaultNewUserRole}
                        onChange={(e) => handleChange('defaultNewUserRole', e.target.value)}
                    >
                        <option value="pending">Pending (Requires Approval)</option>
                        <option value="viewer">Viewer</option>
                        <option value="author">Author</option>
                    </select>
                </div>
            </div>

            <div className="ui-card ui-p-medium">
                <h4 className="ui-heading ui-mb-small">Session Management</h4>
                <div className="ui-form-group">
                    <label className="ui-label">Idle Session Timeout (Minutes)</label>
                    <input 
                        type="number" 
                        className="ui-input" 
                        value={settings.sessionTimeoutMinutes}
                        onChange={(e) => handleChange('sessionTimeoutMinutes', parseInt(e.target.value) || 0)}
                        min="5"
                    />
                    <span className="ui-text-sm ui-text-muted ui-mt-xs ui-block">
                        Force logout after a period of inactivity. Set to 0 to disable (rely on Firebase token expiry).
                    </span>
                </div>
            </div>
        </div>
    );
};

export default AuthSettingsPanel;
