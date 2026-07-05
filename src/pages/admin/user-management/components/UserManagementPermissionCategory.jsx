import React, { memo } from 'react';
import { useTranslation } from '../../../../hooks/useTranslation';
import { ACTIONS } from '../../../../utils/permissions';
import { ChevronRight, ChevronDown, CheckSquare, Square, X } from 'lucide-react';
import clsx from 'clsx';
import { Button } from '@/shared/components/ui';

const UserManagementPermissionCategory = ({
    categoryName,
    features,
    allActions,
    isExpanded,
    onToggleExpand,
    localPermissions,
    toggleTab,
    toggleAction
}) => {
    const { t } = useTranslation();

    // Calculate category stats
    let enabledCount = 0;
    
    features.forEach(f => {
        const hasAccess = localPermissions.allowedTabs.includes(f.id);
        if (hasAccess) enabledCount++; // Count view access
        
        const allowedActions = localPermissions.allowedActions[f.id] || [];
        allActions.forEach(action => {
            if (action !== ACTIONS.VIEW && f.permissions.supportedActions.includes(action) && allowedActions.includes(action)) {
                enabledCount++;
            }
        });
    });

    const handleGrantAll = (e) => {
        e.stopPropagation();
        features.forEach(f => {
            if (!localPermissions.allowedTabs.includes(f.id)) {
                toggleTab(f.id);
            }
            allActions.forEach(action => {
                if (action !== ACTIONS.VIEW && f.permissions.supportedActions.includes(action)) {
                    const currentActions = localPermissions.allowedActions[f.id] || [];
                    if (!currentActions.includes(action)) {
                        toggleAction(f.id, action);
                    }
                }
            });
        });
    };

    const handleRemoveAll = (e) => {
        e.stopPropagation();
        features.forEach(f => {
            if (localPermissions.allowedTabs.includes(f.id)) {
                toggleTab(f.id);
            }
            allActions.forEach(action => {
                if (action !== ACTIONS.VIEW && f.permissions.supportedActions.includes(action)) {
                    const currentActions = localPermissions.allowedActions[f.id] || [];
                    if (currentActions.includes(action)) {
                        toggleAction(f.id, action);
                    }
                }
            });
        });
    };

    const handleGrantCRUD = (e) => {
        e.stopPropagation();
        const crudActions = [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE];
        
        features.forEach(f => {
            if (!localPermissions.allowedTabs.includes(f.id) && f.permissions.supportedActions.includes(ACTIONS.VIEW)) {
                toggleTab(f.id);
            }
            crudActions.forEach(action => {
                if (action !== ACTIONS.VIEW && f.permissions.supportedActions.includes(action)) {
                    const currentActions = localPermissions.allowedActions[f.id] || [];
                    if (!currentActions.includes(action)) {
                        toggleAction(f.id, action);
                    }
                }
            });
        });
    };

    const handleGrantReadOnly = (e) => {
        e.stopPropagation();
        
        features.forEach(f => {
            if (!localPermissions.allowedTabs.includes(f.id) && f.permissions.supportedActions.includes(ACTIONS.VIEW)) {
                toggleTab(f.id);
            }
            allActions.forEach(action => {
                if (action !== ACTIONS.VIEW && f.permissions.supportedActions.includes(action)) {
                    const currentActions = localPermissions.allowedActions[f.id] || [];
                    if (currentActions.includes(action)) {
                        toggleAction(f.id, action); // Toggle to remove
                    }
                }
            });
        });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleExpand();
        }
    };

    return (
        <div className="permission-category">
            <div 
                className="category-header" 
                onClick={onToggleExpand}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                onKeyDown={handleKeyDown}
            >
                <div className="category-title">
                    {isExpanded ? <ChevronDown size={20} aria-hidden="true" /> : <ChevronRight size={20} aria-hidden="true" />}
                    <span className="title-text" style={{ textTransform: 'capitalize' }}>
                        {t(`admin.auth.permissions.categories.${categoryName}`) || categoryName.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="ui-badge ui-badge-secondary ui-text-xs count-badge">
                        {enabledCount > 0 ? `${enabledCount} active` : '0 active'}
                    </span>
                </div>
                
                {isExpanded && (
                    <div className="category-actions" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={handleGrantReadOnly}>{t('admin.auth.permissions.grantReadOnly') || 'Read Only'}</Button>
                        <Button variant="ghost" size="sm" onClick={handleGrantCRUD}>{t('admin.auth.permissions.grantCRUD') || 'CRUD'}</Button>
                        <Button variant="ghost" size="sm" onClick={handleGrantAll}>{t('admin.auth.permissions.grantAll') || 'Grant All'}</Button>
                    </div>
                )}
            </div>
            
            {isExpanded && (
                <div className="category-body">
                    {features.map(feature => {
                        const hasAccess = localPermissions.allowedTabs.includes(feature.id);
                        const allowedActions = localPermissions.allowedActions[feature.id] || [];

                        return (
                            <div key={feature.id} className={clsx("feature-row", !hasAccess && "disabled")}>
                                <div className="feature-name">
                                    {feature.nav?.icon && <feature.nav.icon size={16} className="feature-icon" />}
                                    {t(feature.nav?.labelKey || '') || feature.id}
                                </div>
                                
                                <div className="feature-actions-grid">
                                    {allActions.map(action => {
                                        const isSupported = feature.permissions.supportedActions.includes(action);
                                        
                                        if (!isSupported) {
                                            return null;
                                        }

                                        if (action === ACTIONS.VIEW) {
                                            return (
                                                <div key={action} className="action-toggle" onClick={() => toggleTab(feature.id)}>
                                                    <span className="action-label">{t('admin.auth.permissions.matrix.' + action) || action.replace('_', ' ')}</span>
                                                    {hasAccess ? <CheckSquare size={18} className="ui-text-primary" /> : <Square size={18} className="ui-text-muted" />}
                                                </div>
                                            );
                                        }

                                        const isGranted = allowedActions.includes(action);
                                        return (
                                            <div 
                                                key={action} 
                                                className={clsx("action-toggle", !hasAccess && "disabled-action")} 
                                                onClick={() => {
                                                    if (hasAccess) toggleAction(feature.id, action);
                                                }}
                                            >
                                                <span className="action-label">{t('admin.auth.permissions.matrix.' + action) || action.replace('_', ' ')}</span>
                                                {isGranted ? <CheckSquare size={18} className="ui-text-primary" /> : <Square size={18} className="ui-text-muted" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default memo(UserManagementPermissionCategory, (prevProps, nextProps) => {
    return (
        prevProps.isExpanded === nextProps.isExpanded &&
        prevProps.localPermissions === nextProps.localPermissions &&
        prevProps.categoryName === nextProps.categoryName &&
        prevProps.searchQuery === nextProps.searchQuery // Though not directly passed, just in case
    );
});
