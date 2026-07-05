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
import ConfirmDialog from '../../../../shared/components/dialog/ConfirmDialog';
import AuthRoleList from './AuthRoleList';
import AuthPermissionTree from './AuthPermissionTree';
import AuthRoleCompareDialog from './AuthRoleCompareDialog';
import { checkDependencies } from '../utils/permissionDependencies';
import './AuthPermissionsPanel.scss';

const AuthPermissionsPanel = ({ showToast, userRole }) => {
    const { t } = useTranslation();
    const { trackRead, trackWrite } = useActivity();
    
    const [selectedRole, setSelectedRole] = useState('editor');
    const [localPermissions, setLocalPermissions] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState({ content: true, system: true, analytics: true, database: true, communication: true });
    const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
    const [isCompareOpen, setIsCompareOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [newBaseRole, setNewBaseRole] = useState('viewer');
    const [deletingRole, setDeletingRole] = useState(null);
    
    const [confirmDialogState, setConfirmDialogState] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        confirmLabel: 'Confirm',
        tone: 'warning',
        confirmVariant: 'primary'
    });

    const requestConfirm = (config) => {
        setConfirmDialogState(prev => ({ ...prev, ...config, isOpen: true }));
    };

    const handleConfirmAction = () => {
        if (confirmDialogState.onConfirm) {
            confirmDialogState.onConfirm();
        }
        setConfirmDialogState(prev => ({ ...prev, isOpen: false }));
    };
    
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
        
        const performAddRole = () => {
            setSelectedRole(cleanName);
            setLocalPermissions({
                baseRole: newBaseRole,
                allowedTabs: [],
                allowedActions: {}
            });
            setIsAddRoleOpen(false);
        };
        
        if (hasUnsavedChanges) {
            requestConfirm({
                title: t('admin.auth.permissions.discardConfirmTitle') || 'Discard Unsaved Changes?',
                message: t('admin.auth.permissions.discardConfirm') || 'You have unsaved changes. Discard and switch roles?',
                confirmLabel: 'Discard & Switch',
                confirmVariant: 'danger',
                tone: 'warning',
                onConfirm: performAddRole
            });
            return;
        }
        
        performAddRole();
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

    const getPermissionsForRole = (role) => {
        if (role === selectedRole && localPermissions) {
            return localPermissions;
        }
        return rolePermissions?.[role] || { allowedTabs: [], allowedActions: {} };
    };

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
            const isGranted = !prev.allowedTabs.includes(tabId);
            const currentActions = prev.allowedActions[tabId] || [];
            
            // Check dependencies if revoking view (might affect children)
            if (!isGranted) {
                const warnings = checkDependencies(ACTIONS.VIEW, false, currentActions, true);
                if (warnings.length > 0) {
                    warnings.forEach(w => showToast(w, 'warning'));
                }
            }

            const allowedTabs = isGranted
                ? [...prev.allowedTabs, tabId]
                : prev.allowedTabs.filter(id => id !== tabId);
            return { ...prev, allowedTabs };
        });
    };

    const toggleAction = (tabId, action) => {
        setLocalPermissions(prev => {
            const modActions = prev.allowedActions[tabId] || [];
            const isGranted = !modActions.includes(action);
            const hasViewAccess = prev.allowedTabs.includes(tabId);
            
            const warnings = checkDependencies(action, isGranted, modActions, hasViewAccess);
            if (warnings.length > 0) {
                // We use setTimeout to ensure toasts render without blocking state update
                setTimeout(() => warnings.forEach(w => showToast(w, 'warning')), 0);
            }

            const newModActions = isGranted
                ? [...modActions, action]
                : modActions.filter(a => a !== action);
            
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
        const performReset = () => {
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

        requestConfirm({
            title: t('admin.auth.permissions.resetConfirmTitle') || 'Reset to Default?',
            message: t('admin.auth.permissions.resetConfirm') || 'Are you sure you want to reset this role to its default permissions? All unsaved changes will be lost.',
            confirmLabel: 'Reset Permissions',
            confirmVariant: 'danger',
            tone: 'warning',
            onConfirm: performReset
        });
    };

    const copyFromRole = (sourceRole) => {
        const performCopy = () => {
            const config = rolePermissions[sourceRole] || { allowedTabs: [], allowedActions: {} };
            setLocalPermissions({
                baseRole: config.baseRole || sourceRole,
                allowedTabs: [...(config.allowedTabs || [])],
                allowedActions: JSON.parse(JSON.stringify(config.allowedActions || {}))
            });
        };

        requestConfirm({
            title: t('admin.auth.permissions.copyConfirmTitle') || 'Copy Permissions?',
            message: t('admin.auth.permissions.copyConfirm', { source: formatRoleDisplayName(sourceRole), target: formatRoleDisplayName(selectedRole) }) || `Are you sure you want to copy permissions from ${formatRoleDisplayName(sourceRole)}? This will overwrite your current unsaved changes for ${formatRoleDisplayName(selectedRole)}.`,
            confirmLabel: 'Copy Permissions',
            confirmVariant: 'primary',
            tone: 'info',
            onConfirm: performCopy
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

    return (
        <div className="auth-permissions-panel two-panel-layout">
            <AuthRoleList 
                allRoles={allRoles}
                selectedRole={selectedRole}
                setSelectedRole={setSelectedRole}
                rolePermissions={rolePermissions}
                onAddRole={handleAddRole}
                onDeleteRole={(role) => setDeletingRole(role)}
                hasUnsavedChanges={hasUnsavedChanges}
                requestConfirm={requestConfirm}
                onCompare={() => setIsCompareOpen(true)}
                getPermissionsForRole={getPermissionsForRole}
            />

            <AuthPermissionTree 
                categories={categories}
                allActions={allActions}
                localPermissions={localPermissions}
                setLocalPermissions={setLocalPermissions}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                expandedCategories={expandedCategories}
                setExpandedCategories={setExpandedCategories}
                toggleTab={toggleTab}
                toggleAction={toggleAction}
                toggleCategoryExpanded={toggleCategoryExpanded}
                hasUnsavedChanges={hasUnsavedChanges}
                selectedRole={selectedRole}
                resetToDefault={resetToDefault}
                handleSave={handleSave}
                saving={saving}
                allRoles={allRoles}
                copyFromRole={copyFromRole}
            />

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

            <ConfirmDialog 
                open={confirmDialogState.isOpen}
                onOpenChange={(open) => !open && setConfirmDialogState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleConfirmAction}
                title={confirmDialogState.title}
                message={confirmDialogState.message}
                confirmLabel={confirmDialogState.confirmLabel}
                confirmVariant={confirmDialogState.confirmVariant}
                tone={confirmDialogState.tone}
            />
            
            <AuthRoleCompareDialog 
                open={isCompareOpen}
                onOpenChange={setIsCompareOpen}
                allRoles={allRoles}
                rolePermissions={rolePermissions}
                features={features}
                allActions={allActions}
            />
        </div>
    );
};

export default AuthPermissionsPanel;
