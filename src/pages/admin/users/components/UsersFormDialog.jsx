import React from 'react';
import { UserPlus, ShieldCheck, Mail, KeyRound } from 'lucide-react';
import { Dialog, Button, Input } from '../../../../shared/components/ui';
import Form from '../../components/Form';
import FormField from '../../components/FormField';
import FormSelect from '../../components/FormSelect';
import { useTranslation } from '../../../../hooks/useTranslation';

const UsersFormDialog = ({ open, onOpenChange, onSubmit, loading }) => {
  const { language } = useTranslation();
  const tr = (enText, kmText) => (language === 'km' ? kmText : enText);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="560px" className="ui-users-create-dialog">
        <Dialog.Header className="ui-users-create-dialog__header">
          <div className="ui-users-create-dialog__titleWrap">
            <Dialog.Title className="ui-users-create-dialog__title">
            <UserPlus size={22} className={"ui-primary-icon"} /> {tr('Create New User', 'បង្កើតអ្នកប្រើថ្មី')}
            </Dialog.Title>
            <Dialog.Description className="ui-users-create-dialog__description">
              {tr('Invite a teammate with a temporary password and assign the starting role before they sign in.', 'អញ្ជើញមិត្តរួមការងារ​ដោយប្រើពាក្យសម្ងាត់បណ្តោះអាសន្ន ហើយកំណត់តួនាទីដំបូងមុនពេលពួកគេចូល។')}
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
                  <span className="ui-users-create-section__eyebrow">{tr('Account Setup', 'ការរៀបចំគណនី')}</span>
                  <h3>{tr('Credentials and access', 'ព័ត៌មានចូល និងសិទ្ធិ')}</h3>
                </div>

                <div className="ui-dialog-form-container">
                  <FormField
                    label={tr('Email Address', 'អាសយដ្ឋានអ៊ីមែល')}
                    name="email"
                    validation={{
                      required: tr('Email is required', 'ត្រូវការអ៊ីមែល'),
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: tr('Enter a valid email address', 'សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែលត្រឹមត្រូវ')
                      }
                    }}
                  >
                    <Input type="email" placeholder={tr('user@example.com', 'អ្នក@ឧទាហរណ៍.com')} />
                  </FormField>

                  <FormField
                    label={tr('Temporary Password', 'ពាក្យសម្ងាត់បណ្តោះអាសន្ន')}
                    name="password"
                    validation={{
                      required: tr('Password is required', 'ត្រូវការពាក្យសម្ងាត់'),
                      minLength: { value: 6, message: tr('Password must be at least 6 characters', 'ពាក្យសម្ងាត់ត្រូវយ៉ាងហោចណាស់ 6 តួអក្សរ') }
                    }}
                  >
                    <Input type="password" placeholder={tr('Min 6 characters', 'យ៉ាងតិច 6 តួអក្សរ')} />
                  </FormField>

                  <FormField
                    label={tr('Initial Role', 'តួនាទីដំបូង')}
                    name="role"
                    validation={{ required: tr('Role is required', 'ត្រូវការតួនាទី') }}
                  >
                    <FormSelect
                      options={[
                        { label: tr('Pending Verification', 'រង់ចាំផ្ទៀងផ្ទាត់'), value: 'pending' },
                        { label: tr('Content Editor', 'អ្នកកែសម្រួលមាតិកា'), value: 'editor' },
                        { label: tr('System Admin', 'អ្នកគ្រប់គ្រងប្រព័ន្ធ'), value: 'admin' }
                      ]}
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
                    <strong>{tr('Use a real email', 'ប្រើអ៊ីមែលពិតប្រាកដ')}</strong>
                    <p>{tr('The reset-password action depends on the address being reachable by the user.', 'សកម្មភាពកំណត់ពាក្យសម្ងាត់ឡើងវិញ អាស្រ័យលើអ៊ីមែលដែលអ្នកប្រើអាចចូលប្រើបាន។')}</p>
                  </div>
                </div>

                <div className="ui-users-create-note">
                  <div className="ui-users-create-note__icon">
                    <KeyRound size={16} />
                  </div>
                  <div>
                    <strong>{tr('Temporary password', 'ពាក្យសម្ងាត់បណ្តោះអាសន្ន')}</strong>
                    <p>{tr('Keep it simple enough to share once, then ask the user to rotate it immediately.', 'កំណត់ឲ្យងាយចែករំលែកម្តង ហើយស្នើឲ្យអ្នកប្រើប្តូរភ្លាមៗ។')}</p>
                  </div>
                </div>

                <div className="ui-users-create-note ui-users-create-note--accent">
                  <div className="ui-users-create-note__icon">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <strong>{tr('Recommended start', 'ការចាប់ផ្ដើមណែនាំ')}</strong>
                    <p>{tr('Use `pending` unless the user needs editor or admin access right away.', 'ប្រើ `pending` លើកលែងតែអ្នកប្រើត្រូវការសិទ្ធិ editor ឬ admin ភ្លាមៗ។')}</p>
                  </div>
                </div>
              </aside>
            </div>
          </Dialog.Body>

          <Dialog.Footer className="ui-users-create-dialog__footer">
            <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
              {tr('Cancel', 'បោះបង់')}
            </Button>
            <Button type="submit" isLoading={loading} className="ui-primary">
              {loading ? tr('Creating...', 'កំពុងបង្កើត...') : tr('Create User', 'បង្កើតអ្នកប្រើ')}
            </Button>
          </Dialog.Footer>
        </Form>
      </Dialog.Content>
    </Dialog>
  );
};

export default UsersFormDialog;
