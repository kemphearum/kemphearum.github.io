import React from 'react';
import { useTranslation } from '../../../../hooks/useTranslation';
import { formatRoleDisplayName } from '../../../../utils/permissions';
import { Shield, Plus, Trash2, ShieldAlert, Users, Info, GitCompare } from 'lucide-react';
import clsx from 'clsx';
import { Button } from '@/shared/components/ui';

const ROLE_ICONS = {
    admin: ShieldAlert,
    editor: Shield,
    author: Users,
    viewer: Info
};

const UserManagementRoleList = ({
    allRoles,
    selectedRole,
    setSelectedRole,
    rolePermissions,
    onAddRole,
    onDeleteRole,
    hasUnsavedChanges,
    requestConfirm,
    onCompare,
    getPermissionsForRole
}) => {
    const { t } = useTranslation();

    const handleRoleSelect = (role) => {
        if (role === selectedRole) return;
        
        const performSwitch = () => setSelectedRole(role);
        if (hasUnsavedChanges) {
            requestConfirm({
                title: t('admin.auth.permissions.discardConfirmTitle') || 'Discard Unsaved Changes?',
                message: t('admin.auth.permissions.discardConfirm') || 'You have unsaved changes. Discard and switch roles?',
                confirmLabel: t('admin.auth.permissions.discardAndSwitch') || 'Discard & Switch',
                confirmVariant: 'danger',
                tone: 'warning',
                onConfirm: performSwitch
            });
        } else {
            performSwitch();
        }
    };

    return (
        <div className="auth-role-list-panel">
            <div className="role-list-header">
                <h4 className="ui-heading ui-m-0">{t('admin.auth.tabs.roles') || 'Roles'}</h4>
                <div className="ui-flex-center-gap-small">
                    <Button variant="ghost" size="sm" onClick={onCompare} title={t('admin.auth.permissions.compareRoles') || 'Compare Roles'}>
                        <GitCompare size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onAddRole} className="add-role-btn">
                        <Plus size={16} /> {t('common.add') || 'Add'}
                    </Button>
                </div>
            </div>
            
            <div className="role-list-scroll">
                {allRoles.map(role => {
                    const isSystem = ['superadmin', 'admin', 'editor', 'author', 'viewer', 'pending'].includes(role);
                    const config = getPermissionsForRole ? getPermissionsForRole(role) : (rolePermissions && rolePermissions[role]);
                    const baseRole = config?.baseRole;
                    const Icon = ROLE_ICONS[role] || ROLE_ICONS[baseRole] || Shield;
                    const isActive = selectedRole === role;

                    let permCount = 0;
                    if (config) {
                        permCount += (config.allowedTabs || []).length;
                        Object.values(config.allowedActions || {}).forEach(actions => {
                            permCount += actions.length;
                        });
                    }

                    return (
                        <div 
                            key={role} 
                            className={clsx("role-list-item", isActive && "active")}
                            onClick={() => handleRoleSelect(role)}
                        >
                            <div className="role-item-main">
                                <Icon size={18} className={clsx("role-icon", `role-${role}`)} />
                                <div className="role-details">
                                    <div className="role-name">{formatRoleDisplayName(role)}</div>
                                    <div className="role-meta">
                                        {isSystem ? (
                                            <span className="ui-badge ui-badge-secondary ui-text-xs">System</span>
                                        ) : (
                                            <span className="ui-text-xs ui-text-muted">Base: {formatRoleDisplayName(baseRole)}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="role-item-right">
                                <div className="perm-dot-badge" title={`${permCount} permissions granted`}>
                                    {permCount}
                                </div>
                                {isActive && !isSystem && (
                                    <div className="role-item-actions">
                                        <button 
                                            className="action-btn delete-btn" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteRole(role);
                                            }}
                                            title={t('admin.auth.permissions.deleteRole') || 'Delete Role'}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default UserManagementRoleList;
