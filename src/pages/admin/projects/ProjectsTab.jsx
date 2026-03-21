import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useActivity } from '../../../hooks/useActivity';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import ProjectService from '../../../services/ProjectService';
import ProjectsToolbar from './components/ProjectsToolbar';
import ProjectsTable from './components/ProjectsTable';
import ProjectsFormDialog from './components/ProjectsFormDialog';
import DeleteConfirmDialog from '../../../shared/components/dialog/DeleteConfirmDialog';
import { Button } from '../../../shared/components/ui';
import styles from './ProjectsTab.module.scss';

const ProjectsTab = ({ userRole, showToast, isActionAllowed }) => {
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

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
  const { data: projects = [], isLoading } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    queryKey: ['projects'],
    queryFn: async () => {
      const data = await ProjectService.getAll("createdAt", "desc");
      trackRead(data.length, 'projects');
      return data;
    }
  });

  // Filter data
  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    const lower = searchQuery.toLowerCase();
    return projects.filter(p => 
      p.title?.toLowerCase().includes(lower) || 
      (Array.isArray(p.techStack) && p.techStack.some(t => t.toLowerCase().includes(lower)))
    );
  }, [projects, searchQuery]);

  // Permission Booleans
  const canCreate = isActionAllowed('create', 'projects');
  const canEdit = isActionAllowed('edit', 'projects');
  const canDelete = isActionAllowed('delete', 'projects');

  const handleAdd = () => {
    if (!canCreate) {
      return showToast("You do not have permission to perform this action.", "error");
    }
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleSearch = (val) => {
    setSearchQuery(val);
    setPage(1);
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
    <div className={styles.container}>
      <ProjectsToolbar 
        onAdd={handleAdd}
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        canCreate={canCreate}
      />
      
      <div className={styles.tableSection}>
        <ProjectsTable
          projects={filteredProjects}
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
    </div>
  );
};

export default ProjectsTab;
