import React, { useState } from 'react';
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
import { useTranslation } from '../../../../hooks/useTranslation';
import { formatRoleDisplayName, normalizeRole } from '../../../../utils/permissions';

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
  canEditUsers = true,
  canDisableUsers = true,
  availableRoles = []
}) => {
  const { t } = useTranslation();
  const [visibleCount, setVisibleCount] = useState(10);
  
  const getActionLabel = (action) => {
    switch (action) {
      case 'created':
        return t('admin.forms.created');
      case 'deleted':
        return t('admin.forms.deleted');
      case 'updated':
        return t('admin.forms.updated');
      default:
        return action;
    }
  };

  if (!user) return null;

  const isUserDisabled = user.isActive === false || user.disabled === true;
  const normalizedCurrentRole = normalizeRole(user.role) || 'pending';
  const registeredAt = user.createdAt?.seconds
    ? new Date(user.createdAt.seconds * 1000).toLocaleString()
    : t('admin.forms.unknown');
  const userInitials = (user.displayName || user.email || 'US')
    .split(/[@.\s]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const roleLabels = {
    pending: t('admin.forms.pending'),
    editor: t('admin.forms.editor'),
    admin: t('admin.forms.admin'),
    superadmin: t('admin.forms.superAdmin'),
  };
  const assignableRoles = Array.from(new Set(['pending', 'editor', 'admin', 'superadmin', ...availableRoles.map((role) => normalizeRole(role)).filter(Boolean)]));
  const roleOptions = assignableRoles.map((role) => ({
    label: roleLabels[role] || formatRoleDisplayName(role),
    value: role
  }));

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <Dialog.Content maxWidth="760px" className="ui-user-profile-dialog">
        <Dialog.Header className="ui-user-profile-dialog__header">
          <div className="ui-user-profile-hero">
            <div className="ui-user-profile-hero__avatar">{userInitials}</div>
            <div className="ui-user-profile-hero__copy">
              <Dialog.Title className="ui-user-profile-dialog__title">
                <Users size={20} className="ui-primary-icon" /> {t('admin.forms.userAccountProfile')}
              </Dialog.Title>
              <Dialog.Description className="ui-user-profile-dialog__description">
                {t('admin.forms.reviewAccessAdjustTh')}
              </Dialog.Description>
              <div className="ui-user-profile-hero__meta">
                <Badge variant={isUserDisabled ? 'ghost' : 'success'}>
                  {isUserDisabled ? t('admin.forms.disabledAccount') : t('admin.forms.activeAccount')}
                </Badge>
                <Badge variant={ROLE_VARIANTS[normalizedCurrentRole] || 'default'}>
                  {roleLabels[normalizedCurrentRole] || formatRoleDisplayName(normalizedCurrentRole)}
                </Badge>
                {user.email === currentUser?.email && (
                  <Badge variant="primary">{t('admin.forms.currentSession')}</Badge>
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
                <span className="ui-user-profile-sectionEyebrow">{t('admin.forms.identity')}</span>
                <h3>{t('admin.forms.accountSummary')}</h3>
              </div>

              <div className="ui-detail-grid">
                <div className="ui-detail-item ui-detail-full">
                  <span className="ui-detail-label">
                    <Mail size={14} /> {t('admin.forms.authenticationEmail')}
                  </span>
                  <span className="ui-detail-value ui-detail-value-large">{user.email}</span>
                </div>

                <div className="ui-detail-item ui-detail-half">
                  <span className="ui-detail-label">{t('admin.forms.displayName')}</span>
                  <span className="ui-detail-value">
                    {user.displayName || <span className="ui-empty-label">{t('admin.forms.notSet')}</span>}
                  </span>
                </div>

                <div className="ui-detail-item ui-detail-half">
                  <span className="ui-detail-label">
                    <Shield size={14} /> {t('admin.forms.statusSecurity')}
                  </span>
                  <span className="ui-detail-value ui-status-container">
                    <span className={isUserDisabled ? 'ui-status-disabled' : 'ui-status-active'}>
                      {isUserDisabled ? t('admin.forms.disabledAccount1') : t('admin.forms.activeAccount1')}
                    </span>
                  </span>
                </div>

                <div className="ui-detail-item ui-detail-full">
                  <span className="ui-detail-label">{t('admin.forms.administrativeRole')}</span>
                  {user.email === currentUser?.email ? (
                    <div className="ui-role-badge-container">
                      <Badge variant="success">
                        {(roleLabels[normalizedCurrentRole] || formatRoleDisplayName(normalizedCurrentRole)).toUpperCase()} {t('admin.forms.YOU')}
                      </Badge>
                    </div>
                  ) : (
                    <div className="ui-role-select-container">
                      <FormSelect
                        value={normalizedCurrentRole}
                        disabled={!canEditUsers}
                        onChange={(e) => onRoleChange(user.id, e.target.value)}
                        options={roleOptions}
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>

            <aside className="ui-user-profile-panel ui-user-profile-panel--meta">
              <div className="ui-user-profile-sectionHead">
                <span className="ui-user-profile-sectionEyebrow">{t('admin.forms.metadata')}</span>
                <h3>{t('admin.forms.systemDetails')}</h3>
              </div>

              <div className="ui-user-meta-stack">
                <div className="ui-user-meta-card">
                  <span className="ui-user-meta-card__label">
                    <CalendarDays size={14} /> {t('admin.forms.registrationDate')}
                  </span>
                  <span className="ui-user-meta-card__value">{registeredAt}</span>
                </div>

                <div className="ui-user-meta-card">
                  <span className="ui-user-meta-card__label">
                    <Fingerprint size={14} /> {t('admin.forms.systemUniversalID')}
                  </span>
                  <span className="ui-mono-id">{user.id}</span>
                </div>

                <div className="ui-user-meta-card">
                  <span className="ui-user-meta-card__label">{t('admin.forms.sidebarIdentity')}</span>
                  <span className="ui-user-meta-card__value">
                    {user.displayName || user.email}
                  </span>
                  <span className="ui-user-meta-card__hint">
                    {t('admin.forms.thisIsWhatTheAdminSh')}
                  </span>
                </div>
              </div>
            </aside>
          </div>

          <section className="ui-history-section">
            <div className="ui-history-section__head">
              <div>
                <span className="ui-user-profile-sectionEyebrow">{t('admin.forms.audit')}</span>
                <h4 className="ui-history-title">
                  <History size={18} className="ui-primary-icon" /> {t('admin.forms.auditEditHistory')}
                </h4>
              </div>
              <span className="ui-history-section__count">
                {historyLoading ? t('admin.forms.loading') : `${history.length} ${t('admin.forms.events')}`}
              </span>
            </div>

            {historyLoading ? (
              <div className="ui-history-loading">{t('admin.forms.loadingHistory')}</div>
            ) : history.length === 0 ? (
              <div className="ui-empty-history">
                <History size={18} />
                <div>
                  <strong>{t('admin.forms.noEditHistoryRecorde')}</strong>
                  <span>{t('admin.forms.changesMadeToThisAcc')}</span>
                </div>
              </div>
            ) : (
              <div className="ui-history-container">
                {history.slice(0, visibleCount).map((entry, index) => (
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
                        {getActionLabel(entry.action)}
                      </Badge>
                      <span className="ui-history-time">
                        <Clock size={12} />
                        {entry.timestamp?.seconds
                          ? new Date(entry.timestamp.seconds * 1000).toLocaleString()
                          : t('admin.forms.pending1')}
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
                        <span>{t('admin.forms.account')} {getActionLabel(entry.action)}</span>
                      )}
                    </div>

                    <div className="ui-history-user">
                      {t('admin.forms.by')} <span className="ui-history-user-name">{entry.user || t('admin.forms.system')}</span>
                    </div>
                  </div>
                ))}
                {history.length > visibleCount && (
                  <div className="ui-history-load-more" style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                    <Button variant="ghost" onClick={() => setVisibleCount(prev => prev + 10)}>
                      {t('admin.forms.loadMore', 'Load More')}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </section>
        </Dialog.Body>

        <Dialog.Footer className="ui-user-profile-dialog__footer">
          <div className="ui-footer-actions-container">
            <div className="ui-footer-actions-left">
              {user.email !== currentUser?.email && (
                <Button variant="danger" disabled={!canDisableUsers} onClick={() => onDisable(user)}>
                  <Trash2 size={16} /> {isUserDisabled ? t('admin.forms.reEnableAccount') : t('admin.forms.disableAccount')}
                </Button>
              )}
            </div>
            <div className="ui-footer-actions-right">
              <Button variant="ghost" disabled={!canEditUsers} onClick={() => onResetPassword(user)}>
                <Key size={16} /> {t('admin.forms.resetPassword')}
              </Button>
              <Button onClick={onClose} className="ui-primary">
                {t('admin.forms.done')}
              </Button>
            </div>
          </div>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

export default UserDetailDialog;

