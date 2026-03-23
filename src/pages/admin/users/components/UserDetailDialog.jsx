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
          <Dialog.Title className={styles.dialogTitle}>
            <Users size={22} className={styles.primaryIcon} /> User Account Profile
          </Dialog.Title>
          <Dialog.Close />
        </Dialog.Header>
        
        <Dialog.Body>
          <div className={styles.detailGrid}>
            <div className={`${styles.detailItem} ${styles.detailFull}`}>
              <span className={styles.detailLabel}>Authentication Email</span>
              <span className={`${styles.detailValue} ${styles.detailValueLarge}`}>
                {user.email}
              </span>
            </div>
            
            <div className={`${styles.detailItem} ${styles.detailHalf}`}>
              <span className={styles.detailLabel}>Display Name</span>
              <span className={styles.detailValue}>
                {user.displayName || <span className={styles.emptyLabel}>Not set</span>}
              </span>
            </div>
            
            <div className={`${styles.detailItem} ${styles.detailThird}`}>
              <span className={styles.detailLabel}>Status & Security</span>
              <span className={`${styles.detailValue} ${styles.statusContainer}`}>
                {user.disabled ? (
                  <span className={styles.statusDisabled}>● Disabled Account</span>
                ) : (
                  <span className={styles.statusActive}>● Active Account</span>
                )}
              </span>
            </div>
            
            <div className={`${styles.detailItem} ${styles.detailHalf}`}>
              <span className={styles.detailLabel}>Administrative Role</span>
              {user.email === currentUser?.email ? (
                <div className={styles.roleBadgeContainer}>
                  <Badge variant="success">
                    {user.role.toUpperCase()} (YOU)
                  </Badge>
                </div>
              ) : (
                <div className={styles.roleSelectContainer}>
                  <select 
                    className={`ui-input ${styles.roleSelect}`}
                    value={user.role}
                    onChange={(e) => onRoleChange(user.id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className={`${styles.detailItem} ${styles.detailThird}`}>
              <span className={styles.detailLabel}>Registration Date</span>
              <span className={`${styles.detailValue} ${styles.dateValue}`}>
                {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}
              </span>
            </div>
            
            <div className={`${styles.detailItem} ${styles.detailFull}`}>
              <span className={styles.detailLabel}>System Universal ID (UID)</span>
              <span className={styles.monoId}>
                {user.id}
              </span>
            </div>
          </div>

          {/* Audit History */}
          <div className={styles.historySection}>
            <h4 className={styles.historyTitle}>
              <History size={18} className={styles.primaryIcon} /> Audit & Edit History
            </h4>
            
            {historyLoading ? (
              <div className={styles.historyLoading}>
                Loading history...
              </div>
            ) : history.length === 0 ? (
              <div className={styles.emptyHistory}>
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
                    
                    <div className={styles.historyActionText}>
                      {h.action === 'updated' && h.newData ? (
                        <div className={styles.diffContainer}>
                          {Object.keys(h.newData).map(k => (
                            <div key={k} className={styles.diffLine}>
                              <code className={styles.diffKey}>{k}</code>
                              <span className={styles.diffOld}>{String(h.previousData?.[k])}</span>
                              <span className={styles.historyArrow}>→</span>
                              <span className={styles.diffNew}>{String(h.newData[k])}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span>Account {h.action}</span>
                      )}
                    </div>
                    <div className={styles.historyUser}>
                      by: <span className={styles.historyUserName}>{h.user || 'System'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Dialog.Body>
        
        <Dialog.Footer>
          <div className={styles.footerActionsContainer}>
            <div>
              {user.email !== currentUser?.email && (
                <Button variant="danger" onClick={() => onDisable(user)}>
                  <Trash2 size={16} /> {user.disabled ? 'Re-enable Account' : 'Disable Account'}
                </Button>
              )}
            </div>
            <div className={styles.footerActionsRight}>
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
