import React, { useState } from 'react';
import { Eye, EyeOff, Star, StarOff, Trash2 } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useActivity } from '../../../hooks/useActivity';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import ProjectService from '../../../services/ProjectService';
import BaseService from '../../../services/BaseService';
import ProjectsToolbar from './components/ProjectsToolbar';
import ProjectsTable from './components/ProjectsTable';
import ProjectsFormDialog from './components/ProjectsFormDialog';
import DeleteConfirmDialog from '../../../shared/components/dialog/DeleteConfirmDialog';
import { Button } from '@/shared/components/ui';
import { useCursorPagination } from '../../../hooks/useCursorPagination';

const ProjectsTab = ({ userRole, showToast, isActionAllowed }) => {
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [bulkConfirm, setBulkConfirm] = useState({ isOpen: false, type: '', ids: [] });
  
  // Cursor pagination hook
  const pagination = useCursorPagination(10, [searchQuery]);
  const queryClient = useQueryClient();

  const { loading: formLoading, execute: executeForm } = useAsyncAction({
    showToast,
    successMessage: `Project ${editingItem ? 'updated' : 'created'} successfully.`,
    invalidateKeys: [['projects']],
    onSuccess: () => setIsFormOpen(false)
  });

  const { loading: deleteLoading, execute: executeDelete } = useAsyncAction({
    showToast,
    successMessage: 'Project deleted successfully.',
    invalidateKeys: [['projects']],
    onSuccess: () => setDeletingItem(null)
  });
  const { trackRead, trackWrite, trackDelete } = useActivity();

  // Fetch data
  const { data: projectsResult = { data: [], lastDoc: null, hasMore: false }, isLoading } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    queryKey: ['projects', searchQuery, pagination.cursor, pagination.limit],
    queryFn: async () => {
      const result = await BaseService.safe(() => ProjectService.fetchPaginated({
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

  const projects = projectsResult.data;

  // Permission Booleans
  const canCreate = isActionAllowed('create', 'projects');
  const canEdit = isActionAllowed('edit', 'projects');
  const canDelete = isActionAllowed('delete', 'projects');

  const handleAdd = () => {
    if (!isActionAllowed('create', 'projects')) {
      return showToast("You do not have permission to perform this action.", "error");
    }
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleSearch = (val) => {
    setSearchQuery(val);
    pagination.reset();
  };

  const handleEdit = (item) => {
    if (!isActionAllowed('edit', 'projects')) {
      return showToast("You do not have permission to perform this action.", "error");
    }
    setEditingItem({
      ...item,
      techStack: Array.isArray(item.techStack) ? item.techStack.join(', ') : item.techStack || ''
    });
    setIsFormOpen(true);
  };

  const handleDelete = (item) => {
    if (!isActionAllowed('delete', 'projects')) {
      return showToast("You do not have permission to perform this action.", "error");
    }
    setDeletingItem(item);
  };
  
  // Selection Handlers
  const handleToggleSelectProject = (id) => {
    setSelectedProjects(prev =>
        prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };

  const handleSelectAllProjects = () => {
    const paginatedIds = projects.map(p => p.id);
    const allSelected = paginatedIds.length > 0 && paginatedIds.every(id => selectedProjects.includes(id));
    
    if (allSelected) {
      setSelectedProjects(prev => prev.filter(id => !paginatedIds.includes(id)));
    } else {
      setSelectedProjects(prev => {
        const newSelections = paginatedIds.filter(id => !prev.includes(id));
        return [...prev, ...newSelections];
      });
    }
  };

  const handleSave = async (formData) => {
    if (!isActionAllowed(editingItem ? 'edit' : 'create', 'projects')) {
      return showToast("You do not have permission to perform this action.", "error");
    }
    
    await executeForm(async () => {
      const action = editingItem ? 'updated' : 'created';
      await ProjectService.saveProject(userRole, {
        ...formData,
        id: editingItem?.id || null
      }, undefined, (count, label) => 
        trackWrite(count, label, {
          action,
          module: 'projects',
          entityId: editingItem?.id || 'new',
          entityName: formData.title
        })
      );
    });
  };

  // Mutations with Optimistic Updates
  const visibilityMutation = useMutation({
    mutationFn: ({ id, currentVisible }) => 
      ProjectService.toggleVisibility(userRole, id, currentVisible, trackWrite),
    onMutate: async ({ id, currentVisible }) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] });
      const previousProjects = queryClient.getQueryData(['projects', searchQuery, pagination.cursor, pagination.limit]);
      
      if (previousProjects) {
        queryClient.setQueryData(['projects', searchQuery, pagination.cursor, pagination.limit], {
          ...previousProjects,
          data: previousProjects.data.map(p => 
            p.id === id ? { ...p, visible: !currentVisible } : p
          )
        });
      }
      return { previousProjects };
    },
    onError: (err, variables, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects', searchQuery, pagination.cursor, pagination.limit], context.previousProjects);
      }
      showToast(err?.message || 'Failed to update visibility', 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onSuccess: (_, variables) => {
      showToast(`Project ${!variables.currentVisible ? 'shown' : 'hidden'}.`);
    }
  });

  const featuredMutation = useMutation({
    mutationFn: ({ id, currentFeatured }) => 
      ProjectService.toggleFeatured(userRole, id, currentFeatured, trackWrite),
    onMutate: async ({ id, currentFeatured }) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] });
      const previousProjects = queryClient.getQueryData(['projects', searchQuery, pagination.cursor, pagination.limit]);
      
      if (previousProjects) {
        queryClient.setQueryData(['projects', searchQuery, pagination.cursor, pagination.limit], {
          ...previousProjects,
          data: previousProjects.data.map(p => 
            p.id === id ? { ...p, featured: !currentFeatured } : p
          )
        });
      }
      return { previousProjects };
    },
    onError: (err, variables, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects', searchQuery, pagination.cursor, pagination.limit], context.previousProjects);
      }
      showToast(err?.message || 'Failed to update featured status', 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onSuccess: (_, variables) => {
      showToast(`Project ${!variables.currentFeatured ? 'featured' : 'removed from featured'}.`);
    }
  });

  const toggleVisibility = (id, currentVisible) => {
    if (!isActionAllowed('edit', 'projects')) {
      return showToast("You do not have permission to perform this action.", "error");
    }
    visibilityMutation.mutate({ id, currentVisible });
  };

  const toggleFeatured = (id, currentFeatured) => {
    if (!isActionAllowed('edit', 'projects')) {
      return showToast("You do not have permission to perform this action.", "error");
    }
    featuredMutation.mutate({ id, currentFeatured });
  };

  // Bulk Actions Mutations
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => ProjectService.batchDeleteProjects(userRole, ids, trackDelete),
    onSuccess: (_, ids) => {
      showToast(`Deleted ${ids.length} projects.`);
      setSelectedProjects([]);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err) => showToast(err?.message || 'Failed to delete projects', 'error')
  });

  const bulkVisibilityMutation = useMutation({
    mutationFn: ({ ids, visible }) => ProjectService.batchUpdateProjectsVisibility(userRole, ids, visible, trackWrite),
    onSuccess: (_, { ids, visible }) => {
      showToast(`${ids.length} projects ${visible ? 'shown' : 'hidden'}.`);
      setSelectedProjects([]);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err) => showToast(err?.message || 'Failed to update projects', 'error')
  });

  const bulkFeaturedMutation = useMutation({
    mutationFn: ({ ids, featured }) => ProjectService.batchUpdateProjectsFeatured(userRole, ids, featured, trackWrite),
    onSuccess: (_, { ids, featured }) => {
      showToast(`${ids.length} projects ${featured ? 'featured' : 'unfeatured'}.`);
      setSelectedProjects([]);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err) => showToast(err?.message || 'Failed to update projects', 'error')
  });

  const handleBulkDelete = () => {
    if (selectedProjects.length === 0) return;
    setBulkConfirm({
        isOpen: true,
        type: 'delete',
        ids: selectedProjects
    });
  };

  const handleBulkVisibility = (visible) => {
    if (selectedProjects.length === 0) return;
    bulkVisibilityMutation.mutate({ ids: selectedProjects, visible });
  };

  const handleBulkFeatured = (featured) => {
    if (selectedProjects.length === 0) return;
    bulkFeaturedMutation.mutate({ ids: selectedProjects, featured });
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    if (!isActionAllowed('delete', 'projects')) {
      return showToast("You do not have permission to perform this action.", "error");
    }

    await executeDelete(async () => {
      await ProjectService.deleteProject(userRole, deletingItem.id, (count, label) => 
        trackDelete(count, label, {
          action: 'deleted',
          module: 'projects',
          entityId: deletingItem.id,
          entityName: deletingItem.title
        })
      );
    });
  };


  return (
    <div className={'admin-tab-container'}>
      <ProjectsToolbar 
        onAdd={handleAdd}
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        canCreate={canCreate}
      />

      {selectedProjects.length > 0 && (
        <div className="ui-bulk-actions-bar">
          <div className="ui-bulk-actions-summary">
            <div className="ui-bulk-actions-count">
              {selectedProjects.length}
            </div>
            <span className="ui-bulk-actions-text">
              Projects Selected
            </span>
          </div>

          <div className="ui-bulk-actions-controls">
            <Button variant="ghost" size="sm" onClick={() => handleBulkVisibility(true)} title="Show Selected">
              <Eye size={16} style={{ marginRight: '0.4rem' }} /> Show
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
      
      <ProjectsTable
        projects={projects}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleVisibility={toggleVisibility}
        onToggleFeatured={toggleFeatured}
        canEdit={canEdit}
        canDelete={canDelete}
        loading={isLoading || bulkDeleteMutation.isPending || bulkVisibilityMutation.isPending || bulkFeaturedMutation.isPending}
        page={pagination.page}
        pageSize={pagination.limit}
        hasMore={pagination.hasMore}
        isFirstPage={pagination.isFirstPage}
        onNext={() => pagination.fetchNext(projectsResult.lastDoc)}
        onPrevious={pagination.fetchPrevious}
        onPageChange={(page, size) => {
          if (size !== pagination.limit) {
            pagination.handlePageSizeChange(size);
          }
        }}
        selection={{
          selectedIds: selectedProjects,
          onSelect: handleToggleSelectProject,
          onSelectAll: handleSelectAllProjects
        }}
      />

      <ProjectsFormDialog 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        mode={editingItem ? 'edit' : 'create'}
        initialData={editingItem}
        onSubmit={handleSave}
        loading={formLoading}
      />

      <DeleteConfirmDialog 
        open={!!deletingItem}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Project"
        message={`Are you sure you want to delete "${deletingItem?.title}"? This action cannot be undone.`}
      />

      <DeleteConfirmDialog 
        open={bulkConfirm.isOpen}
        onOpenChange={(open) => !open && setBulkConfirm({ ...bulkConfirm, isOpen: false })}
        onConfirm={() => {
            bulkDeleteMutation.mutate(bulkConfirm.ids);
            setBulkConfirm({ ...bulkConfirm, isOpen: false });
        }}
        loading={bulkDeleteMutation.isPending}
        title="Delete Multiple Projects"
        message={`Are you sure you want to delete ${bulkConfirm.ids.length} selected projects? This action cannot be undone.`}
      />
    </div>
  );
};

export default ProjectsTab;
