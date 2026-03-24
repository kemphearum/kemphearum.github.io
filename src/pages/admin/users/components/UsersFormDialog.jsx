import React from 'react';
import { UserPlus } from 'lucide-react';
import { Dialog, Button, Input } from '../../../../shared/components/ui';
import Form from '../../components/Form';
import FormField from '../../components/FormField';
import FormSelect from '../../components/FormSelect';

const UsersFormDialog = ({ open, onOpenChange, onSubmit, loading }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="480px">
        <Dialog.Header>
          <Dialog.Title className={"ui-dialog-title"}>
            <UserPlus size={22} className={"ui-primary-icon"} /> Create New User
          </Dialog.Title>
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
          <Dialog.Body>
            <div className={"ui-dialog-form-container"}>
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
          </Dialog.Body>

          <Dialog.Footer>
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
