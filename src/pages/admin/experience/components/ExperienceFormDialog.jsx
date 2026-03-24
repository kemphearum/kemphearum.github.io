import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Dialog, Button } from '../../../../shared/components/ui';
import Form from '../../components/Form';
import FormField from '../../components/FormField';
import FormInput from '../../components/FormInput';
import FormSelect from '../../components/FormSelect';

const ExperienceFormFields = () => {
  const { watch } = useFormContext();
  const isPresent = watch('isPresent');
  const startDate = watch('startDate');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
      <FormField
        label="Company Name"
        name="company"
        validation={{ required: 'Company name is required' }}
      >
        <FormInput placeholder="e.g. Google Inc." />
      </FormField>
      
      <FormField
        label="Role / Job Title"
        name="role"
        validation={{ required: 'Role is required' }}
      >
        <FormInput placeholder="e.g. Senior Developer" />
      </FormField>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <FormField
          label="Start Date"
          name="startDate"
          validation={{ required: 'Start date is required' }}
        >
          <FormInput type="month" />
        </FormField>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="ui-label" style={{ marginBottom: 0 }}>End Date</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', cursor: 'pointer' }}>
              <FormField name="isPresent" label="" noError>
                 <input type="checkbox" style={{ width: 'auto', margin: 0 }} />
              </FormField>
              <span>Present</span>
            </label>
          </div>
          <FormField
            name="endDate"
            label=""
            noError
            validation={{
              required: !isPresent ? 'End date is required' : false,
              validate: (value) => {
                if (isPresent || !value || !startDate) return true;
                return value >= startDate || 'End date must be the same or after start date';
              }
            }}
          >
            <FormInput type="month" disabled={isPresent} />
          </FormField>
        </div>
      </div>

      <FormField
        label="Description"
        name="description"
        validation={{ required: 'Description is required' }}
      >
        <FormInput isTextArea rows="5" placeholder="Describe your responsibilities and achievements..." />
      </FormField>

      <FormField
        label="Visibility"
        name="visible"
        validation={{
          setValueAs: (value) => value === true || value === 'true'
        }}
      >
        <FormSelect 
          options={[
            { label: 'Visible on Homepage', value: true },
            { label: 'Hidden from Public', value: false }
          ]}
        />
      </FormField>
    </div>
  );
};

const ExperienceFormDialog = ({ open, onOpenChange, mode, initialData, onSubmit, loading }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="600px">
        <Dialog.Header>
          <Dialog.Title>{mode === 'create' ? 'Add New Experience' : 'Edit Experience'}</Dialog.Title>
          <Dialog.Close />
        </Dialog.Header>
        
        <Form 
          onSubmit={onSubmit} 
          defaultValues={{
            company: '',
            role: '',
            startDate: '',
            endDate: '',
            isPresent: false,
            description: '',
            visible: true,
            ...initialData
          }}
          key={open ? 'open' : 'closed'}
        >
          <Dialog.Body>
            <ExperienceFormFields />
          </Dialog.Body>
          
          <Dialog.Footer>
            <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" isLoading={loading} className="ui-primary">
              {loading ? 'Saving...' : 'Save Experience'}
            </Button>
          </Dialog.Footer>
        </Form>
      </Dialog.Content>
    </Dialog>
  );
};

export default ExperienceFormDialog;
