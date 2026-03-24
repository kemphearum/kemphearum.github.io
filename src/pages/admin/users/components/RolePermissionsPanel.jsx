import React, { useState } from 'react';
import { tabLabels } from '../../components/constants';
import { Button } from '../../../../shared/components/ui';

const RolePermissionsPanel = ({ rolePermissions, onSave }) => {
  const [showRolePerms, setShowRolePerms] = useState(false);
  const [editingRolePerms, setEditingRolePerms] = useState({});

  const managedRoles = ['pending', 'editor', 'admin'];
  const allTabs = Object.keys(tabLabels).filter(t => t !== 'profile' && t !== 'users');

  const handleToggleEditor = () => {
    if (!showRolePerms) {
      const initial = {};
      managedRoles.forEach(r => { 
        initial[r] = [...(rolePermissions[r] || [])]; 
      });
      setEditingRolePerms(initial);
    }
    setShowRolePerms(!showRolePerms);
  };

  const handleTabToggle = (role, tab) => {
    const current = [...(editingRolePerms[role] || [])];
    const updated = current.includes(tab) 
      ? current.filter(t => t !== tab) 
      : [...current, tab];
    setEditingRolePerms(prev => ({ ...prev, [role]: updated }));
  };

  return (
    <div className={"ui-role-panel-container"}>
      <div className={"ui-role-panel-header"}>
        <div>
          <h3 className={"ui-role-panel-title"}>Role Permissions</h3>
          <p className={"ui-role-panel-desc"}>
            Control which sidebar tabs each role can access.
          </p>
        </div>
        <Button onClick={handleToggleEditor}>
          {showRolePerms ? 'Close Editor' : '⚙️ Configure Permissions'}
        </Button>
      </div>

      {showRolePerms && (
        <div className={"ui-permissions-grid"}>
          {managedRoles.map(role => (
            <div key={role} className={"ui-role-block"}>
              <h4 className={"ui-role-title"}>
                {role === 'pending' ? '⏳ Pending' : role === 'editor' ? '✍️ Editor' : '🛡️ Admin'} Role
              </h4>
              <div className={"ui-tabs-list"}>
                {allTabs.map(tab => {
                  const checked = (editingRolePerms[role] || []).includes(tab);
                  return (
                    <label 
                      key={tab} 
                      className="ui-tab-label ${checked ? ui-active : }"
                    >
                      <input 
                        type="checkbox" 
                        checked={checked} 
                        onChange={() => handleTabToggle(role, tab)}
                        style={{ display: 'none' }}
                      />
                      {tabLabels[tab]}
                    </label>
                  );
                })}
              </div>
              <Button 
                onClick={() => onSave(role, editingRolePerms[role] || [])}
                variant="ghost" 
                size="sm"
                className={"ui-role-save-btn"}
              >
                Save {role} permissions
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RolePermissionsPanel;
