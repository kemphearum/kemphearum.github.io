import React from 'react';
import { UserPlus, ShieldCheck, Mail, KeyRound } from 'lucide-react';
import { Dialog, Button, Input } from '../../../../shared/components/ui';
import Form from '../../components/Form';
import FormField from '../../components/FormField';
import FormSelect from '../../components/FormSelect';

const UsersFormDialog = ({ open, onOpenChange, onSubmit, loading }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="560px" className="ui-users-create-dialog">
        <Dialog.Header className="ui-users-create-dialog__header">
          <div className="ui-users-create-dialog__titleWrap">
            <Dialog.Title className="ui-users-create-dialog__title">
            <UserPlus size={22} className={"ui-primary-icon"} /> Create New User
            </Dialog.Title>
            <Dialog.Description className="ui-users-create-dialog__description">
              Invite a teammate with a temporary password and assign the starting role before they sign in.
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
                  <span className="ui-users-create-section__eyebrow">Account Setup</span>
                  <h3>Credentials and access</h3>
                </div>

                <div className="ui-dialog-form-container">
                  <FormField
                    label="Email Address"
                    name="email"
                    validation={{
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Enter a valid email address'
                      }
                    }}
                  >
                    <Input type="email" placeholder="user@example.com" />
                  </FormField>

                  <FormField
                    label="Temporary Password"
                    name="password"
                    validation={{
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' }
                    }}
                  >
                    <Input type="password" placeholder="Min 6 characters" />
                  </FormField>

                  <FormField
                    label="Initial Role"
                    name="role"
                    validation={{ required: 'Role is required' }}
                  >
                    <FormSelect
                      options={[
                        { label: 'Pending Verification', value: 'pending' },
                        { label: 'Content Editor', value: 'editor' },
                        { label: 'System Admin', value: 'admin' }
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
                    <strong>Use a real email</strong>
                    <p>The reset-password action depends on the address being reachable by the user.</p>
                  </div>
                </div>

                <div className="ui-users-create-note">
                  <div className="ui-users-create-note__icon">
                    <KeyRound size={16} />
                  </div>
                  <div>
                    <strong>Temporary password</strong>
                    <p>Keep it simple enough to share once, then ask the user to rotate it immediately.</p>
                  </div>
                </div>

                <div className="ui-users-create-note ui-users-create-note--accent">
                  <div className="ui-users-create-note__icon">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <strong>Recommended start</strong>
                    <p>Use `pending` unless the user needs editor or admin access right away.</p>
                  </div>
                </div>
              </aside>
            </div>
          </Dialog.Body>

          <Dialog.Footer className="ui-users-create-dialog__footer">
            <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" isLoading={loading} className="ui-primary">
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </Dialog.Footer>
        </Form>
      </Dialog.Content>
    </Dialog>
  );
};

export default UsersFormDialog;
