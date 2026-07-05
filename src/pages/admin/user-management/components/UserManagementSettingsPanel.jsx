import React, { useState, useEffect } from 'react';
import PermissionService from '../../../../services/auth/PermissionService';
import { Settings, Save, AlertCircle } from 'lucide-react';
import { Button, Spinner, EmptyState } from '@/shared/components/ui';
import { useAsyncAction } from '../../../../hooks/useAsyncAction';
import { useActivity } from '../../../../hooks/useActivity';
import BaseService from '../../../../services/BaseService';
import { db } from '../../../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';

const UserManagementSettingsPanel = ({ userRole, showToast }) => {
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

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <motion.div 
            className="auth-settings-panel"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            <motion.div variants={itemVariants} className="ui-flex-between ui-mb-medium">
                <h3 className="ui-heading ui-m-0">Global Auth Settings</h3>
                <Button onClick={handleSave} loading={saving}>
                    <Save size={16} /> Save Settings
                </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="ui-card ui-p-medium ui-mb-large">
                <h4 className="ui-heading ui-mb-small">User Registration</h4>
                <p className="ui-text-muted ui-text-sm ui-mb-medium">
                    Control how new users join the platform. Note: Firebase Authentication must also be configured to allow/deny sign-ups.
                </p>

                <div className="ui-form-group ui-mb-medium">
                    <label className="ui-flex-center-gap-small ui-mb-xs">
                        <input 
                            type="checkbox"
                            className="ui-checkbox"
                            checked={settings.allowPublicRegistration}
                            onChange={(e) => handleChange('allowPublicRegistration', e.target.checked)}
                        />
                        <span className="ui-text-bold">Allow Public Registration</span>
                    </label>
                    <div className="ui-text-sm ui-text-muted" style={{ marginLeft: '24px' }}>
                        If disabled, new users can only be created by an administrator.
                    </div>
                </div>

                <div className="ui-form-group ui-mb-medium">
                    <label className="ui-flex-center-gap-small ui-mb-xs">
                        <input 
                            type="checkbox"
                            className="ui-checkbox"
                            checked={settings.requireEmailVerification}
                            onChange={(e) => handleChange('requireEmailVerification', e.target.checked)}
                        />
                        <span className="ui-text-bold">Require Email Verification</span>
                    </label>
                    <div className="ui-text-sm ui-text-muted" style={{ marginLeft: '24px' }}>
                        Users cannot access protected resources until their email address is verified.
                    </div>
                </div>

                <div className="ui-form-group">
                    <label className="ui-label">Default Role for New Users</label>
                    <select 
                        className="ui-input"
                        value={settings.defaultNewUserRole}
                        onChange={(e) => handleChange('defaultNewUserRole', e.target.value)}
                        style={{ maxWidth: '300px' }}
                    >
                        <option value="pending">Pending (No Access)</option>
                        <option value="viewer">Viewer (Read-Only)</option>
                        <option value="author">Author (Limited Write)</option>
                        <option value="editor">Editor (Full Write)</option>
                    </select>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="ui-card ui-p-medium">
                <h4 className="ui-heading ui-mb-small">Session Management</h4>
                
                <div className="ui-form-group ui-mb-medium">
                    <label className="ui-label">Max Session Inactivity Timeout (Minutes)</label>
                    <input 
                        type="number"
                        className="ui-input"
                        value={settings.sessionTimeoutMinutes}
                        onChange={(e) => handleChange('sessionTimeoutMinutes', parseInt(e.target.value, 10))}
                        min="15"
                        step="15"
                        style={{ maxWidth: '150px' }}
                    />
                    <div className="ui-text-sm ui-text-muted ui-mt-xs">
                        Force logout after this period of inactivity. Default: 1440 (24 hours).
                    </div>
                </div>

                <div className="ui-alert ui-alert-warning ui-mt-medium">
                    <AlertCircle size={16} />
                    <span>
                        Session timeout depends on client-side enforcement and Firebase Auth token refresh cycles (usually 1 hour). Changing this setting will take effect on the next client-side token refresh.
                    </span>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default UserManagementSettingsPanel;
