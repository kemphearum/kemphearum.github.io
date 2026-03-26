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
import { useTranslation } from '../../../../hooks/useTranslation';

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
  const { language } = useTranslation();
  const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
  const getActionLabel = (action) => {
    switch (action) {
      case 'created':
        return tr('Created', 'បានបង្កើត');
      case 'deleted':
        return tr('Deleted', 'បានលុប');
      case 'updated':
        return tr('Updated', 'បានកែប្រែ');
      default:
        return action;
    }
  };

  if (!user) return null;

  const isUserDisabled = user.isActive === false || user.disabled === true;
  const registeredAt = user.createdAt?.seconds
    ? new Date(user.createdAt.seconds * 1000).toLocaleString()
    : tr('Unknown', 'មិនស្គាល់');
  const userInitials = (user.displayName || user.email || 'US')
    .split(/[@.\s]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const roleLabels = {
    pending: tr('Pending', 'រង់ចាំ'),
    editor: tr('Editor', 'អ្នកកែសម្រួល'),
    admin: tr('Admin', 'អ្នកគ្រប់គ្រង'),
    superadmin: tr('Super Admin', 'អ្នកគ្រប់គ្រងកំពូល'),
  };

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <Dialog.Content maxWidth="760px" className="ui-user-profile-dialog">
        <Dialog.Header className="ui-user-profile-dialog__header">
          <div className="ui-user-profile-hero">
            <div className="ui-user-profile-hero__avatar">{userInitials}</div>
            <div className="ui-user-profile-hero__copy">
              <Dialog.Title className="ui-user-profile-dialog__title">
                <Users size={20} className="ui-primary-icon" /> {tr('User Account Profile', 'ប្រវត្តិរូបគណនីអ្នកប្រើ')}
              </Dialog.Title>
              <Dialog.Description className="ui-user-profile-dialog__description">
                {tr('Review access, adjust the administrative role, and inspect the audit trail for this account.', 'ពិនិត្យសិទ្ធិ កែតួនាទីគ្រប់គ្រង និងមើលប្រវត្តិសវនកម្មសម្រាប់គណនីនេះ។')}
              </Dialog.Description>
              <div className="ui-user-profile-hero__meta">
                <Badge variant={isUserDisabled ? 'ghost' : 'success'}>
                  {isUserDisabled ? tr('Disabled account', 'គណនីត្រូវបានបិទ') : tr('Active account', 'គណនីសកម្ម')}
                </Badge>
                <Badge variant={ROLE_VARIANTS[user.role] || 'default'}>
                  {roleLabels[user.role] || user.role}
                </Badge>
                {user.email === currentUser?.email && (
                  <Badge variant="primary">{tr('Current session', 'សម័យបច្ចុប្បន្ន')}</Badge>
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
                <span className="ui-user-profile-sectionEyebrow">{tr('Identity', 'អត្តសញ្ញាណ')}</span>
                <h3>{tr('Account summary', 'សង្ខេបគណនី')}</h3>
              </div>

              <div className="ui-detail-grid">
                <div className="ui-detail-item ui-detail-full">
                  <span className="ui-detail-label">
                    <Mail size={14} /> {tr('Authentication Email', 'អ៊ីមែលផ្ទៀងផ្ទាត់')}
                  </span>
                  <span className="ui-detail-value ui-detail-value-large">{user.email}</span>
                </div>

                <div className="ui-detail-item ui-detail-half">
                  <span className="ui-detail-label">{tr('Display Name', 'ឈ្មោះបង្ហាញ')}</span>
                  <span className="ui-detail-value">
                    {user.displayName || <span className="ui-empty-label">{tr('Not set', 'មិនទាន់កំណត់')}</span>}
                  </span>
                </div>

                <div className="ui-detail-item ui-detail-half">
                  <span className="ui-detail-label">
                    <Shield size={14} /> {tr('Status & Security', 'ស្ថានភាព និងសុវត្ថិភាព')}
                  </span>
                  <span className="ui-detail-value ui-status-container">
                    <span className={isUserDisabled ? 'ui-status-disabled' : 'ui-status-active'}>
                      {isUserDisabled ? tr('Disabled Account', 'គណនីបានបិទ') : tr('Active Account', 'គណនីសកម្ម')}
                    </span>
                  </span>
                </div>

                <div className="ui-detail-item ui-detail-full">
                  <span className="ui-detail-label">{tr('Administrative Role', 'តួនាទីគ្រប់គ្រង')}</span>
                  {user.email === currentUser?.email ? (
                    <div className="ui-role-badge-container">
                      <Badge variant="success">
                        {(roleLabels[user.role] || user.role).toUpperCase()} {tr('(YOU)', '(អ្នក)')}
                      </Badge>
                    </div>
                  ) : (
                    <div className="ui-role-select-container">
                      <FormSelect
                        value={user.role}
                        onChange={(e) => onRoleChange(user.id, e.target.value)}
                        options={[
                          { label: tr('Pending', 'រង់ចាំ'), value: 'pending' },
                          { label: tr('Editor', 'អ្នកកែសម្រួល'), value: 'editor' },
                          { label: tr('Admin', 'អ្នកគ្រប់គ្រង'), value: 'admin' },
                          { label: tr('Super Admin', 'អ្នកគ្រប់គ្រងកំពូល'), value: 'superadmin' },
                        ]}
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>

            <aside className="ui-user-profile-panel ui-user-profile-panel--meta">
              <div className="ui-user-profile-sectionHead">
                <span className="ui-user-profile-sectionEyebrow">{tr('Metadata', 'មេតាទិន្នន័យ')}</span>
                <h3>{tr('System details', 'ព័ត៌មានប្រព័ន្ធ')}</h3>
              </div>

              <div className="ui-user-meta-stack">
                <div className="ui-user-meta-card">
                  <span className="ui-user-meta-card__label">
                    <CalendarDays size={14} /> {tr('Registration Date', 'ថ្ងៃចុះឈ្មោះ')}
                  </span>
                  <span className="ui-user-meta-card__value">{registeredAt}</span>
                </div>

                <div className="ui-user-meta-card">
                  <span className="ui-user-meta-card__label">
                    <Fingerprint size={14} /> {tr('System Universal ID', 'លេខសម្គាល់សកលប្រព័ន្ធ')}
                  </span>
                  <span className="ui-mono-id">{user.id}</span>
                </div>

                <div className="ui-user-meta-card">
                  <span className="ui-user-meta-card__label">{tr('Sidebar identity', 'អត្តសញ្ញាណ Sidebar')}</span>
                  <span className="ui-user-meta-card__value">
                    {user.displayName || user.email}
                  </span>
                  <span className="ui-user-meta-card__hint">
                    {tr('This is what the admin shell shows when a display name is available.', 'នេះជាអ្វីដែល Admin បង្ហាញ នៅពេលមានឈ្មោះបង្ហាញ។')}
                  </span>
                </div>
              </div>
            </aside>
          </div>

          <section className="ui-history-section">
            <div className="ui-history-section__head">
              <div>
                <span className="ui-user-profile-sectionEyebrow">{tr('Audit', 'សវនកម្ម')}</span>
                <h4 className="ui-history-title">
                  <History size={18} className="ui-primary-icon" /> {tr('Audit & Edit History', 'ប្រវត្តិសវនកម្ម និងកែសម្រួល')}
                </h4>
              </div>
              <span className="ui-history-section__count">
                {historyLoading ? tr('Loading...', 'កំពុងផ្ទុក...') : `${history.length} ${tr(history.length === 1 ? 'event' : 'events', 'ព្រឹត្តិការណ៍')}`}
              </span>
            </div>

            {historyLoading ? (
              <div className="ui-history-loading">{tr('Loading history...', 'កំពុងផ្ទុកប្រវត្តិ...')}</div>
            ) : history.length === 0 ? (
              <div className="ui-empty-history">
                <History size={18} />
                <div>
                  <strong>{tr('No edit history recorded yet.', 'មិនទាន់មានប្រវត្តិកែសម្រួលនៅឡើយ។')}</strong>
                  <span>{tr('Changes made to this account will appear here once activity is captured.', 'ការផ្លាស់ប្តូរលើគណនីនេះ នឹងបង្ហាញនៅទីនេះ ពេលមានការកត់ត្រាសកម្មភាព។')}</span>
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
                        {getActionLabel(entry.action)}
                      </Badge>
                      <span className="ui-history-time">
                        <Clock size={12} />
                        {entry.timestamp?.seconds
                          ? new Date(entry.timestamp.seconds * 1000).toLocaleString()
                          : tr('Pending...', 'កំពុងរង់ចាំ...')}
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
                        <span>{tr('Account', 'គណនី')} {getActionLabel(entry.action)}</span>
                      )}
                    </div>

                    <div className="ui-history-user">
                      {tr('by', 'ដោយ')} <span className="ui-history-user-name">{entry.user || tr('System', 'ប្រព័ន្ធ')}</span>
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
                  <Trash2 size={16} /> {isUserDisabled ? tr('Re-enable Account', 'បើកដំណើរការគណនីឡើងវិញ') : tr('Disable Account', 'បិទដំណើរការគណនី')}
                </Button>
              )}
            </div>
            <div className="ui-footer-actions-right">
              <Button variant="ghost" onClick={() => onResetPassword(user)}>
                <Key size={16} /> {tr('Reset Password', 'កំណត់ពាក្យសម្ងាត់ឡើងវិញ')}
              </Button>
              <Button onClick={onClose} className="ui-primary">
                {tr('Done', 'រួចរាល់')}
              </Button>
            </div>
          </div>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

export default UserDetailDialog;
