
import { UserPlus, ShieldCheck, Mail, KeyRound } from 'lucide-react';
import { Dialog, Button, Input } from '../../../../shared/components/ui';
import Form from '../../components/Form';
import FormField from '../../components/FormField';
import FormSelect from '../../components/FormSelect';
import { useTranslation } from '../../../../hooks/useTranslation';
import { formatRoleDisplayName, normalizeRole } from '../../../../utils/permissions';

const UsersFormDialog = ({ open, onOpenChange, onSubmit, loading, availableRoles = [] }) => {
  const { t } = useTranslation();
  const roleOptions = Array.from(new Set(['pending', 'editor', 'admin', ...availableRoles.map((role) => normalizeRole(role)).filter(Boolean)]))
    .filter((role) => role && role !== 'superadmin')
    .map((role) => ({
      label: role === 'pending'
        ? t('admin.forms.pendingVerification')
        : role === 'editor'
          ? t('admin.forms.contentEditor')
          : role === 'admin'
            ? t('admin.forms.systemAdmin')
            : formatRoleDisplayName(role),
      value: role
    }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="560px" className="ui-users-create-dialog">
        <Dialog.Header className="ui-users-create-dialog__header">
          <div className="ui-users-create-dialog__titleWrap">
            <Dialog.Title className="ui-users-create-dialog__title">
            <UserPlus size={22} className={"ui-primary-icon"} /> {t('admin.forms.createNewUser')}
            </Dialog.Title>
            <Dialog.Description className="ui-users-create-dialog__description">
              {t('admin.forms.inviteATeammateWithA')}
            </Dialog.Description>
          </div>
          <Dialog.Close />
        </Dialog.Header>

        <Form
          onSubmit={onSubmit}
          defaultValues={{
            email: '',
            password: '',
            role: 'pending'
          }}
          key={open ? 'open' : 'closed'}
        >
          <Dialog.Body className="ui-users-create-dialog__body">
            <div className="ui-users-create-layout">
              <div className="ui-users-create-section">
                <div className="ui-users-create-section__head">
                  <span className="ui-users-create-section__eyebrow">{t('admin.forms.accountSetup')}</span>
                  <h3>{t('admin.forms.credentialsAndAccess')}</h3>
                </div>

                <div className="ui-dialog-form-container">
                  <FormField
                    label={t('admin.forms.emailAddress')}
                    name="email"
                    validation={{
                      required: t('admin.forms.emailIsRequired'),
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: t('admin.forms.enterAValidEmailAddr')
                      }
                    }}
                  >
                    <Input type="email" placeholder={t('admin.forms.userExampleCom')} />
                  </FormField>

                  <FormField
                    label={t('admin.forms.temporaryPassword')}
                    name="password"
                    validation={{
                      required: t('admin.forms.passwordIsRequired'),
                      minLength: { value: 6, message: t('admin.forms.passwordMustBeAtLeas') }
                    }}
                  >
                    <Input type="password" placeholder={t('admin.forms.min6Characters')} />
                  </FormField>

                  <FormField
                    label={t('admin.forms.initialRole')}
                    name="role"
                    validation={{ required: t('admin.forms.roleIsRequired') }}
                  >
                    <FormSelect
                      options={roleOptions}
                    />
                  </FormField>
                </div>
              </div>

              <aside className="ui-users-create-aside">
                <div className="ui-users-create-note">
                  <div className="ui-users-create-note__icon">
                    <Mail size={16} />
                  </div>
                  <div>
                    <strong>{t('admin.forms.useARealEmail')}</strong>
                    <p>{t('admin.forms.theResetPasswordActi')}</p>
                  </div>
                </div>

                <div className="ui-users-create-note">
                  <div className="ui-users-create-note__icon">
                    <KeyRound size={16} />
                  </div>
                  <div>
                    <strong>{t('admin.forms.temporaryPassword1')}</strong>
                    <p>{t('admin.forms.keepItSimpleEnoughTo')}</p>
                  </div>
                </div>

                <div className="ui-users-create-note ui-users-create-note--accent">
                  <div className="ui-users-create-note__icon">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <strong>{t('admin.forms.recommendedStart')}</strong>
                    <p>{t('admin.forms.usePendingUnlessTheU')}</p>
                  </div>
                </div>
              </aside>
            </div>
          </Dialog.Body>

          <Dialog.Footer className="ui-users-create-dialog__footer">
            <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
              {t('admin.forms.cancel')}
            </Button>
            <Button type="submit" isLoading={loading} className="ui-primary">
              {loading ? t('admin.forms.creating') : t('admin.forms.createUser')}
            </Button>
          </Dialog.Footer>
        </Form>
      </Dialog.Content>
    </Dialog>
  );
};

export default UsersFormDialog;
