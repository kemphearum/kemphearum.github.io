import React from 'react';
import { Dialog, Button } from '../../../../shared/components/ui';
import Form from '../../components/Form';
import FormField from '../../components/FormField';
import FormInput from '../../components/FormInput';
import FormSelect from '../../components/FormSelect';
import FormMarkdownEditor from '../../components/FormMarkdownEditor';

const BlogFormDialog = ({ open, onOpenChange, mode, initialData, onSubmit, loading }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="800px">
        <Dialog.Header style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <Dialog.Title>{mode === 'create' ? 'Create New Post' : 'Edit Post'}</Dialog.Title>
          <Dialog.Close />
        </Dialog.Header>
        
        <Form 
          onSubmit={onSubmit} 
          defaultValues={{
            title: '',
            content: '',
            visible: true,
            ...initialData
          }}
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
                label="Content"
                name="content"
                validation={{ required: 'Post content is required' }}
              >
                <FormMarkdownEditor rows={15} />
              </FormField>

              <FormField
                label="Publish Status"
                name="visible"
              >
                <FormSelect 
                  options={[
                    { label: 'Published (Publicly Visible)', value: true },
                    { label: 'Draft (Admin Only)', value: false }
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
