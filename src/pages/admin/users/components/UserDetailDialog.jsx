import React from 'react';
import { Users, Trash2, Key, History, Clock } from 'lucide-react';
import { Dialog, Button, Badge } from '../../../../shared/components/ui';
import FormSelect from '../../components/FormSelect';

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
          <Dialog.Title className={"ui-dialog-title"}>
            <Users size={22} className={"ui-primary-icon"} /> User Account Profile
          </Dialog.Title>
          <Dialog.Close />
        </Dialog.Header>
        
        <Dialog.Body>
          <div className={"ui-detail-grid"}>
            <div className="ui-detail-item ui-detail-full">
              <span className={"ui-detail-label"}>Authentication Email</span>
              <span className="ui-detail-value ui-detail-value-large">
                {user.email}
              </span>
            </div>
            
            <div className="ui-detail-item ui-detail-half">
              <span className={"ui-detail-label"}>Display Name</span>
              <span className={"ui-detail-value"}>
                {user.displayName || <span className={"ui-empty-label"}>Not set</span>}
              </span>
            </div>
            
            <div className="ui-detail-item ui-detail-third">
              <span className={"ui-detail-label"}>Status & Security</span>
              <span className="ui-detail-value ui-status-container">
                {user.disabled ? (
                  <span className={"ui-status-disabled"}>● Disabled Account</span>
                ) : (
                  <span className={"ui-status-active"}>● Active Account</span>
                )}
              </span>
            </div>
            
            <div className="ui-detail-item ui-detail-half">
              <span className={"ui-detail-label"}>Administrative Role</span>
              {user.email === currentUser?.email ? (
                <div className={"ui-role-badge-container"}>
                  <Badge variant="success">
                    {user.role.toUpperCase()} (YOU)
                  </Badge>
                </div>
              ) : (
                <div className={"ui-role-select-container"}>
                  <FormSelect 
                    value={user.role}
                    onChange={(e) => onRoleChange(user.id, e.target.value)}
                    options={[
                      { label: 'Pending', value: 'pending' },
                      { label: 'Editor', value: 'editor' },
                      { label: 'Admin', value: 'admin' },
                      { label: 'Super Admin', value: 'superadmin' }
                    ]}
                  />
                </div>
              )}
            </div>
            
            <div className="ui-detail-item ui-detail-third">
              <span className={"ui-detail-label"}>Registration Date</span>
              <span className="ui-detail-value ui-date-value">
                {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}
              </span>
            </div>
            
            <div className="ui-detail-item ui-detail-full">
              <span className={"ui-detail-label"}>System Universal ID (UID)</span>
              <span className={"ui-mono-id"}>
                {user.id}
              </span>
            </div>
          </div>

          {/* Audit History */}
          <div className={"ui-history-section"}>
            <h4 className={"ui-history-title"}>
              <History size={18} className={"ui-primary-icon"} /> Audit & Edit History
            </h4>
            
            {historyLoading ? (
              <div className={"ui-history-loading"}>
                Loading history...
              </div>
            ) : history.length === 0 ? (
              <div className={"ui-empty-history"}>
                No edit history recorded yet.
              </div>
            ) : (
              <div className={"ui-history-container"}>
                {history.map((h, i) => (
                  <div key={h.id || `history-${i}`} className={"ui-history-item"}>
                    <div className={"ui-history-header"}>
                      <Badge variant={h.action === 'created' ? 'success' : h.action === 'deleted' ? 'error' : 'primary'}>
                        {h.action}
                      </Badge>
                      <span className={"ui-history-time"}>
                        <Clock size={12} /> 
                        {h.timestamp?.seconds ? new Date(h.timestamp.seconds * 1000).toLocaleString() : 'Pending...'}
                      </span>
                    </div>
                    
                    <div className={"ui-history-action-text"}>
                      {h.action === 'updated' && h.newData ? (
                        <div className={"ui-diff-container"}>
                          {Object.keys(h.newData).map(k => (
                            <div key={k} className={"ui-diff-line"}>
                              <code className={"ui-diff-key"}>{k}</code>
                              <span className={"ui-diff-old"}>{String(h.previousData?.[k])}</span>
                              <span className={"ui-history-arrow"}>→</span>
                              <span className={"ui-diff-new"}>{String(h.newData[k])}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span>Account {h.action}</span>
                      )}
                    </div>
                    <div className={"ui-history-user"}>
                      by: <span className={"ui-history-user-name"}>{h.user || 'System'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Dialog.Body>
        
        <Dialog.Footer>
          <div className={"ui-footer-actions-container"}>
            <div>
              {user.email !== currentUser?.email && (
                <Button variant="danger" onClick={() => onDisable(user)}>
                  <Trash2 size={16} /> {user.disabled ? 'Re-enable Account' : 'Disable Account'}
                </Button>
              )}
            </div>
            <div className={"ui-footer-actions-right"}>
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
