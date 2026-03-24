import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Dialog, Button } from '../../../../shared/components/ui';
import Form from '../../components/Form';
import FormField from '../../components/FormField';
import FormInput from '../../components/FormInput';
import FormSelect from '../../components/FormSelect';

const ExperienceFormFields = () => {
  const { register, watch } = useFormContext();
  const isPresent = watch('isPresent');
  const startDate = watch('startDate');

  return (
    <div className="ui-blog-formLayout">
      <div className="ui-blog-formLayout__main">
        <div className="ui-blog-formSection">
          <div className="ui-blog-formSection__head">
            <h3>Role details</h3>
            <p>Keep the public timeline readable by making the company, title, and summary easy to scan.</p>
          </div>

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

          <FormField
            label="Description"
            name="description"
            validation={{ required: 'Description is required' }}
            hint="Summarize responsibilities, scope, and key impact in a concise way."
          >
            <FormInput isTextArea rows="6" placeholder="Describe your responsibilities and achievements..." />
          </FormField>
        </div>

        <div className="ui-blog-formSection ui-blog-formSection--editor">
          <div className="ui-blog-formSection__head">
            <h3>Timeline guidance</h3>
            <p>Use month precision to keep sorting and career progression consistent across the site.</p>
          </div>
          <div className="ui-experienceTimelineHint">
            Current roles can leave the end date empty. Past roles should always include both start and end months.
          </div>
        </div>
      </div>

      <aside className="ui-blog-formLayout__aside">
        <div className="ui-blog-formSection">
          <div className="ui-blog-formSection__head">
            <h3>Timeline</h3>
            <p>Set the role duration accurately so the public timeline stays clear and trustworthy.</p>
          </div>

          <FormField
            label="Start Date"
            name="startDate"
            validation={{ required: 'Start date is required' }}
          >
            <FormInput type="month" />
          </FormField>

          <label className={`ui-experiencePresentToggle ${isPresent ? 'ui-experiencePresentToggle--active' : ''}`}>
            <input type="checkbox" {...register('isPresent')} />
            <span className="ui-experiencePresentToggle__control" />
            <span className="ui-experiencePresentToggle__copy">
              <strong>This role is current</strong>
              <span>Hide the end date and label the role as present.</span>
            </span>
          </label>

          <FormField
            label="End Date"
            name="endDate"
            hint={isPresent ? 'Current roles do not need an end date.' : 'Required for past roles.'}
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

        <div className="ui-blog-formSection">
          <div className="ui-blog-formSection__head">
            <h3>Visibility</h3>
            <p>Control whether this role appears in the public experience section or stays private in admin.</p>
          </div>

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
      </aside>
    </div>
  );
};

const ExperienceFormDialog = ({ open, onOpenChange, mode, initialData, onSubmit, loading }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="1040px" className="ui-blog-dialog">
        <Dialog.Header className="ui-blog-dialog__header">
          <div className="ui-blog-dialog__heading">
            <Dialog.Title>{mode === 'create' ? 'Add New Experience' : 'Edit Experience'}</Dialog.Title>
            <Dialog.Description>
              Keep each timeline entry clean, readable, and properly dated before it goes live on the portfolio.
            </Dialog.Description>
          </div>
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
          <Dialog.Body className="ui-blog-dialog__body">
            <ExperienceFormFields />
          </Dialog.Body>
          
          <Dialog.Footer className="ui-blog-dialog__footer">
            <div className="ui-blog-dialog__footerNote">
              Month ranges are normalized on save. Hidden entries remain available in admin without appearing publicly.
            </div>
            <div className="ui-blog-dialog__footerActions">
              <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
                Cancel
              </Button>
              <Button type="submit" isLoading={loading} className="ui-primary">
                {loading ? 'Saving...' : 'Save Experience'}
              </Button>
            </div>
          </Dialog.Footer>
        </Form>
      </Dialog.Content>
    </Dialog>
  );
};

export default ExperienceFormDialog;
