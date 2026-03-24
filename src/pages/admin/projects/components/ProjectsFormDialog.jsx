import React from 'react';
import { Controller } from 'react-hook-form';
import { Dialog, Button } from '../../../../shared/components/ui';
import Form from '../../components/Form';
import FormField from '../../components/FormField';
import FormInput from '../../components/FormInput';
import FormSelect from '../../components/FormSelect';
import FormDropzone from '../../components/FormDropzone';
import FormMarkdownEditor from '../../components/FormMarkdownEditor';

const ProjectsFormDialog = ({ open, onOpenChange, mode, initialData, onSubmit, loading }) => {
  const defaultValues = {
    title: initialData?.title || '',
    description: initialData?.description || '',
    content: initialData?.content || '',
    techStack: Array.isArray(initialData?.techStack) ? initialData.techStack.join(', ') : (initialData?.techStack || ''),
    githubUrl: initialData?.githubUrl || '',
    liveUrl: initialData?.liveUrl || '',
    slug: initialData?.slug || '',
    image: null,
    visible: initialData?.visible ?? true,
    featured: initialData?.featured ?? false
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="600px">
        <Dialog.Header>
          <Dialog.Title>{mode === 'create' ? 'Add New Project' : 'Edit Project'}</Dialog.Title>
          <Dialog.Close />
        </Dialog.Header>
        
        <Form 
          onSubmit={onSubmit} 
          defaultValues={defaultValues}
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
                <FormField
                  label="GitHub URL"
                  name="githubUrl"
                  validation={{
                    validate: (value) => !value || /^https?:\/\/.+/i.test(value) || 'Enter a valid URL (http/https)'
                  }}
                >
                  <FormInput type="url" placeholder="https://github.com/..." />
                </FormField>
                <FormField
                  label="Live Demo URL"
                  name="liveUrl"
                  validation={{
                    validate: (value) => !value || /^https?:\/\/.+/i.test(value) || 'Enter a valid URL (http/https)'
                  }}
                >
                  <FormInput type="url" placeholder="https://..." />
                </FormField>
              </div>

              <FormField label="Custom Slug (Optional)" name="slug">
                <FormInput placeholder="e.g. portfolio-website" />
              </FormField>

              <FormField label="Project Content (Markdown)" name="content">
                <FormMarkdownEditor rows={8} placeholder="Detailed case study, architecture, lessons learned..." />
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormField
                  label="Visibility"
                  name="visible"
                  validation={{
                    setValueAs: (value) => value === true || value === 'true'
                  }}
                >
                  <FormSelect 
                    options={[
                      { label: 'Published', value: true },
                      { label: 'Hidden', value: false }
                    ]}
                  />
                </FormField>
                <FormField
                  label="Featured"
                  name="featured"
                  validation={{
                    setValueAs: (value) => value === true || value === 'true'
                  }}
                >
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
