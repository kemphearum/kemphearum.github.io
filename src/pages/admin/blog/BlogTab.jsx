import React, { useState } from 'react';
import { Eye, EyeOff, Star, StarOff, Trash2 } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import BlogService from '../../../services/BlogService';
import BaseService from '../../../services/BaseService';
import { useActivity } from '../../../hooks/useActivity';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import { Button } from '@/shared/components/ui';
import BlogToolbar from './components/BlogToolbar';
import BlogFormDialog from './components/BlogFormDialog';
import BlogTable from './components/BlogTable';
import DeleteConfirmDialog from '../../../shared/components/dialog/DeleteConfirmDialog';
import HistoryModal from '../components/HistoryModal';
import { useCursorPagination } from '../../../hooks/useCursorPagination';
import { jsonToCsv, csvToJson } from '../../../utils/csvUtils';
import { slugify } from '../../../domain/shared/slugify';

const BlogTab = ({ userRole, showToast, isActionAllowed }) => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [bulkConfirm, setBulkConfirm] = useState({ isOpen: false, ids: [] });
  const queryClient = useQueryClient();
  
  // Cursor pagination hook
  const pagination = useCursorPagination(10, [searchQuery]);

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
    pagination.reset();
  };

  // Queries
  const { data: postsResult = { data: [], lastDoc: null, hasMore: false }, isLoading } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    queryKey: ['posts', searchQuery, pagination.cursor, pagination.limit],
    queryFn: async () => {
      const result = await BaseService.safe(() => BlogService.fetchPaginated({
        lastDoc: pagination.cursor,
        limit: pagination.limit,
        search: searchQuery,
        searchField: 'title',
        sortBy: "createdAt",
        sortDirection: "desc",
        trackRead
      }));

      if (result.error) {
        showToast(result.error, 'error');
        return { data: [], lastDoc: null, hasMore: false };
      }

      pagination.updateAfterFetch(result.data.lastDoc, result.data.hasMore);
      return result.data;
    }
  });

  const posts = postsResult.data;

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

  // Selection Handlers
  const handleToggleSelectPost = (id) => {
    setSelectedPosts(prev =>
        prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };

  const handleSelectAllPosts = () => {
    const paginatedIds = posts.map(p => p.id);
    const allSelected = paginatedIds.length > 0 && paginatedIds.every(id => selectedPosts.includes(id));
    
    if (allSelected) {
      setSelectedPosts(prev => prev.filter(id => !paginatedIds.includes(id)));
    } else {
      setSelectedPosts(prev => {
        const newSelections = paginatedIds.filter(id => !prev.includes(id));
        return [...prev, ...newSelections];
      });
    }
  };
  
  // Mutations with Optimistic Updates
  const visibilityMutation = useMutation({
    mutationFn: ({ id, currentVisible }) => 
      BlogService.toggleVisibility(userRole, id, currentVisible, trackWrite),
    onMutate: async ({ id, currentVisible }) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const previousPosts = queryClient.getQueryData(['posts', searchQuery, pagination.cursor, pagination.limit]);
      
      if (previousPosts) {
        queryClient.setQueryData(['posts', searchQuery, pagination.cursor, pagination.limit], {
          ...previousPosts,
          data: previousPosts.data.map(p => 
            p.id === id ? { ...p, visible: !currentVisible } : p
          )
        });
      }
      return { previousPosts };
    },
    onError: (err, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts', searchQuery, pagination.cursor, pagination.limit], context.previousPosts);
      }
      showToast(err?.message || 'Failed to update visibility', 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onSuccess: (_, variables) => {
      showToast(`Post ${!variables.currentVisible ? 'published' : 'hidden'} successfully`);
    }
  });

  const featuredMutation = useMutation({
    mutationFn: ({ id, currentFeatured }) => 
      BlogService.toggleFeatured(userRole, id, currentFeatured, trackWrite),
    onMutate: async ({ id, currentFeatured }) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const previousPosts = queryClient.getQueryData(['posts', searchQuery, pagination.cursor, pagination.limit]);
      
      if (previousPosts) {
        queryClient.setQueryData(['posts', searchQuery, pagination.cursor, pagination.limit], {
          ...previousPosts,
          data: previousPosts.data.map(p => 
            p.id === id ? { ...p, featured: !currentFeatured } : p
          )
        });
      }
      return { previousPosts };
    },
    onError: (err, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts', searchQuery, pagination.cursor, pagination.limit], context.previousPosts);
      }
      showToast(err?.message || 'Failed to update featured status', 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onSuccess: (_, variables) => {
      showToast(`Post ${!variables.currentFeatured ? 'featured' : 'removed from featured'} successfully`);
    }
  });

  const handleToggleVisibility = (id, currentVisible) => {
    if (!canEdit) return showToast("You do not have permission to edit blog posts.", "error");
    visibilityMutation.mutate({ id, currentVisible });
  };

  const handleToggleFeatured = (id, currentFeatured) => {
    if (!canEdit) return showToast("You do not have permission to edit blog posts.", "error");
    featuredMutation.mutate({ id, currentFeatured });
  };

  // Bulk Actions Mutations
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => BlogService.batchDeletePosts(userRole, ids, trackDelete),
    onSuccess: (_, ids) => {
      showToast(`Deleted ${ids.length} posts.`);
      setSelectedPosts([]);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (err) => showToast(err?.message || 'Failed to delete posts', 'error')
  });

  const bulkVisibilityMutation = useMutation({
    mutationFn: ({ ids, visible }) => BlogService.batchUpdatePostsVisibility(userRole, ids, visible, trackWrite),
    onSuccess: (_, { ids, visible }) => {
      showToast(`${ids.length} posts ${visible ? 'published' : 'hidden'}.`);
      setSelectedPosts([]);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (err) => showToast(err?.message || 'Failed to update posts', 'error')
  });

  const bulkFeaturedMutation = useMutation({
    mutationFn: ({ ids, featured }) => BlogService.batchUpdatePostsFeatured(userRole, ids, featured, trackWrite),
    onSuccess: (_, { ids, featured }) => {
      showToast(`${ids.length} posts ${featured ? 'featured' : 'unfeatured'}.`);
      setSelectedPosts([]);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (err) => showToast(err?.message || 'Failed to update posts', 'error')
  });

  const handleBulkDelete = () => {
    if (selectedPosts.length === 0) return;
    setBulkConfirm({
        isOpen: true,
        ids: selectedPosts
    });
  };

  const handleBulkVisibility = (visible) => {
    if (selectedPosts.length === 0) return;
    bulkVisibilityMutation.mutate({ ids: selectedPosts, visible });
  };

  const handleBulkFeatured = (featured) => {
    if (selectedPosts.length === 0) return;
    bulkFeaturedMutation.mutate({ ids: selectedPosts, featured });
  };

  const handleViewHistory = (post) => {
    setSelectedPost(post);
    setIsHistoryOpen(true);
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

  const parseBoolean = (value, fallback = false) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
      if (['false', '0', 'no', 'n'].includes(normalized)) return false;
    }
    return fallback;
  };

  const downloadJson = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportPosts = async (file) => {
    if (!canCreate && !canEdit) {
      return showToast("You do not have permission to perform this action.", "error");
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result || '';
        let imported = [];

        if (file.name.toLowerCase().endsWith('.csv')) {
          imported = csvToJson(content);
        } else {
          imported = JSON.parse(content);
        }

        if (!Array.isArray(imported)) imported = [imported];

        let created = 0;
        let updated = 0;
        let failed = 0;

        for (const item of imported) {
          try {
            if (!item?.title) continue;
            const normalizedSlug = item.slug ? slugify(item.slug) : slugify(item.title);
            const tags = Array.isArray(item.tags)
              ? item.tags.join(', ')
              : (item.tags || '');

            const existing = await BlogService.fetchPostBySlug(normalizedSlug, null, true);
            const payload = {
              id: existing?.id || null,
              title: item.title,
              slug: normalizedSlug,
              excerpt: item.excerpt || '',
              content: item.content || '',
              tags,
              coverImage: item.coverImage || '',
              featured: parseBoolean(item.featured, false),
              visible: parseBoolean(item.visible, true)
            };

            await BlogService.savePost(userRole, payload, trackWrite);
            if (existing?.id) updated += 1;
            else created += 1;
          } catch {
            failed += 1;
          }
        }

        queryClient.invalidateQueries({ queryKey: ['posts'] });
        showToast(`Import complete: ${created} created, ${updated} updated, ${failed} failed.`, failed > 0 ? 'warning' : 'success');
      } catch (error) {
        showToast(error?.message || 'Failed to import posts.', 'error');
      }
    };

    reader.onerror = () => showToast('Failed to read import file.', 'error');
    reader.readAsText(file);
  };

  const handleExportSelectedPosts = () => {
    if (selectedPosts.length === 0) {
      return showToast('Please select posts to export.', 'warning');
    }

    const selected = posts.filter(post => selectedPosts.includes(post.id));
    if (selected.length === 0) {
      return showToast('Selected posts are not in the current page result.', 'warning');
    }

    downloadJson(selected, `blog_export_selected_${new Date().toISOString().split('T')[0]}.json`);
    showToast(`Exported ${selected.length} selected posts.`);
  };

  const handleDownloadBlogJsonTemplate = () => {
    const template = [{
      title: 'Sample Blog Post',
      slug: 'sample-blog-post',
      excerpt: 'A short summary for the list view.',
      content: '# Your Content Here\\nThis is sample markdown content.',
      tags: ['React', 'Tutorial'],
      featured: false,
      visible: true
    }];

    downloadJson(template, 'blog_template.json');
  };

  const handleDownloadBlogCsvTemplate = () => {
    const template = [{
      title: 'Sample Blog Post',
      slug: 'sample-blog-post',
      excerpt: 'A short summary for the list view.',
      content: '# Your Content Here\\nThis is sample markdown content.',
      tags: 'React, Tutorial',
      featured: 'false',
      visible: 'true'
    }];

    const csvData = jsonToCsv(template, ['title', 'slug', 'excerpt', 'content', 'tags', 'featured', 'visible']);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'blog_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
    <div className={`${'admin-tab-container'} ui-card`}>
      <BlogToolbar
        onCreate={handleCreate}
        onSearch={handleSearch}
        canCreate={canCreate}
        canBulkManage={canCreate || canEdit}
        selectedCount={selectedPosts.length}
        onImportFile={handleImportPosts}
        onExportSelected={handleExportSelectedPosts}
        onDownloadTemplateCSV={handleDownloadBlogCsvTemplate}
        onDownloadTemplateJSON={handleDownloadBlogJsonTemplate}
      />

      {selectedPosts.length > 0 && (
        <div className="ui-bulk-actions-bar">
          <div className="ui-bulk-actions-summary">
            <div className="ui-bulk-actions-count">
              {selectedPosts.length}
            </div>
            <span className="ui-bulk-actions-text">
              Posts Selected
            </span>
          </div>

          <div className="ui-bulk-actions-controls">
            <Button variant="ghost" size="sm" onClick={() => handleBulkVisibility(true)} title="Publish Selected">
              <Eye size={16} style={{ marginRight: '0.4rem' }} /> Publish
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleBulkVisibility(false)} title="Hide Selected">
              <EyeOff size={16} style={{ marginRight: '0.4rem' }} /> Hide
            </Button>
            <div className="ui-bulk-divider" />
            <Button variant="ghost" size="sm" onClick={() => handleBulkFeatured(true)} title="Feature Selected">
              <Star size={16} style={{ marginRight: '0.4rem' }} /> Feature
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleBulkFeatured(false)} title="Unfeature Selected">
              <StarOff size={16} style={{ marginRight: '0.4rem' }} /> Unfeature
            </Button>
            <div className="ui-bulk-divider" />
            <Button variant="danger" size="sm" onClick={handleBulkDelete} title="Delete Selected">
              <Trash2 size={16} style={{ marginRight: '0.4rem' }} /> Delete
            </Button>
          </div>
        </div>
      )}

      <BlogTable
        posts={posts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleVisibility={handleToggleVisibility}
        onToggleFeatured={handleToggleFeatured}
        onViewHistory={handleViewHistory}
        canEdit={canEdit}
        canDelete={canDelete}
        loading={isLoading || bulkDeleteMutation.isPending || bulkVisibilityMutation.isPending || bulkFeaturedMutation.isPending}
        page={pagination.page}
        pageSize={pagination.limit}
        hasMore={pagination.hasMore}
        isFirstPage={pagination.isFirstPage}
        onNext={() => pagination.fetchNext(postsResult.lastDoc)}
        onPrevious={pagination.fetchPrevious}
        onPageChange={(page, size) => {
          if (size !== pagination.limit) {
            pagination.handlePageSizeChange(size);
          }
        }}
        selection={{
          selectedIds: selectedPosts,
          onSelect: handleToggleSelectPost,
          onSelectAll: handleSelectAllPosts
        }}
      />

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

      <DeleteConfirmDialog 
        open={bulkConfirm.isOpen} 
        onOpenChange={(open) => !open && setBulkConfirm({ ...bulkConfirm, isOpen: false })}
        onConfirm={() => {
            bulkDeleteMutation.mutate(bulkConfirm.ids);
            setBulkConfirm({ ...bulkConfirm, isOpen: false });
        }}
        loading={bulkDeleteMutation.isPending}
        title="Delete Multiple Posts"
        message={`Are you sure you want to delete ${bulkConfirm.ids.length} selected posts? This action cannot be undone.`}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        recordId={selectedPost?.id}
        service={BlogService}
        title={selectedPost?.title}
      />
    </div>
  );
};

export default BlogTab;
