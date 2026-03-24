import React from 'react';
import { Controller } from 'react-hook-form';
import { Dialog, Button } from '../../../../shared/components/ui';
import Form from '../../components/Form';
import FormField from '../../components/FormField';
import FormInput from '../../components/FormInput';
import FormSelect from '../../components/FormSelect';
import FormMarkdownEditor from '../../components/FormMarkdownEditor';
import FormDropzone from '../../components/FormDropzone';

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
      <Dialog.Content maxWidth="800px">
        <Dialog.Header style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <Dialog.Title>{mode === 'create' ? 'Create New Post' : 'Edit Post'}</Dialog.Title>
          <Dialog.Close />
        </Dialog.Header>
        
        <Form 
          onSubmit={onSubmit} 
          defaultValues={defaultValues}
          key={open ? 'open' : 'closed'}
        >
          <Dialog.Body>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
              >
                <FormInput isTextArea rows="3" placeholder="A short summary for cards and SEO..." />
              </FormField>

              <FormField
                label="Tags"
                name="tags"
              >
                <FormInput placeholder="React, Firebase, Security (comma separated)" />
              </FormField>

              <FormField
                label="Custom Slug (Optional)"
                name="slug"
              >
                <FormInput placeholder="e.g. my-blog-post" />
              </FormField>

              <FormField label="Cover Image" name="image">
                <Controller
                  name="image"
                  render={({ field }) => (
                    <FormDropzone
                      file={field.value}
                      onFileChange={field.onChange}
                      currentImageUrl={initialData?.coverImage}
                      placeholder="Upload post cover image"
                      aspectRatio="16 / 9"
                    />
                  )}
                />
              </FormField>
              
              <FormField
                label="Content"
                name="content"
                validation={{ required: 'Post content is required' }}
              >
                <FormMarkdownEditor rows={15} />
              </FormField>

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
            </div>
          </Dialog.Body>
          
          <Dialog.Footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" isLoading={loading} className="ui-primary">
              {loading ? 'Saving...' : 'Save Blog Post'}
            </Button>
          </Dialog.Footer>
        </Form>
      </Dialog.Content>
    </Dialog>
  );
};

export default BlogFormDialog;
