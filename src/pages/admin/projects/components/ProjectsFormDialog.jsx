import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Dialog, Button } from '../../../../shared/components/ui';
import Form from '../../components/Form';
import FormField from '../../components/FormField';
import FormInput from '../../components/FormInput';
import FormSelect from '../../components/FormSelect';
import FormDropzone from '../../components/FormDropzone';
import FormMarkdownEditor from '../../components/FormMarkdownEditor';

const ProjectImageField = ({ currentImageUrl }) => {
  const { control, setValue, watch } = useFormContext();
  const activeImage = watch('imageUrl');

  return (
    <Controller
      name="image"
      control={control}
      render={({ field }) => (
        <FormDropzone 
          file={field.value} 
          onFileChange={(file) => {
            field.onChange(file);
            if (file) {
              setValue('imageUrl', '', { shouldDirty: true });
            }
          }}
          currentImageUrl={activeImage || currentImageUrl}
          onClearExisting={() => setValue('imageUrl', '', { shouldDirty: true })}
          placeholder="Upload project cover image"
          aspectRatio="16 / 7"
        />
      )}
    />
  );
};

const ProjectsFormDialog = ({ open, onOpenChange, mode, initialData, onSubmit, loading }) => {
  const defaultValues = {
    title: initialData?.title || '',
    description: initialData?.description || '',
    content: initialData?.content || '',
    techStack: Array.isArray(initialData?.techStack) ? initialData.techStack.join(', ') : (initialData?.techStack || ''),
    githubUrl: initialData?.githubUrl || '',
    liveUrl: initialData?.liveUrl || '',
    slug: initialData?.slug || '',
    imageUrl: initialData?.imageUrl || '',
    image: null,
    visible: initialData?.visible ?? true,
    featured: initialData?.featured ?? false
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="1120px" className="ui-blog-dialog">
        <Dialog.Header className="ui-blog-dialog__header">
          <div className="ui-blog-dialog__heading">
            <Dialog.Title>{mode === 'create' ? 'Add New Project' : 'Edit Project'}</Dialog.Title>
            <Dialog.Description>
              Capture the story, links, and media for each project without burying the publishing controls.
            </Dialog.Description>
          </div>
          <Dialog.Close />
        </Dialog.Header>
        
        <Form 
          onSubmit={onSubmit} 
          defaultValues={defaultValues}
          key={open ? 'open' : 'closed'}
        >
          <Dialog.Body className="ui-blog-dialog__body">
            <div className="ui-blog-formLayout">
              <div className="ui-blog-formLayout__main">
                <div className="ui-blog-formSection">
                  <div className="ui-blog-formSection__head">
                    <h3>Project basics</h3>
                    <p>Summarize the work clearly so the table, cards, and detail page all stay in sync.</p>
                  </div>

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
                    hint="Used in cards, previews, and supporting metadata."
                  >
                    <FormInput isTextArea rows="4" placeholder="Describe what this project does..." />
                  </FormField>

                  <FormField
                    label="Tech Stack"
                    name="techStack"
                    validation={{ required: 'Tech stack is required' }}
                    hint="Separate technologies with commas to keep filtering and badges clean."
                  >
                    <FormInput placeholder="e.g. React, Firebase, SCSS" />
                  </FormField>
                </div>

                <div className="ui-blog-formSection ui-blog-formSection--editor">
                  <div className="ui-blog-formSection__head">
                    <h3>Case study content</h3>
                    <p>Add richer context for the project page, including architecture, outcomes, and lessons learned.</p>
                  </div>

                  <FormField label="Project Content (Markdown)" name="content">
                    <FormMarkdownEditor
                      rows={14}
                      fullWidth={false}
                      placeholder="Detailed case study, architecture, lessons learned..."
                    />
                  </FormField>
                </div>
              </div>

              <aside className="ui-blog-formLayout__aside">
                <div className="ui-blog-formSection">
                  <div className="ui-blog-formSection__head">
                    <h3>Links and URL</h3>
                    <p>Keep the public slug and external links ready before you publish the project.</p>
                  </div>

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

                  <FormField label="Custom Slug" name="slug" hint="Leave blank to generate the public path from the title.">
                    <FormInput placeholder="e.g. portfolio-website" />
                  </FormField>
                </div>

                <div className="ui-blog-formSection">
                  <div className="ui-blog-formSection__head">
                    <h3>Publishing</h3>
                    <p>Control whether the project appears publicly and whether it gets highlighted.</p>
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

                <div className="ui-blog-formSection">
                  <div className="ui-blog-formSection__head">
                    <h3>Project cover</h3>
                    <p>Use a wide image that feels good in cards and still reads well on the full project page.</p>
                  </div>

                  <FormField label="Project Image">
                    <ProjectImageField currentImageUrl={initialData?.imageUrl} />
                  </FormField>
                </div>
              </aside>
            </div>
          </Dialog.Body>
          
          <Dialog.Footer className="ui-blog-dialog__footer">
            <div className="ui-blog-dialog__footerNote">
              Images are optimized on save. Hidden projects stay available in admin without appearing in the public portfolio.
            </div>
            <div className="ui-blog-dialog__footerActions">
              <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
                Cancel
              </Button>
              <Button type="submit" isLoading={loading} className="ui-primary">
                {loading ? 'Saving...' : 'Save Project'}
              </Button>
            </div>
          </Dialog.Footer>
        </Form>
      </Dialog.Content>
    </Dialog>
  );
};

export default ProjectsFormDialog;
