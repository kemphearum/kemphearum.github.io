import React from 'react';
import { Users, Trash2, Key, History, Clock } from 'lucide-react';
import { Dialog, Button, Badge } from '../../../../shared/components/ui';
import FormSelect from '../../components/FormSelect';
import styles from '../UsersTab.module.scss';

const UserDetailDialog = ({ 
  user, 
  currentUser, 
  userRole, 
  history, 
  historyLoading,
  onClose,
  onRoleChange,
  onResetPassword,
  onDisable
}) => {
  if (!user) return null;

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <Dialog.Content maxWidth="650px">
        <Dialog.Header>
          <Dialog.Title style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={22} style={{ color: 'var(--primary-color)' }} /> User Account Profile
          </Dialog.Title>
          <Dialog.Close />
        </Dialog.Header>
        
        <Dialog.Body>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem} style={{ flex: '1 1 100%' }}>
              <span className={styles.detailLabel}>Authentication Email</span>
              <span className={styles.detailValue} style={{ fontSize: '1.15rem', fontWeight: 'bold', wordBreak: 'break-all' }}>
                {user.email}
              </span>
            </div>
            
            <div className={styles.detailItem} style={{ flex: '1 1 200px' }}>
              <span className={styles.detailLabel}>Display Name</span>
              <span className={styles.detailValue}>
                {user.displayName || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', opacity: 0.6 }}>Not set</span>}
              </span>
            </div>
            
            <div className={styles.detailItem} style={{ flex: '1 1 180px' }}>
              <span className={styles.detailLabel}>Status & Security</span>
              <span className={styles.detailValue} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {user.disabled ? (
                  <span style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>● Disabled Account</span>
                ) : (
                  <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>● Active Account</span>
                )}
              </span>
            </div>
            
            <div className={styles.detailItem} style={{ flex: '1 1 200px' }}>
              <span className={styles.detailLabel}>Administrative Role</span>
              {user.email === currentUser?.email ? (
                <div style={{ marginTop: '0.6rem' }}>
                  <Badge variant="success">
                    {user.role.toUpperCase()} (YOU)
                  </Badge>
                </div>
              ) : (
                <div style={{ marginTop: '0.4rem' }}>
                  <select 
                    className="ui-input" 
                    value={user.role}
                    onChange={(e) => onRoleChange(user.id, e.target.value)}
                    style={{ fontSize: '0.85rem', width: '100%' }}
                  >
                    <option value="pending">Pending</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className={styles.detailItem} style={{ flex: '1 1 180px' }}>
              <span className={styles.detailLabel}>Registration Date</span>
              <span className={styles.detailValue} style={{ fontSize: '0.9rem' }}>
                {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}
              </span>
            </div>
            
            <div className={styles.detailItem} style={{ flex: '1 1 100%' }}>
              <span className={styles.detailLabel}>System Universal ID (UID)</span>
              <span style={{ 
                fontFamily: 'monospace', 
                fontSize: '0.8rem', 
                color: 'var(--text-secondary)', 
                background: 'rgba(255,255,255,0.03)', 
                padding: '0.4rem 0.8rem', 
                borderRadius: '6px', 
                border: '1px solid rgba(255,255,255,0.05)', 
                display: 'block', 
                wordBreak: 'break-all' 
              }}>
                {user.id}
              </span>
            </div>
          </div>

          {/* Audit History */}
          <div style={{ marginTop: '2rem' }}>
            <h4 style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              fontSize: '1rem', 
              color: 'var(--text-primary)', 
              marginBottom: '1rem', 
              borderBottom: '1px solid rgba(255,255,255,0.05)', 
              paddingBottom: '0.5rem' 
            }}>
              <History size={18} style={{ color: 'var(--primary-color)' }} /> Audit & Edit History
            </h4>
            
            {historyLoading ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Loading history...
              </div>
            ) : history.length === 0 ? (
              <div style={{ 
                padding: '1.5rem', 
                textAlign: 'center', 
                border: '1px dashed rgba(255,255,255,0.1)', 
                borderRadius: '12px', 
                color: 'var(--text-secondary)', 
                fontSize: '0.85rem' 
              }}>
                No edit history recorded yet.
              </div>
            ) : (
              <div className={styles.historyContainer}>
                {history.map((h, i) => (
                  <div key={h.id || `history-${i}`} className={styles.historyItem}>
                    <div className={styles.historyHeader}>
                      <Badge variant={h.action === 'created' ? 'success' : h.action === 'deleted' ? 'error' : 'primary'}>
                        {h.action}
                      </Badge>
                      <span className={styles.historyTime}>
                        <Clock size={12} /> 
                        {h.timestamp?.seconds ? new Date(h.timestamp.seconds * 1000).toLocaleString() : 'Pending...'}
                      </span>
                    </div>
                    
                    <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      {h.action === 'updated' && h.newData ? (
                        <div className={styles.diffContainer}>
                          {Object.keys(h.newData).map(k => (
                            <div key={k} className={styles.diffLine}>
                              <code className={styles.diffKey}>{k}</code>
                              <span className={styles.diffOld}>{String(h.previousData?.[k])}</span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>→</span>
                              <span className={styles.diffNew}>{String(h.newData[k])}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span>Account {h.action}</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      by: <span style={{ color: 'var(--text-secondary)' }}>{h.user || 'System'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Dialog.Body>
        
        <Dialog.Footer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', width: '100%', justifyContent: 'space-between' }}>
            <div>
              {user.email !== currentUser?.email && (
                <Button variant="danger" onClick={() => onDisable(user)}>
                  <Trash2 size={16} /> {user.disabled ? 'Re-enable Account' : 'Disable Account'}
                </Button>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
              <Button variant="ghost" onClick={() => onResetPassword(user)}>
                <Key size={16} /> Reset Password
              </Button>
              <Button onClick={onClose} className="ui-primary">Done</Button>
            </div>
          </div>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

export default UserDetailDialog;
