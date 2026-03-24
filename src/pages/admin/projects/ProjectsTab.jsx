import React, { useState } from 'react';
import { Eye, EyeOff, Star, StarOff, Trash2, LayoutTemplate, Globe2, Sparkles, Link2 } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useActivity } from '../../../hooks/useActivity';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import ProjectService from '../../../services/ProjectService';
import BaseService from '../../../services/BaseService';
import ProjectsToolbar from './components/ProjectsToolbar';
import ProjectsTable from './components/ProjectsTable';
import ProjectsFormDialog from './components/ProjectsFormDialog';
import DeleteConfirmDialog from '../../../shared/components/dialog/DeleteConfirmDialog';
import HistoryModal from '../components/HistoryModal';
import ImportConfirmDialog from '../components/ImportConfirmDialog';
import { Button } from '@/shared/components/ui';
import { useCursorPagination } from '../../../hooks/useCursorPagination';
import { jsonToCsv, csvToJson } from '../../../utils/csvUtils';
import { slugify } from '../../../domain/shared/slugify';
import ImageProcessingService from '../../../services/ImageProcessingService';

const ProjectsTab = ({ userRole, showToast, isActionAllowed }) => {
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [historyItem, setHistoryItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [bulkConfirm, setBulkConfirm] = useState({ isOpen: false, type: '', ids: [] });
  const [importDialog, setImportDialog] = useState({
    isOpen: false,
    file: null,
    items: [],
    fileName: '',
    format: '',
    totalCount: 0,
    validCount: 0,
    skippedCount: 0
  });
  const [importLoading, setImportLoading] = useState(false);
  
  // Cursor pagination hook
  const pagination = useCursorPagination(5, [searchQuery]);
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
  const { data: projectsResult = { data: [], lastDoc: null, hasMore: false, totalCount: null }, isLoading } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    queryKey: ['projects', searchQuery, pagination.cursor, pagination.limit],
    queryFn: async () => {
      const requestCursor = pagination.cursor;
      const result = await BaseService.safe(() => ProjectService.fetchPaginated({
        lastDoc: requestCursor,
        limit: pagination.limit,
        search: searchQuery,
        searchField: 'title',
        sortBy: "createdAt",
        sortDirection: "desc",
        includeTotal: true,
        trackRead
      }));

      if (result.error) {
        showToast(result.error, 'error');
        return { data: [], lastDoc: null, hasMore: false, totalCount: null };
      }

      pagination.updateAfterFetch(requestCursor, result.data.lastDoc, result.data.hasMore);
      return result.data;
    }
  });

  const projects = projectsResult.data;
  const visibleProjectsCount = projects.filter((project) => project.visible !== false).length;
  const featuredProjectsCount = projects.filter((project) => !!project.featured).length;
  const linkedProjectsCount = projects.filter((project) => project.liveUrl || project.githubUrl).length;
  const workspaceStats = [
    {
      label: 'On This Page',
      value: projects.length,
      hint: 'Loaded in the current result set',
      icon: LayoutTemplate
    },
    {
      label: 'Published',
      value: visibleProjectsCount,
      hint: 'Visible in the public portfolio',
      icon: Globe2
    },
    {
      label: 'Featured',
      value: featuredProjectsCount,
      hint: 'Highlighted on priority surfaces',
      icon: Sparkles
    },
    {
      label: 'Linked',
      value: linkedProjectsCount,
      hint: 'Have a live demo or repository',
      icon: Link2
    }
  ];

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
    setSelectedProjects([]);
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

  const handleViewHistory = (item) => {
    setHistoryItem(item);
    setIsHistoryOpen(true);
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
      let imageUrl = formData.imageUrl || '';
      if (formData.image instanceof File) {
        imageUrl = await ImageProcessingService.compress(formData.image);
      }

      const { image: _image, ...rest } = formData;
      const action = editingItem ? 'updated' : 'created';
      await ProjectService.saveProject(userRole, {
        ...rest,
        id: editingItem?.id || null
      }, imageUrl, (count, label) => 
        trackWrite(count, label, {
          action,
          module: 'projects',
          entityId: editingItem?.id || 'new',
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

  const readImportFile = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result || '');
    reader.onerror = () => reject(new Error('Failed to read import file.'));
    reader.readAsText(file);
  });

  const parseImportItems = (fileName, content) => {
    let parsed = [];

    if (fileName.toLowerCase().endsWith('.csv')) {
      parsed = csvToJson(content);
    } else {
      parsed = JSON.parse(content);
    }

    if (!Array.isArray(parsed)) parsed = [parsed];
    return parsed;
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

  const handleImportProjects = async (file) => {
    if (!canCreate && !canEdit) {
      return showToast("You do not have permission to perform this action.", "error");
    }

    try {
      const content = await readImportFile(file);
      const items = parseImportItems(file.name, content);
      const validCount = items.filter((item) => item?.title).length;
      const skippedCount = items.length - validCount;

      setImportDialog({
        isOpen: true,
        file,
        items,
        fileName: file.name,
        format: file.name.toLowerCase().endsWith('.csv') ? 'CSV' : 'JSON',
        totalCount: items.length,
        validCount,
        skippedCount
      });
    } catch (error) {
      showToast(error?.message || 'Failed to import projects.', 'error');
    }
  };

  const handleConfirmImportProjects = async () => {
    if (!importDialog.items.length) return;

    setImportLoading(true);
    try {
      let created = 0;
      let updated = 0;
      let skipped = 0;
      let failed = 0;

      for (const item of importDialog.items) {
        try {
          if (!item?.title) {
            skipped += 1;
            continue;
          }
          const normalizedSlug = item.slug ? slugify(item.slug) : slugify(item.title);
          const techStack = Array.isArray(item.techStack)
            ? item.techStack.join(', ')
            : (item.techStack || '');

          const existing = await ProjectService.fetchProjectBySlug(normalizedSlug, null, true);
          const payload = {
            id: existing?.id || null,
            title: item.title,
            description: item.description || '',
            techStack,
            githubUrl: item.githubUrl || '',
            liveUrl: item.liveUrl || '',
            slug: normalizedSlug,
            content: item.content || '',
            featured: parseBoolean(item.featured, false),
            visible: parseBoolean(item.visible, true),
            imageUrl: item.imageUrl || ''
          };

          await ProjectService.saveProject(userRole, payload, undefined, trackWrite);
          if (existing?.id) updated += 1;
          else created += 1;
        } catch {
          failed += 1;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setImportDialog({
        isOpen: false,
        file: null,
        items: [],
        fileName: '',
        format: '',
        totalCount: 0,
        validCount: 0,
        skippedCount: 0
      });
      showToast(
        `Import complete: ${created} created, ${updated} updated, ${skipped} skipped, ${failed} failed.`,
        failed > 0 || skipped > 0 ? 'warning' : 'success'
      );
    } catch (error) {
      showToast(error?.message || 'Failed to import projects.', 'error');
    } finally {
      setImportLoading(false);
    }
  };

  const handleExportSelectedProjects = () => {
    if (selectedProjects.length === 0) {
      return showToast('Please select projects to export.', 'warning');
    }

    const selected = projects.filter(project => selectedProjects.includes(project.id));
    if (selected.length === 0) {
      return showToast('Selected projects are not in the current page result.', 'warning');
    }

    downloadJson(selected, `projects_export_selected_${new Date().toISOString().split('T')[0]}.json`);
    showToast(`Exported ${selected.length} selected projects.`);
  };

  const handleDownloadProjectJsonTemplate = () => {
    const template = [{
      title: "Example Project",
      description: "Short description here",
      techStack: "React, Firebase",
      githubUrl: "https://github.com/example/repo",
      liveUrl: "https://example.com",
      slug: "example-project",
      content: "# Markdown Content\\nDetails here...",
      featured: false,
      visible: true
    }];

    downloadJson(template, 'projects_template.json');
  };

  const handleDownloadProjectCsvTemplate = () => {
    const template = [{
      title: "Example Project",
      description: "Short description here",
      techStack: "React, Firebase",
      githubUrl: "https://github.com/example/repo",
      liveUrl: "https://example.com",
      slug: "example-project",
      content: "# Markdown Content\\nDetails here...",
      featured: "false",
      visible: "true"
    }];

    const csvData = jsonToCsv(template, ["title", "description", "techStack", "githubUrl", "liveUrl", "slug", "content", "featured", "visible"]);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'projects_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
        canBulkManage={canCreate || canEdit}
        selectedCount={selectedProjects.length}
        stats={workspaceStats}
        onImportFile={handleImportProjects}
        onExportSelected={handleExportSelectedProjects}
        onDownloadTemplateCSV={handleDownloadProjectCsvTemplate}
        onDownloadTemplateJSON={handleDownloadProjectJsonTemplate}
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
        onViewHistory={handleViewHistory}
        onToggleVisibility={toggleVisibility}
        onToggleFeatured={toggleFeatured}
        onCreate={handleAdd}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        loading={isLoading || bulkDeleteMutation.isPending || bulkVisibilityMutation.isPending || bulkFeaturedMutation.isPending}
        page={pagination.page}
        pageSize={pagination.limit}
        totalItems={projectsResult.totalCount}
        hasMore={projectsResult.hasMore}
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

      <ImportConfirmDialog
        open={importDialog.isOpen}
        onOpenChange={(open) => !open && !importLoading && setImportDialog({
          isOpen: false,
          file: null,
          items: [],
          fileName: '',
          format: '',
          totalCount: 0,
          validCount: 0,
          skippedCount: 0
        })}
        onConfirm={handleConfirmImportProjects}
        loading={importLoading}
        title="Import Projects"
        description="Review the file before running a bulk import. Existing projects with matching slugs will be updated."
        fileName={importDialog.fileName}
        format={importDialog.format}
        stats={[
          { label: 'Rows found', value: importDialog.totalCount },
          { label: 'Ready to import', value: importDialog.validCount },
          { label: 'Skipped', value: importDialog.skippedCount }
        ]}
        notes={[
          'Rows without a title are skipped automatically.',
          'Import keeps slug-based updates and creates new projects when no match is found.'
        ]}
        confirmText="Run Import"
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        recordId={historyItem?.id}
        service={ProjectService}
        title={historyItem?.title}
      />
    </div>
  );
};

export default ProjectsTab;
