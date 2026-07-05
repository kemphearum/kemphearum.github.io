import React, { useMemo } from 'react';
import { useTranslation } from '../../../../hooks/useTranslation';
import { ACTIONS } from '../../../../utils/permissions';
import { Search, Save, AlertTriangle, RefreshCw, ChevronDown, ChevronRight, CheckSquare, Square, X } from 'lucide-react';
import { Button, Input } from '@/shared/components/ui';
import AuthPermissionCategory from './AuthPermissionCategory';

const AuthPermissionTree = ({
    categories,
    allActions,
    localPermissions,
    setLocalPermissions,
    searchQuery,
    setSearchQuery,
    expandedCategories,
    setExpandedCategories,
    toggleTab,
    toggleAction,
    toggleCategoryExpanded,
    hasUnsavedChanges,
    selectedRole,
    resetToDefault,
    handleSave,
    saving,
    allRoles,
    copyFromRole
}) => {
    const { t } = useTranslation();

    const filteredCategories = useMemo(() => {
        return Object.keys(categories).reduce((acc, cat) => {
            const filtered = categories[cat].filter(f => {
                const title = t(f.nav?.labelKey || '') || f.id;
                return title.toLowerCase().includes(searchQuery.toLowerCase());
            });
            if (filtered.length > 0) acc[cat] = filtered;
            return acc;
        }, {});
    }, [categories, searchQuery, t]);

    const handleGlobalGrantAll = () => {
        const newAllowedTabs = [];
        const newAllowedActions = {};
        
        Object.values(categories).flat().forEach(f => {
            newAllowedTabs.push(f.id);
            newAllowedActions[f.id] = f.permissions.supportedActions.filter(a => a !== ACTIONS.VIEW);
        });
        
        setLocalPermissions(prev => ({
            ...prev,
            allowedTabs: newAllowedTabs,
            allowedActions: newAllowedActions
        }));
    };

    const handleGlobalRemoveAll = () => {
        setLocalPermissions(prev => ({
            ...prev,
            allowedTabs: [],
            allowedActions: {}
        }));
    };

    const handleGlobalGrantCRUD = () => {
        const crudActions = [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE];
        const newAllowedTabs = [];
        const newAllowedActions = {};
        
        Object.values(categories).flat().forEach(f => {
            if (f.permissions.supportedActions.includes(ACTIONS.VIEW)) {
                newAllowedTabs.push(f.id);
            }
            newAllowedActions[f.id] = f.permissions.supportedActions.filter(a => crudActions.includes(a) && a !== ACTIONS.VIEW);
        });
        
        setLocalPermissions(prev => ({
            ...prev,
            allowedTabs: newAllowedTabs,
            allowedActions: newAllowedActions
        }));
    };

    const handleGlobalGrantReadOnly = () => {
        const newAllowedTabs = [];
        
        Object.values(categories).flat().forEach(f => {
            if (f.permissions.supportedActions.includes(ACTIONS.VIEW)) {
                newAllowedTabs.push(f.id);
            }
        });
        
        setLocalPermissions(prev => ({
            ...prev,
            allowedTabs: newAllowedTabs,
            allowedActions: {}
        }));
    };

    const handleExpandAll = () => {
        const allExpanded = Object.keys(filteredCategories).reduce((acc, cat) => ({ ...acc, [cat]: true }), {});
        setExpandedCategories(prev => ({ ...prev, ...allExpanded }));
    };

    const handleCollapseAll = () => {
        const allCollapsed = Object.keys(filteredCategories).reduce((acc, cat) => ({ ...acc, [cat]: false }), {});
        setExpandedCategories(prev => ({ ...prev, ...allCollapsed }));
    };

    return (
        <div className="auth-permission-tree-panel">
            <div className="sticky-action-toolbar">
                <div className="toolbar-top">
                    <div>
                        <h3 className="ui-heading ui-m-0">{t('admin.auth.permissions.editingRole') || 'Editing Role'}: <span className="ui-text-primary" style={{ textTransform: 'capitalize' }}>{selectedRole}</span></h3>
                        {hasUnsavedChanges && (
                            <span className="ui-text-sm ui-text-warning ui-flex-center-gap-small ui-mt-xs">
                                <AlertTriangle size={14} /> {t('admin.auth.permissions.unsavedChanges') || 'Unsaved changes'}
                            </span>
                        )}
                    </div>
                    <div className="ui-flex-center-gap-small">
                        <Button variant="outline" onClick={resetToDefault}>
                            <RefreshCw size={16} /> <span className="hide-mobile">{t('admin.auth.permissions.resetDefault') || 'Reset Default'}</span>
                        </Button>
                        <Button variant={hasUnsavedChanges ? "primary" : "outline"} onClick={handleSave} isLoading={saving} disabled={!hasUnsavedChanges}>
                            <Save size={16} /> <span className="hide-mobile">{t('admin.auth.permissions.saveChanges') || 'Save Changes'}</span>
                        </Button>
                    </div>
                </div>
                
                <div className="toolbar-bottom">
                    <div className="search-container">
                        <div className="search-input-wrapper" style={{ position: 'relative', width: '100%' }}>
                            <Input 
                                placeholder={t('admin.auth.permissions.searchModules') || 'Search permissions & modules...'} 
                                icon={Search}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button 
                                    className="ui-btn-icon" 
                                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}
                                    onClick={() => setSearchQuery('')}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="ui-flex-center-gap-small action-buttons">
                        <select 
                            className="ui-input ui-input-sm" 
                            onChange={(e) => {
                                const val = e.target.value;
                                if(val === 'grant_all') handleGlobalGrantAll();
                                if(val === 'remove_all') handleGlobalRemoveAll();
                                if(val === 'grant_crud') handleGlobalGrantCRUD();
                                if(val === 'grant_readonly') handleGlobalGrantReadOnly();
                                e.target.value = "";
                            }}
                            defaultValue=""
                        >
                            <option value="" disabled>{t('admin.auth.permissions.bulkActions') || 'Bulk Actions...'}</option>
                            <option value="grant_readonly">{t('admin.auth.permissions.grantReadOnly') || 'Grant Read Only'}</option>
                            <option value="grant_crud">{t('admin.auth.permissions.grantCRUD') || 'Grant CRUD'}</option>
                            <option value="grant_all">{t('admin.auth.permissions.grantAll') || 'Grant All'}</option>
                            <option value="remove_all">{t('admin.auth.permissions.removeAll') || 'Clear All'}</option>
                        </select>
                        <Button variant="ghost" size="sm" onClick={handleExpandAll}>{t('admin.auth.permissions.expandAll') || 'Expand All'}</Button>
                        <Button variant="ghost" size="sm" onClick={handleCollapseAll}>{t('admin.auth.permissions.collapseAll') || 'Collapse All'}</Button>
                        
                        <div className="copy-role-selector">
                            <select 
                                className="ui-input ui-input-sm" 
                                onChange={(e) => {
                                    if(e.target.value) copyFromRole(e.target.value);
                                    e.target.value = "";
                                }}
                                defaultValue=""
                            >
                                <option value="" disabled>{t('admin.auth.permissions.copyFrom') || 'Copy from...'}</option>
                                {allRoles.filter(r => r !== selectedRole).map(r => (
                                    <option key={r} value={r} style={{ textTransform: 'capitalize' }}>{r}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="permission-tree-content">
                {Object.keys(filteredCategories).length === 0 ? (
                    <div className="ui-text-center ui-p-large ui-text-muted">
                        {t('admin.auth.permissions.noResults') || 'No features match your search.'}
                    </div>
                ) : (
                    <div className="permission-accordion">
                        {Object.entries(filteredCategories).map(([cat, catsFeatures]) => (
                            <AuthPermissionCategory 
                                key={cat}
                                categoryName={cat}
                                features={catsFeatures}
                                allActions={allActions}
                                isExpanded={expandedCategories[cat]}
                                onToggleExpand={() => toggleCategoryExpanded(cat)}
                                localPermissions={localPermissions}
                                toggleTab={toggleTab}
                                toggleAction={toggleAction}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthPermissionTree;
