import React from 'react';
import { Dialog, Button, Input, TextArea } from '../../../../shared/components/ui';
import Form from '../../../../shared/components/form/Form';
import FormField from '../../../../shared/components/form/FormField';
import FormMarkdownEditor from '../../../../shared/components/form/inputs/FormMarkdownEditor';

const BlogFormDialog = ({ open, onOpenChange, mode, initialData, onSubmit, loading }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="800px">
        <Dialog.Header>
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
          key={open ? 'open' : 'closed'} // Reset form when dialog opens/closes
        >
          <Dialog.Body>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <FormField
                label="Post Title"
                name="title"
                validation={{ required: 'Title is required' }}
              >
                <Input placeholder="Enter title..." />
              </FormField>
              
              <FormField
                label="Content (Markdown)"
                name="content"
                validation={{ required: 'Content is required' }}
              >
                <FormMarkdownEditor />
              </FormField>

              <FormField
                label="Status"
                name="visible"
              >
                <select className="ui-input" style={{ width: '100%' }}>
                  <option value={true}>Published</option>
                  <option value={false}>Draft</option>
                </select>
              </FormField>
            </div>
          </Dialog.Body>
          
          <Dialog.Footer>
            <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" isLoading={loading} className="ui-primary">
              {loading ? 'Saving...' : 'Save Post'}
            </Button>
          </Dialog.Footer>
        </Form>
      </Dialog.Content>
    </Dialog>
  );
};

export default BlogFormDialog;
