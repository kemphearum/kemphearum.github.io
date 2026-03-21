import React from 'react';
import { UserPlus } from 'lucide-react';
import { Dialog, Button, Input } from '../../../../shared/components/ui';
import Form from '../../../../shared/components/form/Form';
import FormField from '../../../../shared/components/form/FormField';

const UsersFormDialog = ({ open, onOpenChange, onSubmit, loading }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="480px">
        <Dialog.Header>
          <Dialog.Title style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={22} style={{ color: 'var(--primary-color)' }} /> Create New User
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <FormField
                label="Email Address"
                name="email"
                validation={{ required: 'Email is required' }}
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
              >
                <select className="ui-input" style={{ width: '100%' }}>
                  <option value="pending">⏳ Pending Verification</option>
                  <option value="editor">✍️ Content Editor</option>
                  <option value="admin">🛡️ System Admin</option>
                </select>
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
