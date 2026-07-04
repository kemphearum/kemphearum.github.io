import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '../../../../hooks/useTranslation';
import { useQuery } from '@tanstack/react-query';
import UserService from '../../../../services/UserService';
import { useAsyncAction } from '../../../../hooks/useAsyncAction';
import { useActivity } from '../../../../hooks/useActivity';
import BaseService from '../../../../services/BaseService';
import PermissionService from '../../../../services/auth/PermissionService';
import { listFeatures } from '../../../../registry/featureRegistry';
import { ACTIONS, formatRoleDisplayName } from '../../../../utils/permissions';
import { Save, CheckSquare, Square, X, AlertTriangle, Search, Copy, RefreshCw, Trash2, ChevronDown, ChevronRight, UserPlus } from 'lucide-react';
import { Button, Spinner, EmptyState, Input, Dialog } from '@/shared/components/ui';
import DeleteConfirmDialog from '../../../../shared/components/dialog/DeleteConfirmDialog';
import clsx from 'clsx';
import './AuthPermissionsPanel.scss';

const AuthPermissionsPanel = ({ showToast, userRole }) => {
    const { t } = useTranslation();
    const { trackRead, trackWrite } = useActivity();
    
    const [selectedRole, setSelectedRole] = useState('editor');
    const [localPermissions, setLocalPermissions] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState({ content: true, system: true, analytics: true, database: true, communication: true });
    const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [newBaseRole, setNewBaseRole] = useState('viewer');
    const [deletingRole, setDeletingRole] = useState(null);
    
    // Derived from features
    const features = useMemo(() => listFeatures().filter(f => f.permissions?.supportedActions?.length > 0), []);
    
    const allActions = useMemo(() => {
        const actionSet = new Set();
        features.forEach(f => {
            f.permissions.supportedActions.forEach(a => actionSet.add(a));
        });
        // Ensure standard sort order if possible, or just array
        const standardOrder = Object.values(ACTIONS);
        return Array.from(actionSet).sort((a, b) => standardOrder.indexOf(a) - standardOrder.indexOf(b));
    }, [features]);

    const categories = useMemo(() => {
        const catMap = {};
        features.forEach(f => {
            if (!catMap[f.category]) catMap[f.category] = [];
            catMap[f.category].push(f);
        });
        return catMap;
    }, [features]);


    const { data: rolePermissions = {}, isLoading, refetch } = useQuery({
        staleTime: 60000,
        gcTime: 300000,
        refetchOnWindowFocus: false,
        queryKey: ['rolePermissions'],
        queryFn: async () => {
            const result = await BaseService.safe(() => UserService.fetchRolePermissions(trackRead));
            if (result.error) {
                showToast(result.error, 'error');
                return {};
            }
            return result.data || {};
        }
    });

    const allRoles = useMemo(() => {
        const base = ['admin', 'editor', 'author', 'viewer'];
        const custom = rolePermissions ? Object.keys(rolePermissions).filter(r => !base.includes(r)) : [];
        const combined = [...base, ...custom];
        if (selectedRole && !combined.includes(selectedRole)) {
            combined.push(selectedRole);
        }
        return combined;
    }, [rolePermissions, selectedRole]);

    const handleAddRole = () => {
        setIsAddRoleOpen(true);
        setNewRoleName('');
        setNewBaseRole('viewer');
    };

    const handleConfirmAddRole = (e) => {
        e.preventDefault();
        const roleName = newRoleName;
        if (!roleName) return;
        
        const cleanName = roleName.trim().toLowerCase().replace(/\s+/g, '');
        if (cleanName !== roleName.trim().toLowerCase() || !/^[a-z0-9_-]+$/.test(cleanName)) {
            showToast(t('admin.auth.permissions.invalidRoleName') || 'Role name must contain only letters, numbers, hyphens, or underscores.', 'error');
            return;
        }

        const reservedRoles = ['superadmin', 'admin', 'editor', 'author', 'viewer', 'pending', 'anonymous'];
        if (reservedRoles.includes(cleanName)) {
            showToast(t('admin.auth.permissions.reservedRoleName') || 'This role name is reserved and cannot be used.', 'error');
            return;
        }

        if (cleanName.length > 20) {
            showToast(t('admin.auth.permissions.roleNameTooLong') || 'Role name cannot exceed 20 characters.', 'error');
            return;
        }
        
        if (allRoles.includes(cleanName)) {
            showToast(t('admin.auth.permissions.roleExists') || 'Role already exists.', 'error');
            return;
        }
        
        if (hasUnsavedChanges && !window.confirm(t('admin.auth.permissions.discardConfirm') || 'You have unsaved changes. Discard and switch roles?')) return;
        
        setSelectedRole(cleanName);
        setLocalPermissions({
            baseRole: newBaseRole,
            allowedTabs: [],
            allowedActions: {}
        });
        setIsAddRoleOpen(false);
    };


    const { loading: saving, execute: executeSave } = useAsyncAction({
        showToast,
        errorMessage: t('admin.auth.permissions.saveError') || 'Failed to save permissions',
        invalidateKeys: [['rolePermissions']]
    });

    // Initialize local permissions
    useEffect(() => {
        if (!isLoading && rolePermissions) {
            const config = rolePermissions[selectedRole] || { allowedTabs: [], allowedActions: {} };
            setLocalPermissions({
                baseRole: config.baseRole || 'pending',
                allowedTabs: config.allowedTabs || [],
                allowedActions: config.allowedActions || {}
            });
        }
    }, [selectedRole, rolePermissions, isLoading]);

    const hasUnsavedChanges = (() => {
        if (isLoading || !localPermissions || !rolePermissions) return false;
        const config = rolePermissions[selectedRole] || { allowedTabs: [], allowedActions: {} };
        const oldTabs = [...(config.allowedTabs || [])].sort().join(',');
        const newTabs = [...(localPermissions.allowedTabs || [])].sort().join(',');
        if (oldTabs !== newTabs) return true;
        
        const oldActions = config.allowedActions || {};
        const newActions = localPermissions.allowedActions || {};
        const allKeys = new Set([...Object.keys(oldActions), ...Object.keys(newActions)]);
        for (let key of allKeys) {
            const oldA = [...(oldActions[key] || [])].sort().join(',');
            const newA = [...(newActions[key] || [])].sort().join(',');
            if (oldA !== newA) return true;
        }
        return false;
    })();

    const { loading: deleting, execute: executeDelete } = useAsyncAction({
        showToast,
        errorMessage: t('admin.auth.permissions.deleteError') || 'Failed to delete role',
        invalidateKeys: [['rolePermissions']]
    });

    const handleDeleteRole = async () => {
        if (!deletingRole) return;
        if (!PermissionService.can(userRole, PermissionService.ACTIONS.CONFIGURE, PermissionService.RESOURCES.USERS)) {
            return showToast(t('admin.auth.permissions.unauthorizedTitle') || 'Unauthorized', 'error');
        }

        await executeDelete(async () => {
            await UserService.deleteRoleAndReassignUsers(deletingRole, 'viewer', trackWrite, userRole);
            await refetch();
            setDeletingRole(null);
            setSelectedRole('viewer');
        }, {
            successMessage: t('admin.auth.permissions.deleteSuccess', { role: formatRoleDisplayName(deletingRole) }) || `Role ${formatRoleDisplayName(deletingRole)} has been deleted.`
        });
    };

    const handleSave = async () => {
        if (!PermissionService.can(userRole, PermissionService.ACTIONS.CONFIGURE, PermissionService.RESOURCES.USERS)) {
            return showToast(t('admin.auth.permissions.unauthorizedTitle') || 'Unauthorized', 'error');
        }

        await executeSave(async () => {
            await UserService.saveRolePermissions(
                selectedRole, 
                localPermissions.allowedTabs, 
                trackWrite, 
                localPermissions.baseRole, 
                localPermissions.allowedActions, 
                userRole
            );
            await refetch();
        }, {
            successMessage: t('admin.auth.permissions.saveSuccess', { role: formatRoleDisplayName(selectedRole) }) || `Permissions for ${formatRoleDisplayName(selectedRole)} saved.`
        });
    };

    const toggleTab = (tabId) => {
        setLocalPermissions(prev => {
            const allowedTabs = prev.allowedTabs.includes(tabId) 
                ? prev.allowedTabs.filter(id => id !== tabId)
                : [...prev.allowedTabs, tabId];
            return { ...prev, allowedTabs };
        });
    };

    const toggleAction = (tabId, action) => {
        setLocalPermissions(prev => {
            const modActions = prev.allowedActions[tabId] || [];
            const newModActions = modActions.includes(action)
                ? modActions.filter(a => a !== action)
                : [...modActions, action];
            
            return {
                ...prev,
                allowedActions: {
                    ...prev.allowedActions,
                    [tabId]: newModActions
                }
            };
        });
    };

    const toggleCategoryExpanded = (cat) => {
        setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    const resetToDefault = () => {
        if (!window.confirm(t('admin.auth.permissions.resetConfirm') || 'Are you sure you want to reset this role to its default permissions? All unsaved changes will be lost.')) return;
        
        const defaultTabs = [];
        const defaultActions = {};
        
        features.forEach(f => {
            const perms = f.permissions.defaultPermissions[selectedRole] || [];
            if (perms.length > 0) {
                defaultTabs.push(f.id);
                defaultActions[f.id] = perms;
            }
        });
        
        setLocalPermissions({
            baseRole: selectedRole,
            allowedTabs: defaultTabs,
            allowedActions: defaultActions
        });
    };

    const copyFromRole = (sourceRole) => {
        if (!window.confirm(t('admin.auth.permissions.copyConfirm', { source: formatRoleDisplayName(sourceRole), target: formatRoleDisplayName(selectedRole) }) || `Are you sure you want to copy permissions from ${formatRoleDisplayName(sourceRole)}? This will overwrite your current unsaved changes for ${formatRoleDisplayName(selectedRole)}.`)) return;
        const config = rolePermissions[sourceRole] || { allowedTabs: [], allowedActions: {} };
        setLocalPermissions({
            baseRole: config.baseRole || sourceRole,
            allowedTabs: [...(config.allowedTabs || [])],
            allowedActions: JSON.parse(JSON.stringify(config.allowedActions || {}))
        });
    };

    if (!PermissionService.can(userRole, PermissionService.ACTIONS.CONFIGURE, PermissionService.RESOURCES.USERS)) {
        return (
            <EmptyState 
                title={t('admin.auth.permissions.unauthorizedTitle') || 'Unauthorized'}
                description={t('admin.auth.permissions.unauthorizedDesc') || 'Only superadministrators can modify the system Permission Matrix.'}
                icon={AlertTriangle}
            />
        );
    }

    if (isLoading || !localPermissions) {
        return (
            <div className="ui-flex-center ui-p-large">
                <Spinner size="lg" />
            </div>
        );
    }

    const filteredCategories = Object.keys(categories).reduce((acc, cat) => {
        const filtered = categories[cat].filter(f => {
            const title = t(f.nav?.labelKey || '') || f.id;
            return title.toLowerCase().includes(searchQuery.toLowerCase());
        });
        if (filtered.length > 0) acc[cat] = filtered;
        return acc;
    }, {});

    return (
        <div className="auth-permissions-panel">
            <div className="ui-flex-between ui-mb-medium">
                <div>
                    <h3 className="ui-heading ui-m-0">{t('admin.auth.permissions.title') || 'Enterprise Permission Matrix'}</h3>
                    {hasUnsavedChanges && <span className="ui-text-sm ui-text-warning ui-flex-center-gap-small ui-mt-xs"><AlertTriangle size={14} /> {t('admin.auth.permissions.unsavedChanges') || 'Unsaved changes'}</span>}
                </div>
                <div className="ui-flex-center-gap-small">
                    <Button variant="outline" onClick={resetToDefault}>
                        <RefreshCw size={16} /> {t('admin.auth.permissions.resetDefault') || 'Reset Default'}
                    </Button>
                    {!['superadmin', 'admin', 'editor', 'author', 'viewer', 'pending'].includes(selectedRole) && (
                        <Button variant="danger" onClick={() => setDeletingRole(selectedRole)}>
                            <Trash2 size={16} /> {t('admin.auth.permissions.deleteRole') || 'Delete Role'}
                        </Button>
                    )}
                    <Button onClick={handleSave} isLoading={saving} disabled={!hasUnsavedChanges}>
                        <Save size={16} /> {t('admin.auth.permissions.saveChanges') || 'Save Changes'}
                    </Button>
                </div>
            </div>
            
            <div className="ui-mb-medium ui-flex-between">
                <div className="ui-tabs">
                    <div className="ui-tabs-list modern-pills">
                        {allRoles.map(role => (
                            <button 
                                key={role}
                                className={clsx("ui-tabs-trigger", selectedRole === role && "ui-tabs-trigger-active")}
                                onClick={() => {
                                    if (hasUnsavedChanges && !window.confirm(t('admin.auth.permissions.discardConfirm') || 'You have unsaved changes. Discard and switch roles?')) return;
                                    setSelectedRole(role);
                                }}
                            >
                                {formatRoleDisplayName(role)}
                                {!['admin', 'editor', 'author', 'viewer', 'superadmin', 'pending'].includes(role) && rolePermissions && rolePermissions[role] && rolePermissions[role].baseRole && (
                                    <span className="role-badge">
                                        {t('admin.auth.permissions.baseRoleBadge') || 'Base:'} {formatRoleDisplayName(rolePermissions[role].baseRole)}
                                    </span>
                                )}
                            </button>
                        ))}
                        <button 
                            className="ui-tabs-trigger add-role-btn"
                            onClick={handleAddRole}
                        >
                            {t('admin.auth.permissions.addRole') || '+ Add Role'}
                        </button>
                    </div>
                </div>
                
                <div className="ui-flex-center-gap-small">
                    <select 
                        className="ui-input" 
                        onChange={(e) => {
                            if(e.target.value) copyFromRole(e.target.value);
                            e.target.value = "";
                        }}
                        defaultValue=""
                    >
                        <option value="" disabled>{t('admin.auth.permissions.copyFrom') || 'Copy from...'}</option>
                        {allRoles.filter(r => r !== selectedRole).map(r => (
                            <option key={r} value={r}>{formatRoleDisplayName(r)}</option>
                        ))}
                    </select>
                    <div style={{ width: '250px' }}>
                        <Input 
                            placeholder={t('admin.auth.permissions.filterFeatures') || 'Filter features...'} 
                            icon={Search}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="ui-card ui-p-medium">
                <div className="permission-matrix-container">
                    <table className="permission-matrix">
                        <thead>
                            <tr>
                                <th className="sticky-col feature-col">{t('admin.auth.permissions.featureModule') || 'Feature Module'}</th>
                                {allActions.map(action => (
                                    <th key={action} className="ui-text-center action-col">
                                        <div className="action-header">{t('admin.auth.permissions.matrix.' + action) || action.replace('_', ' ')}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(filteredCategories).map(([cat, catsFeatures]) => (
                                <React.Fragment key={cat}>
                                    <tr className="category-row">
                                        <td colSpan={allActions.length + 1} onClick={() => toggleCategoryExpanded(cat)} style={{ cursor: 'pointer' }}>
                                            <div className="ui-flex-center-gap-small ui-text-bold">
                                                <ChevronRight size={16} className={clsx("chevron-icon", expandedCategories[cat] && "open")} />
                                                <span style={{ textTransform: 'capitalize' }}>{t(`admin.auth.permissions.categories.${cat}`) || cat.replace(/([A-Z])/g, ' $1').trim()} {t('admin.auth.permissions.modules') || 'Modules'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedCategories[cat] && catsFeatures.map(feature => {
                                        const hasAccess = localPermissions.allowedTabs.includes(feature.id);
                                        const allowedActions = localPermissions.allowedActions[feature.id] || [];

                                        return (
                                            <tr key={feature.id} className={clsx("feature-row", !hasAccess && "ui-opacity-50")}>
                                                <td className="sticky-col feature-col ui-flex-center-gap-small">
                                                    {feature.nav?.icon && <feature.nav.icon size={16} />}
                                                    {t(feature.nav?.labelKey || '') || feature.id}
                                                </td>
                                                
                                                {allActions.map(action => {
                                                    const isSupported = feature.permissions.supportedActions.includes(action);
                                                    
                                                    if (!isSupported) {
                                                        return (
                                                            <td key={action} className="ui-text-center not-applicable" title={t('admin.auth.permissions.notApplicable') || 'Not Applicable'}>
                                                                <X size={16} />
                                                            </td>
                                                        );
                                                    }

                                                    // For view action, it toggles tab access entirely
                                                    if (action === ACTIONS.VIEW) {
                                                        return (
                                                            <td key={action} className="ui-text-center">
                                                                <button 
                                                                    className={clsx("ui-btn-icon matrix-toggle", hasAccess && "granted")} 
                                                                    onClick={() => toggleTab(feature.id)}
                                                                >
                                                                    {hasAccess ? <CheckSquare size={20} /> : <Square size={20} />}
                                                                </button>
                                                            </td>
                                                        );
                                                    }

                                                    const isGranted = allowedActions.includes(action);
                                                    return (
                                                        <td key={action} className="ui-text-center">
                                                            <button 
                                                                className={clsx("ui-btn-icon matrix-toggle", isGranted && "granted")}
                                                                onClick={() => toggleAction(feature.id, action)}
                                                                disabled={!hasAccess}
                                                            >
                                                                {isGranted ? <CheckSquare size={20} /> : <Square size={20} />}
                                                            </button>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                            {Object.keys(filteredCategories).length === 0 && (
                                <tr>
                                    <td colSpan={allActions.length + 1} className="ui-text-center ui-p-large ui-text-muted">
                                        No features match your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
                <Dialog.Content maxWidth="400px">
                    <Dialog.Header>
                        <Dialog.Title><UserPlus size={18} /> {t('admin.auth.permissions.addRole') || 'Add New Role'}</Dialog.Title>
                        <Dialog.Close />
                    </Dialog.Header>
                    <form onSubmit={handleConfirmAddRole}>
                        <Dialog.Body>
                            <div className="ui-form-group">
                                <label className="ui-label">{t('admin.auth.permissions.roleName') || 'Role Name'}</label>
                                <Input 
                                    autoFocus
                                    placeholder={t('admin.auth.permissions.roleNamePlaceholder') || 'e.g. moderator, guest'} 
                                    value={newRoleName}
                                    onChange={(e) => setNewRoleName(e.target.value)}
                                    maxLength={20}
                                />
                                <p className="ui-text-sm ui-text-muted ui-mt-xs">
                                    {t('admin.auth.permissions.roleNameHelp') || 'Lowercase letters, numbers, hyphens, and underscores only.'}
                                </p>
                            </div>
                            <div className="ui-form-group ui-mt-medium">
                                <label className="ui-label">{t('admin.auth.permissions.baseRole') || 'Base Security Role'}</label>
                                <select 
                                    className="ui-input" 
                                    value={newBaseRole}
                                    onChange={(e) => setNewBaseRole(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--color-text)' }}
                                >
                                    <option value="viewer">{formatRoleDisplayName('viewer')}</option>
                                    <option value="author">{formatRoleDisplayName('author')}</option>
                                    <option value="editor">{formatRoleDisplayName('editor')}</option>
                                    <option value="admin">{formatRoleDisplayName('admin')}</option>
                                </select>
                                <p className="ui-text-sm ui-text-muted ui-mt-xs">
                                    {t('admin.auth.permissions.baseRoleHelp') || 'Determines the baseline backend Firestore capabilities for this custom role.'}
                                </p>
                            </div>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Button variant="outline" type="button" onClick={() => setIsAddRoleOpen(false)}>
                                {t('common.cancel') || 'Cancel'}
                            </Button>
                            <Button variant="primary" type="submit" disabled={!newRoleName.trim()}>
                                {t('common.create') || 'Create'}
                            </Button>
                        </Dialog.Footer>
                    </form>
                </Dialog.Content>
            </Dialog>

            <DeleteConfirmDialog 
                open={!!deletingRole}
                onOpenChange={(open) => !open && setDeletingRole(null)}
                onConfirm={handleDeleteRole}
                title={t('admin.auth.permissions.deleteConfirmTitle') || 'Delete Role'}
                description={t('admin.auth.permissions.deleteConfirmDesc', { role: formatRoleDisplayName(deletingRole || '') }) || `Are you sure you want to delete the '${formatRoleDisplayName(deletingRole || '')}' role? Any users with this role will be reassigned to 'Viewer'. This action cannot be undone.`}
                loading={deleting}
            />
        </div>
    );
};

export default AuthPermissionsPanel;
