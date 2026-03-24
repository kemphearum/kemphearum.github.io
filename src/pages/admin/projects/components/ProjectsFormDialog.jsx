import React from 'react';
import { Controller } from 'react-hook-form';
import { Dialog, Button } from '../../../../shared/components/ui';
import Form from '../../components/Form';
import FormField from '../../components/FormField';
import FormInput from '../../components/FormInput';
import FormSelect from '../../components/FormSelect';
import FormDropzone from '../../components/FormDropzone';

const ProjectsFormDialog = ({ open, onOpenChange, mode, initialData, onSubmit, loading }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="600px">
        <Dialog.Header>
          <Dialog.Title>{mode === 'create' ? 'Add New Project' : 'Edit Project'}</Dialog.Title>
          <Dialog.Close />
        </Dialog.Header>
        
        <Form 
          onSubmit={onSubmit} 
          defaultValues={{
            title: '',
            description: '',
            techStack: '',
            githubUrl: '',
            liveUrl: '',
            image: null,
            visible: true,
            featured: false,
            ...initialData
          }}
          key={open ? 'open' : 'closed'}
        >
          <Dialog.Body>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <FormField
                label="Project Image"
                name="image"
              >
                 <Controller
                  name="image"
                  render={({ field }) => (
                    <FormDropzone 
                      file={field.value} 
                      onFileChange={field.onChange}
                      currentImageUrl={initialData?.imageUrl}
                      placeholder="Upload project cover image"
                      aspectRatio="16 / 7"
                    />
                  )}
                />
              </FormField>

              <FormField
                label="Project Title"
                name="title"
                validation={{ required: 'Project title is required' }}
              >
                <FormInput placeholder="e.g. Portfolio Website" />
              </FormField>
              
              <FormField
                label="Short Description"
                name="description"
                validation={{ required: 'Description is required' }}
              >
                <FormInput isTextArea rows="3" placeholder="Describe what this project does..." />
              </FormField>

              <FormField
                label="Tech Stack"
                name="techStack"
                validation={{ required: 'Tech stack is required' }}
              >
                <FormInput placeholder="e.g. React, Firebase, SCSS (comma separated)" />
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormField label="GitHub URL" name="githubUrl">
                  <FormInput type="url" placeholder="https://github.com/..." />
                </FormField>
                <FormField label="Live Demo URL" name="liveUrl">
                  <FormInput type="url" placeholder="https://..." />
                </FormField>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormField label="Visibility" name="visible">
                  <FormSelect 
                    options={[
                      { label: 'Published', value: true },
                      { label: 'Hidden', value: false }
                    ]}
                  />
                </FormField>
                <FormField label="Featured" name="featured">
                  <FormSelect 
                    options={[
                      { label: 'Normal', value: false },
                      { label: 'Featured', value: true }
                    ]}
                  />
                </FormField>
              </div>
            </div>
          </Dialog.Body>
          
          <Dialog.Footer>
            <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" isLoading={loading} className="ui-primary">
              {loading ? 'Saving...' : 'Save Project'}
            </Button>
          </Dialog.Footer>
        </Form>
      </Dialog.Content>
    </Dialog>
  );
};

export default ProjectsFormDialog;
