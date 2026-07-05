import React, { useState, useMemo } from 'react';
import { useTranslation } from '../../../../hooks/useTranslation';
import { ACTIONS, formatRoleDisplayName } from '../../../../utils/permissions';
import { Dialog, Button } from '@/shared/components/ui';
import { GitCompare, Check, X, ShieldAlert, Shield, Users, Info } from 'lucide-react';
import './UserManagementRoleCompareDialog.scss';

const ROLE_ICONS = {
    admin: ShieldAlert,
    editor: Shield,
    author: Users,
    viewer: Info
};

const UserManagementRoleCompareDialog = ({ 
    open, 
    onOpenChange, 
    allRoles, 
    rolePermissions, 
    features,
    allActions
}) => {
    const { t } = useTranslation();
    const [role1, setRole1] = useState('');
    const [role2, setRole2] = useState('');
    const [showAll, setShowAll] = useState(false);

    const getPermissionsForRole = (role) => {
        if (!role || !rolePermissions) return null;
        return rolePermissions[role] || { allowedTabs: [], allowedActions: {} };
    };

    const r1Perms = getPermissionsForRole(role1);
    const r2Perms = getPermissionsForRole(role2);

    const differences = useMemo(() => {
        if (!r1Perms || !r2Perms) return [];
        const diffs = [];

        features.forEach(f => {
            const f1View = r1Perms.allowedTabs.includes(f.id);
            const f2View = r2Perms.allowedTabs.includes(f.id);
            
            const f1Actions = r1Perms.allowedActions[f.id] || [];
            const f2Actions = r2Perms.allowedActions[f.id] || [];

            const hasDiff = f1View !== f2View || allActions.some(a => {
                if (a === ACTIONS.VIEW) return false;
                if (!f.permissions.supportedActions.includes(a)) return false;
                return f1Actions.includes(a) !== f2Actions.includes(a);
            });

            if (hasDiff || showAll) {
                diffs.push({ feature: f, f1View, f2View, f1Actions, f2Actions, hasDiff });
            }
        });

        return diffs;
    }, [features, r1Perms, r2Perms, allActions, showAll]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.Content maxWidth="800px" className="role-compare-dialog">
                <Dialog.Header>
                    <Dialog.Title className="ui-flex-center-gap-small">
                        <GitCompare size={20} /> {t('admin.auth.permissions.compareRoles') || 'Compare Roles'}
                    </Dialog.Title>
                    <Dialog.Close />
                </Dialog.Header>
                <Dialog.Body>
                    <div className="compare-selectors ui-mb-medium">
                        <div className="selector-col">
                            <label className="ui-label">{t('admin.auth.permissions.role1') || 'Role 1'}</label>
                            <select 
                                className="ui-input" 
                                value={role1}
                                onChange={(e) => setRole1(e.target.value)}
                            >
                                <option value="" disabled>Select Role...</option>
                                {allRoles.map(r => (
                                    <option key={r} value={r}>{formatRoleDisplayName(r)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="compare-vs">VS</div>
                        <div className="selector-col">
                            <label className="ui-label">{t('admin.auth.permissions.role2') || 'Role 2'}</label>
                            <select 
                                className="ui-input" 
                                value={role2}
                                onChange={(e) => setRole2(e.target.value)}
                            >
                                <option value="" disabled>Select Role...</option>
                                {allRoles.map(r => (
                                    <option key={r} value={r}>{formatRoleDisplayName(r)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {!role1 || !role2 ? (
                        <div className="ui-text-center ui-p-large ui-text-muted">
                            {t('admin.auth.permissions.selectRolesToCompare') || 'Select two roles to see their differences.'}
                        </div>
                    ) : differences.length === 0 ? (
                        <div className="ui-text-center ui-p-large ui-text-success">
                            {t('admin.auth.permissions.noDifferences') || 'These roles have identical permissions.'}
                        </div>
                    ) : (
                        <div className="compare-results">
                            <table className="ui-table compare-table">
                                <thead>
                                    <tr>
                                        <th>{t('admin.auth.permissions.featureModule') || 'Feature'}</th>
                                        <th>{t('admin.auth.permissions.permission') || 'Permission'}</th>
                                        <th className="ui-text-center">{formatRoleDisplayName(role1)}</th>
                                        <th className="ui-text-center">{formatRoleDisplayName(role2)}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {differences.map(diff => {
                                        const rows = [];
                                        
                                        // Check VIEW
                                        if (diff.f1View !== diff.f2View || showAll) {
                                            rows.push(
                                                <tr key={`${diff.feature.id}-view`} className={diff.f1View === diff.f2View ? 'matched-row' : ''}>
                                                    <td className="feature-cell">{t(diff.feature.nav?.labelKey || '') || diff.feature.id}</td>
                                                    <td>{t('admin.auth.permissions.matrix.view') || 'View'}</td>
                                                    <td className="ui-text-center">{diff.f1View ? <Check size={16} className="ui-text-success" /> : <X size={16} className="ui-text-danger" />}</td>
                                                    <td className="ui-text-center">{diff.f2View ? <Check size={16} className="ui-text-success" /> : <X size={16} className="ui-text-danger" />}</td>
                                                </tr>
                                            );
                                        }

                                        // Check other actions
                                        allActions.forEach(a => {
                                            if (a === ACTIONS.VIEW || !diff.feature.permissions.supportedActions.includes(a)) return;
                                            const f1Has = diff.f1Actions.includes(a);
                                            const f2Has = diff.f2Actions.includes(a);
                                            if (f1Has !== f2Has || showAll) {
                                                rows.push(
                                                    <tr key={`${diff.feature.id}-${a}`} className={f1Has === f2Has ? 'matched-row' : ''}>
                                                        <td className="feature-cell">{t(diff.feature.nav?.labelKey || '') || diff.feature.id}</td>
                                                        <td>{t('admin.auth.permissions.matrix.' + a) || a.replace('_', ' ')}</td>
                                                        <td className="ui-text-center">{f1Has ? <Check size={16} className="ui-text-success" /> : <X size={16} className="ui-text-danger" />}</td>
                                                        <td className="ui-text-center">{f2Has ? <Check size={16} className="ui-text-success" /> : <X size={16} className="ui-text-danger" />}</td>
                                                    </tr>
                                                );
                                            }
                                        });

                                        return rows;
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    
                    {differences.length > 0 && (
                        <div className="ui-mt-medium ui-flex-end">
                            <label className="ui-flex-center-gap-small ui-text-sm ui-cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={showAll} 
                                    onChange={(e) => setShowAll(e.target.checked)} 
                                />
                                {t('admin.auth.permissions.showAllPermissions') || 'Show all permissions (including matches)'}
                            </label>
                        </div>
                    )}
                </Dialog.Body>
                <Dialog.Footer>
                    <Button onClick={() => onOpenChange(false)}>{t('common.close') || 'Close'}</Button>
                </Dialog.Footer>
            </Dialog.Content>
        </Dialog>
    );
};

export default UserManagementRoleCompareDialog;
