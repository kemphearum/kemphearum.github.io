import React from 'react';
import {
  Users,
  Trash2,
  Key,
  History,
  Clock,
  Shield,
  Mail,
  Fingerprint,
  CalendarDays,
} from 'lucide-react';
import { Dialog, Button, Badge } from '../../../../shared/components/ui';
import FormSelect from '../../components/FormSelect';

const ROLE_LABELS = {
  pending: 'Pending',
  editor: 'Editor',
  admin: 'Admin',
  superadmin: 'Super Admin',
};

const ROLE_VARIANTS = {
  pending: 'warning',
  editor: 'warning',
  admin: 'primary',
  superadmin: 'success',
};

const UserDetailDialog = ({
  user,
  currentUser,
  history,
  historyLoading,
  onClose,
  onRoleChange,
  onResetPassword,
  onDisable,
}) => {
  if (!user) return null;

  const isUserDisabled = user.isActive === false || user.disabled === true;
  const registeredAt = user.createdAt?.seconds
    ? new Date(user.createdAt.seconds * 1000).toLocaleString()
    : 'Unknown';
  const userInitials = (user.displayName || user.email || 'US')
    .split(/[@.\s]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <Dialog.Content maxWidth="760px" className="ui-user-profile-dialog">
        <Dialog.Header className="ui-user-profile-dialog__header">
          <div className="ui-user-profile-hero">
            <div className="ui-user-profile-hero__avatar">{userInitials}</div>
            <div className="ui-user-profile-hero__copy">
              <Dialog.Title className="ui-user-profile-dialog__title">
                <Users size={20} className="ui-primary-icon" /> User Account Profile
              </Dialog.Title>
              <Dialog.Description className="ui-user-profile-dialog__description">
                Review access, adjust the administrative role, and inspect the audit trail for this account.
              </Dialog.Description>
              <div className="ui-user-profile-hero__meta">
                <Badge variant={isUserDisabled ? 'ghost' : 'success'}>
                  {isUserDisabled ? 'Disabled account' : 'Active account'}
                </Badge>
                <Badge variant={ROLE_VARIANTS[user.role] || 'default'}>
                  {ROLE_LABELS[user.role] || user.role}
                </Badge>
                {user.email === currentUser?.email && (
                  <Badge variant="primary">Current session</Badge>
                )}
              </div>
            </div>
          </div>
          <Dialog.Close />
        </Dialog.Header>

        <Dialog.Body className="ui-user-profile-dialog__body">
          <div className="ui-user-profile-layout">
            <section className="ui-user-profile-panel ui-user-profile-panel--summary">
              <div className="ui-user-profile-sectionHead">
                <span className="ui-user-profile-sectionEyebrow">Identity</span>
                <h3>Account summary</h3>
              </div>

              <div className="ui-detail-grid">
                <div className="ui-detail-item ui-detail-full">
                  <span className="ui-detail-label">
                    <Mail size={14} /> Authentication Email
                  </span>
                  <span className="ui-detail-value ui-detail-value-large">{user.email}</span>
                </div>

                <div className="ui-detail-item ui-detail-half">
                  <span className="ui-detail-label">Display Name</span>
                  <span className="ui-detail-value">
                    {user.displayName || <span className="ui-empty-label">Not set</span>}
                  </span>
                </div>

                <div className="ui-detail-item ui-detail-half">
                  <span className="ui-detail-label">
                    <Shield size={14} /> Status & Security
                  </span>
                  <span className="ui-detail-value ui-status-container">
                    <span className={isUserDisabled ? 'ui-status-disabled' : 'ui-status-active'}>
                      {isUserDisabled ? 'Disabled Account' : 'Active Account'}
                    </span>
                  </span>
                </div>

                <div className="ui-detail-item ui-detail-full">
                  <span className="ui-detail-label">Administrative Role</span>
                  {user.email === currentUser?.email ? (
                    <div className="ui-role-badge-container">
                      <Badge variant="success">
                        {(ROLE_LABELS[user.role] || user.role).toUpperCase()} (YOU)
                      </Badge>
                    </div>
                  ) : (
                    <div className="ui-role-select-container">
                      <FormSelect
                        value={user.role}
                        onChange={(e) => onRoleChange(user.id, e.target.value)}
                        options={[
                          { label: 'Pending', value: 'pending' },
                          { label: 'Editor', value: 'editor' },
                          { label: 'Admin', value: 'admin' },
                          { label: 'Super Admin', value: 'superadmin' },
                        ]}
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>

            <aside className="ui-user-profile-panel ui-user-profile-panel--meta">
              <div className="ui-user-profile-sectionHead">
                <span className="ui-user-profile-sectionEyebrow">Metadata</span>
                <h3>System details</h3>
              </div>

              <div className="ui-user-meta-stack">
                <div className="ui-user-meta-card">
                  <span className="ui-user-meta-card__label">
                    <CalendarDays size={14} /> Registration Date
                  </span>
                  <span className="ui-user-meta-card__value">{registeredAt}</span>
                </div>

                <div className="ui-user-meta-card">
                  <span className="ui-user-meta-card__label">
                    <Fingerprint size={14} /> System Universal ID
                  </span>
                  <span className="ui-mono-id">{user.id}</span>
                </div>

                <div className="ui-user-meta-card">
                  <span className="ui-user-meta-card__label">Sidebar identity</span>
                  <span className="ui-user-meta-card__value">
                    {user.displayName || user.email}
                  </span>
                  <span className="ui-user-meta-card__hint">
                    This is what the admin shell shows when a display name is available.
                  </span>
                </div>
              </div>
            </aside>
          </div>

          <section className="ui-history-section">
            <div className="ui-history-section__head">
              <div>
                <span className="ui-user-profile-sectionEyebrow">Audit</span>
                <h4 className="ui-history-title">
                  <History size={18} className="ui-primary-icon" /> Audit & Edit History
                </h4>
              </div>
              <span className="ui-history-section__count">
                {historyLoading ? 'Loading...' : `${history.length} event${history.length === 1 ? '' : 's'}`}
              </span>
            </div>

            {historyLoading ? (
              <div className="ui-history-loading">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="ui-empty-history">
                <History size={18} />
                <div>
                  <strong>No edit history recorded yet.</strong>
                  <span>Changes made to this account will appear here once activity is captured.</span>
                </div>
              </div>
            ) : (
              <div className="ui-history-container">
                {history.map((entry, index) => (
                  <div key={entry.id || `history-${index}`} className="ui-history-item">
                    <div className="ui-history-header">
                      <Badge
                        variant={
                          entry.action === 'created'
                            ? 'success'
                            : entry.action === 'deleted'
                              ? 'error'
                              : 'primary'
                        }
                      >
                        {entry.action}
                      </Badge>
                      <span className="ui-history-time">
                        <Clock size={12} />
                        {entry.timestamp?.seconds
                          ? new Date(entry.timestamp.seconds * 1000).toLocaleString()
                          : 'Pending...'}
                      </span>
                    </div>

                    <div className="ui-history-action-text">
                      {entry.action === 'updated' && entry.newData ? (
                        <div className="ui-diff-container">
                          {Object.keys(entry.newData).map((key) => (
                            <div key={key} className="ui-diff-line">
                              <code className="ui-diff-key">{key}</code>
                              <span className="ui-diff-old">{String(entry.previousData?.[key])}</span>
                              <span className="ui-history-arrow">-&gt;</span>
                              <span className="ui-diff-new">{String(entry.newData[key])}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span>Account {entry.action}</span>
                      )}
                    </div>

                    <div className="ui-history-user">
                      by <span className="ui-history-user-name">{entry.user || 'System'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </Dialog.Body>

        <Dialog.Footer className="ui-user-profile-dialog__footer">
          <div className="ui-footer-actions-container">
            <div className="ui-footer-actions-left">
              {user.email !== currentUser?.email && (
                <Button variant="danger" onClick={() => onDisable(user)}>
                  <Trash2 size={16} /> {isUserDisabled ? 'Re-enable Account' : 'Disable Account'}
                </Button>
              )}
            </div>
            <div className="ui-footer-actions-right">
              <Button variant="ghost" onClick={() => onResetPassword(user)}>
                <Key size={16} /> Reset Password
              </Button>
              <Button onClick={onClose} className="ui-primary">
                Done
              </Button>
            </div>
          </div>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

export default UserDetailDialog;
