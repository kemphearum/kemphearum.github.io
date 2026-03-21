import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import BlogService from '../../../services/BlogService';
import { useActivity } from '../../../hooks/useActivity';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import BlogToolbar from './components/BlogToolbar';
import BlogFormDialog from './components/BlogFormDialog';
import BlogTable from './components/BlogTable';
import DeleteConfirmDialog from '../../../shared/components/dialog/DeleteConfirmDialog';
import styles from './BlogTab.module.scss';

const BlogTab = ({ userRole, showToast, isActionAllowed }) => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [page, setPage] = useState(1);
  const { loading: formLoading, execute: executeForm } = useAsyncAction({
    showToast,
    successMessage: selectedPost ? 'Post updated successfully' : 'Post created successfully',
    invalidateKeys: [['posts']],
    onSuccess: () => setIsFormOpen(false)
  });

  const { loading: deleteLoading, execute: executeDelete } = useAsyncAction({
    showToast,
    successMessage: 'Post deleted successfully',
    invalidateKeys: [['posts']],
    onSuccess: () => setIsDeleteOpen(false)
  });
  const { trackRead, trackWrite, trackDelete } = useActivity();

  // Reset page on search
  const handleSearch = (val) => {
    setSearchQuery(val);
    setPage(1);
  };

  // Queries
  const { data: posts = [], isLoading } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    queryKey: ['posts'],
    queryFn: async () => {
      const data = await BlogService.getAll("createdAt", "desc");
      trackRead(data.length, 'Fetched blog posts');
      return data;
    }
  });

  // Filtered Data
  const filteredPosts = useMemo(() => {
    if (!searchQuery) return posts;
    const lower = searchQuery.toLowerCase();
    return posts.filter(p => p.title?.toLowerCase().includes(lower));
  }, [posts, searchQuery]);

  // Handlers
  // Permission Booleans
  const canCreate = isActionAllowed('create', 'blog');
  const canEdit = isActionAllowed('edit', 'blog');
  const canDelete = isActionAllowed('delete', 'blog');

  const handleCreate = () => {
    if (!canCreate) {
      return showToast("You do not have permission to perform this action.", "error");
    }
    setSelectedPost(null);
    setIsFormOpen(true);
  };

  const handleEdit = (post) => {
    if (!isActionAllowed('edit', 'blog')) {
      return showToast("You do not have permission to perform this action.", "error");
    }
    setSelectedPost(post);
    setIsFormOpen(true);
  };

  const handleDelete = (post) => {
    if (!isActionAllowed('delete', 'blog')) {
      return showToast("You do not have permission to perform this action.", "error");
    }
    setSelectedPost(post);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    if (!isActionAllowed(selectedPost ? 'edit' : 'create', 'blog')) {
      return showToast("You do not have permission to perform this action.", "error");
    }
    
    await executeForm(async () => {
      const action = selectedPost ? 'updated' : 'created';
      await BlogService.savePost(userRole, { ...formData, id: selectedPost?.id }, (count, label) => 
        trackWrite(count, label, {
          action,
          module: 'blog',
          entityId: selectedPost?.id || 'new',
          entityName: formData.title
        })
      );
    });
  };

  const handleConfirmDelete = async () => {
    if (!selectedPost?.id) return;
    if (!isActionAllowed('delete', 'blog')) {
      return showToast("You do not have permission to perform this action.", "error");
    }

    await executeDelete(async () => {
      await BlogService.deletePost(userRole, selectedPost.id, (count, label) => 
        trackDelete(count, label, {
          action: 'deleted',
          module: 'blog',
          entityId: selectedPost.id,
          entityName: selectedPost.title
        })
      );
    });
  };


  return (
    <div className={`${styles.container} ui-card`}>
      <BlogToolbar
        onCreate={handleCreate}
        onSearch={handleSearch}
        canCreate={canCreate}
      />

      <div className="ui-table-section" style={{ position: 'relative' }}>
          <BlogTable
            posts={filteredPosts}
            onEdit={handleEdit}
            onDelete={handleDelete}
            canEdit={canEdit}
            canDelete={canDelete}
            loading={isLoading}
            pageSize={10}
            page={page}
            onPageChange={setPage}
          />
      </div>

      {/* Dialogs */}
      <BlogFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        mode={selectedPost ? 'edit' : 'create'}
        initialData={selectedPost}
        onSubmit={handleFormSubmit}
        loading={formLoading}
      />

      <DeleteConfirmDialog 
        open={isDeleteOpen} 
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Delete Post"
        message={`Are you sure you want to delete "${selectedPost?.title}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default BlogTab;
