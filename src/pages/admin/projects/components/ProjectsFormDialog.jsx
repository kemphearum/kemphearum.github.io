import React from 'react';
import { Dialog, Button, Input, TextArea } from '../../../../shared/components/ui';
import Form from '../../../../shared/components/form/Form';
import FormField from '../../../../shared/components/form/FormField';
import FormFileUpload from '../../../../shared/components/form/inputs/FormFileUpload';

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <FormField
                label="Project Image"
                name="image"
              >
                <FormFileUpload accept="image/*" />
              </FormField>

              <FormField
                label="Project Title"
                name="title"
                validation={{ required: 'Project title is required' }}
              >
                <Input placeholder="e.g. Portfolio Website" />
              </FormField>
              
              <FormField
                label="Short Description"
                name="description"
                validation={{ required: 'Description is required' }}
              >
                <TextArea rows="3" placeholder="Describe what this project does..." />
              </FormField>

              <FormField
                label="Tech Stack"
                name="techStack"
                validation={{ required: 'Tech stack is required' }}
              >
                <Input placeholder="e.g. React, Firebase, SCSS (comma separated)" />
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormField label="GitHub URL" name="githubUrl">
                  <Input type="url" placeholder="https://github.com/..." />
                </FormField>
                <FormField label="Live Demo URL" name="liveUrl">
                  <Input type="url" placeholder="https://..." />
                </FormField>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormField label="Visibility" name="visible">
                  <select className="ui-input" style={{ width: '100%' }}>
                    <option value={true}>Published</option>
                    <option value={false}>Hidden</option>
                  </select>
                </FormField>
                <FormField label="Featured" name="featured">
                  <select className="ui-input" style={{ width: '100%' }}>
                    <option value={false}>Normal</option>
                    <option value={true}>Featured</option>
                  </select>
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
