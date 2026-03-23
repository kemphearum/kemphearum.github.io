import React, { useState } from 'react';
import { tabLabels } from '../../components/constants';
import { Button } from '../../../../shared/components/ui';
import styles from '../UsersTab.module.scss';

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
    <div className={styles.rolePanelContainer}>
      <div className={styles.rolePanelHeader}>
        <div>
          <h3 className={styles.rolePanelTitle}>Role Permissions</h3>
          <p className={styles.rolePanelDesc}>
            Control which sidebar tabs each role can access.
          </p>
        </div>
        <Button onClick={handleToggleEditor}>
          {showRolePerms ? 'Close Editor' : '⚙️ Configure Permissions'}
        </Button>
      </div>

      {showRolePerms && (
        <div className={styles.permissionsGrid}>
          {managedRoles.map(role => (
            <div key={role} className={styles.roleBlock}>
              <h4 className={styles.roleTitle}>
                {role === 'pending' ? '⏳ Pending' : role === 'editor' ? '✍️ Editor' : '🛡️ Admin'} Role
              </h4>
              <div className={styles.tabsList}>
                {allTabs.map(tab => {
                  const checked = (editingRolePerms[role] || []).includes(tab);
                  return (
                    <label 
                      key={tab} 
                      className={`${styles.tabLabel} ${checked ? styles.active : ''}`}
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
                className={styles.roleSaveBtn}
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
