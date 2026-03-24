import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Dialog, Button } from '../../../../shared/components/ui';
import Form from '../../components/Form';
import FormField from '../../components/FormField';
import FormInput from '../../components/FormInput';
import FormSelect from '../../components/FormSelect';
import FormMarkdownEditor from '../../components/FormMarkdownEditor';
import FormDropzone from '../../components/FormDropzone';

const BlogCoverImageField = ({ currentImageUrl }) => {
  const { control, setValue, watch } = useFormContext();
  const activeImage = watch('coverImage');

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
              setValue('coverImage', '', { shouldDirty: true });
            }
          }}
          currentImageUrl={activeImage || currentImageUrl}
          onClearExisting={() => setValue('coverImage', '', { shouldDirty: true })}
          placeholder="Upload post cover image"
          aspectRatio="16 / 7"
        />
      )}
    />
  );
};

const BlogFormDialog = ({ open, onOpenChange, mode, initialData, onSubmit, loading }) => {
  const defaultValues = {
    title: initialData?.title || '',
    excerpt: initialData?.excerpt || '',
    tags: Array.isArray(initialData?.tags) ? initialData.tags.join(', ') : (initialData?.tags || ''),
    coverImage: initialData?.coverImage || '',
    image: null,
    slug: initialData?.slug || '',
    content: initialData?.content || '',
    featured: initialData?.featured ?? false,
    visible: initialData?.visible ?? true
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="1120px" className="ui-blog-dialog">
        <Dialog.Header className="ui-blog-dialog__header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="ui-blog-dialog__heading">
            <Dialog.Title>{mode === 'create' ? 'Create New Post' : 'Edit Post'}</Dialog.Title>
            <Dialog.Description>
              Shape the article structure first, then set publishing details and cover media before saving.
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
                    <h3>Story basics</h3>
                    <p>Set the title, summary, and article body that readers will see first.</p>
                  </div>

                  <FormField
                    label="Post Title"
                    name="title"
                    validation={{ required: 'Title is required' }}
                  >
                    <FormInput placeholder="Enter a compelling title..." />
                  </FormField>

                  <FormField
                    label="Short Excerpt"
                    name="excerpt"
                    hint="Used in cards, previews, and search results."
                  >
                    <FormInput isTextArea rows="4" placeholder="A short summary for cards and SEO..." />
                  </FormField>
                </div>

                <div className="ui-blog-formSection ui-blog-formSection--editor">
                  <div className="ui-blog-formSection__head">
                    <h3>Article content</h3>
                    <p>Write in Markdown and use preview to spot formatting issues before publishing.</p>
                  </div>

                  <FormField
                    label="Content"
                    name="content"
                    validation={{ required: 'Post content is required' }}
                  >
                    <FormMarkdownEditor
                      rows={16}
                      fullWidth={false}
                      placeholder="Start with a strong opening, then structure the rest of the article in Markdown..."
                    />
                  </FormField>
                </div>
              </div>

              <aside className="ui-blog-formLayout__aside">
                <div className="ui-blog-formSection">
                  <div className="ui-blog-formSection__head">
                    <h3>Publishing</h3>
                    <p>Control visibility, homepage promotion, and the public URL.</p>
                  </div>

                  <FormField
                    label="Publish Status"
                    name="visible"
                    validation={{
                      setValueAs: (value) => value === true || value === 'true'
                    }}
                  >
                    <FormSelect 
                      options={[
                        { label: 'Published (Publicly Visible)', value: true },
                        { label: 'Draft (Admin Only)', value: false }
                      ]}
                    />
                  </FormField>

                  <FormField
                    label="Homepage Highlight"
                    name="featured"
                    validation={{
                      setValueAs: (value) => value === true || value === 'true'
                    }}
                  >
                    <FormSelect
                      options={[
                        { label: 'Normal Post', value: false },
                        { label: 'Featured on Homepage', value: true }
                      ]}
                    />
                  </FormField>

                  <FormField
                    label="Custom Slug"
                    name="slug"
                    hint="Leave blank to generate the URL automatically from the title."
                  >
                    <FormInput placeholder="e.g. my-blog-post" />
                  </FormField>

                  <FormField
                    label="Tags"
                    name="tags"
                    hint="Separate topics with commas to improve filtering and related-post suggestions."
                  >
                    <FormInput placeholder="React, Firebase, Security" />
                  </FormField>
                </div>

                <div className="ui-blog-formSection">
                  <div className="ui-blog-formSection__head">
                    <h3>Cover image</h3>
                    <p>Use a clean, wide image to make the blog list and article header feel more polished.</p>
                  </div>

                  <FormField label="Cover Image">
                    <BlogCoverImageField currentImageUrl={initialData?.coverImage} />
                  </FormField>
                </div>
              </aside>
            </div>
          </Dialog.Body>
          
          <Dialog.Footer className="ui-blog-dialog__footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="ui-blog-dialog__footerNote">
              Cover images are optimized on save. Draft mode keeps the post out of the public blog.
            </div>
            <div className="ui-blog-dialog__footerActions">
              <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
                Cancel
              </Button>
              <Button type="submit" isLoading={loading} className="ui-primary">
                {loading ? 'Saving...' : 'Save Blog Post'}
              </Button>
            </div>
          </Dialog.Footer>
        </Form>
      </Dialog.Content>
    </Dialog>
  );
};

export default BlogFormDialog;
