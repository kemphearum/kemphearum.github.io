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
    <div style={{ marginTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', fontWeight: '600' }}>Role Permissions</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
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
                style={{ marginTop: '1rem' }}
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
