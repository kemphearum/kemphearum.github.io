import React from 'react';
import { X, Check, Minus } from 'lucide-react';
import { Button, Badge } from '@/shared/components/ui';
import { isActionAllowed, ACTIONS, formatRoleDisplayName, normalizeRole } from '../../../../utils/permissions';
import { listFeatures } from '../../../../registry/featureRegistry';
import { useTranslation } from '../../../../hooks/useTranslation';

const EffectivePermissionsModal = ({ user, rolePermissions, onClose }) => {
    const { t } = useTranslation();
    if (!user) return null;

    const features = listFeatures();
    const actions = [
        ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT, 
        ACTIONS.DELETE, ACTIONS.PUBLISH, ACTIONS.ARCHIVE, 
        ACTIONS.VIEW_HISTORY, ACTIONS.DATABASE_ACTIONS
    ];

    const normalizedRole = normalizeRole(user.role);

    return (
        <div className="ui-dialog-overlay" onClick={onClose}>
            <div className="ui-dialog" style={{ maxWidth: '800px', width: '100%' }} onClick={e => e.stopPropagation()}>
                <div className="ui-dialog-header">
                    <h3 className="ui-dialog-title">Effective Permissions</h3>
                    <Button variant="ghost" size="icon" onClick={onClose}><X size={20}/></Button>
                </div>
                
                <div className="ui-dialog-content">
                    <div className="ui-alert ui-alert-info ui-mb-medium">
                        <strong>User:</strong> {user.email} <br />
                        <strong>Base Role:</strong> <Badge variant="primary">{formatRoleDisplayName(normalizedRole)}</Badge>
                        <p className="ui-text-sm ui-mt-small">
                            This matrix displays the actual permissions granted to this user by evaluating their base role against any custom overrides stored in the registry.
                        </p>
                    </div>

                    <div className="ui-table-container">
                        <table className="ui-table">
                            <thead>
                                <tr>
                                    <th>Module</th>
                                    {actions.map(action => (
                                        <th key={action} style={{ textTransform: 'capitalize', textAlign: 'center' }}>{action.replace('_', ' ')}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {features.map(feature => {
                                    return (
                                        <tr key={feature.id}>
                                            <td style={{ fontWeight: 600 }}>{t(feature.nav.labelKey) || feature.id}</td>
                                            {actions.map(action => {
                                                const isSupported = feature.permissions.supportedActions?.includes(action) || action === ACTIONS.DATABASE_ACTIONS;
                                                if (!isSupported) {
                                                    return <td key={action} style={{ textAlign: 'center', color: 'var(--text-muted)' }}><Minus size={16}/></td>;
                                                }
                                                const allowed = isActionAllowed(action, feature.id, normalizedRole, rolePermissions);
                                                return (
                                                    <td key={action} style={{ textAlign: 'center' }}>
                                                        {allowed 
                                                            ? <Check size={18} className="ui-text-success" /> 
                                                            : <X size={18} className="ui-text-danger" />
                                                        }
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="ui-dialog-footer">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
};

export default EffectivePermissionsModal;
