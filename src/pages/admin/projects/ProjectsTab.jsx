import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, Star, StarOff, Trash2, LayoutTemplate, Globe2, Sparkles, Link2 } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useActivity } from '../../../hooks/useActivity';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import { useDebounce } from '../../../hooks/useDebounce';
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
import { useTranslation } from '../../../hooks/useTranslation';
import { getLanguageValue, getLocalizedField } from '../../../utils/localization';

import { ACTIONS, MODULES } from '../../../utils/permissions';

const ProjectsTab = ({ userRole, showToast, isActionAllowed }) => {
  const { language, t } = useTranslation();
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [historyItem, setHistoryItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
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
  const pagination = useCursorPagination(5, [debouncedSearch]);
  const queryClient = useQueryClient();

  const { loading: formLoading, execute: executeForm } = useAsyncAction({
    showToast,
    successMessage: editingItem ? t('admin.projects.messages.updated') : t('admin.projects.messages.created'),
    invalidateKeys: [['projects']],
    onSuccess: () => setIsFormOpen(false)
  });

  const { loading: deleteLoading, execute: executeDelete } = useAsyncAction({
    showToast,
    successMessage: t('admin.projects.messages.deleted'),
    invalidateKeys: [['projects']],
    onSuccess: () => setDeletingItem(null)
  });
  const { trackRead, trackWrite, trackDelete } = useActivity();

  // Fetch data
  const { data: projectsResult = { data: [], lastDoc: null, hasMore: false, totalCount: null }, isLoading } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    queryKey: ['projects', debouncedSearch, pagination.cursor, pagination.limit],
    queryFn: async () => {
      const requestCursor = pagination.cursor;
      const result = await BaseService.safe(() => ProjectService.fetchPaginated({
        lastDoc: requestCursor,
        limit: pagination.limit,
        search: debouncedSearch,
        searchFields: ['title.en', 'title.km', 'description.en', 'description.km', 'techStack', 'slug'],
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

  const { data: projectStats = { total: 0, published: 0, featured: 0, linked: 0 } } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    queryKey: ['projects', 'stats'],
    queryFn: async () => {
      const result = await BaseService.safe(() => ProjectService.fetchStats());
      if (result.error) {
        showToast(result.error, 'error');
        return { total: 0, published: 0, featured: 0, linked: 0 };
      }
      return result.data;
    }
  });

  const projects = projectsResult.data;
  const isSearching = searchQuery !== debouncedSearch;
  const tableProjects = useMemo(() => projects.map((project) => ({
    ...project,
    __raw: project,
    title: getLocalizedField(project.title, language),
    description: getLocalizedField(project.description, language),
    content: getLocalizedField(project.content, language)
  })), [projects, language]);
  const workspaceStats = [
    {
      label: t('admin.projects.stats.total.label'),
      value: projectStats.total,
      hint: t('admin.projects.stats.total.hint'),
      icon: LayoutTemplate
    },
    {
      label: t('admin.common.stats.published.label'),
      value: projectStats.published,
      hint: t('admin.projects.stats.published.hint'),
      icon: Globe2
    },
    {
      label: t('admin.common.stats.featured.label'),
      value: projectStats.featured,
      hint: t('admin.projects.stats.featured.hint'),
      icon: Sparkles
    },
    {
      label: t('admin.projects.stats.linked.label'),
      value: projectStats.linked,
      hint: t('admin.projects.stats.linked.hint'),
      icon: Link2
    }
  ];

  // Permission Booleans
  const canCreate = isActionAllowed(ACTIONS.CREATE, MODULES.PROJECTS);
  const canEdit = isActionAllowed(ACTIONS.EDIT, MODULES.PROJECTS);
  const canDelete = isActionAllowed(ACTIONS.DELETE, MODULES.PROJECTS);
  const canFeature = isActionAllowed(ACTIONS.FEATURE, MODULES.PROJECTS);
  const canToggleVisibility = isActionAllowed(ACTIONS.TOGGLE_VISIBILITY, MODULES.PROJECTS);
  const canViewHistory = isActionAllowed(ACTIONS.VIEW_HISTORY, MODULES.PROJECTS);

  const handleAdd = () => {
    if (!isActionAllowed(ACTIONS.CREATE, MODULES.PROJECTS)) {
      return showToast(t('admin.common.noPermissionAction'), "error");
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
    if (!isActionAllowed(ACTIONS.EDIT, MODULES.PROJECTS)) {
      return showToast(t('admin.common.noPermissionAction'), "error");
    }
    const source = item.__raw || item;
    setEditingItem({
      ...source,
      techStack: Array.isArray(source.techStack) ? source.techStack.join(', ') : source.techStack || ''
    });
    setIsFormOpen(true);
  };

  const handleDelete = (item) => {
    if (!isActionAllowed(ACTIONS.DELETE, MODULES.PROJECTS)) {
      return showToast(t('admin.common.noPermissionAction'), "error");
    }
    setDeletingItem(item.__raw || item);
  };

  const handleViewHistory = (item) => {
    if (!isActionAllowed(ACTIONS.VIEW_HISTORY, MODULES.PROJECTS)) {
      return showToast(t('admin.common.noPermissionAction'), "error");
    }
    setHistoryItem(item.__raw || item);
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
    if (!isActionAllowed(editingItem ? ACTIONS.EDIT : ACTIONS.CREATE, MODULES.PROJECTS)) {
      return showToast(t('admin.common.noPermissionAction'), "error");
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
          entityName: formData.titleEn
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
      return showToast(t('admin.common.noPermissionAction'), "error");
    }

    try {
      const content = await readImportFile(file);
      const items = parseImportItems(file.name, content);
      const validCount = items.filter((item) => getLanguageValue(item?.title, 'en', true) || item?.titleEn).length;
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
      showToast(error?.message || t('admin.common.messages.importFailed'), 'error');
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
          const titleEn = (item?.titleEn || getLanguageValue(item?.title, 'en', true) || '').trim();
          if (!titleEn) {
            skipped += 1;
            continue;
          }
          const normalizedSlug = item.slug ? slugify(item.slug) : slugify(titleEn);
          const techStack = Array.isArray(item.techStack)
            ? item.techStack.join(', ')
            : (item.techStack || '');
          const titleKm = (item?.titleKm || getLanguageValue(item?.title, 'km', false) || '').trim();
          const descriptionEn = (item?.descriptionEn || getLanguageValue(item?.description, 'en', true) || '').trim();
          const descriptionKm = (item?.descriptionKm || getLanguageValue(item?.description, 'km', false) || '').trim();
          const contentEn = (item?.contentEn || getLanguageValue(item?.content, 'en', true) || '').trim();
          const contentKm = (item?.contentKm || getLanguageValue(item?.content, 'km', false) || '').trim();

          const existing = await ProjectService.fetchProjectBySlug(normalizedSlug, null, true);
          const payload = {
            id: existing?.id || null,
            titleEn,
            titleKm,
            descriptionEn,
            descriptionKm,
            techStack,
            githubUrl: item.githubUrl || '',
            liveUrl: item.liveUrl || '',
            slug: normalizedSlug,
            contentEn,
            contentKm,
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
        t('admin.projects.messages.importComplete', { created, updated, skipped, failed }),
        failed > 0 || skipped > 0 ? 'warning' : 'success'
      );
    } catch (error) {
      showToast(error?.message || t('admin.common.messages.importFailed'), 'error');
    } finally {
      setImportLoading(false);
    }
  };

  const handleExportSelectedProjects = () => {
    if (selectedProjects.length === 0) {
      return showToast(t('admin.projects.messages.selectToExport'), 'warning');
    }

    const selected = projects.filter(project => selectedProjects.includes(project.id));
    if (selected.length === 0) {
      return showToast(t('admin.projects.messages.selectedNotInPage'), 'warning');
    }

    downloadJson(selected, `projects_export_selected_${new Date().toISOString().split('T')[0]}.json`);
    showToast(t('admin.projects.messages.exportedMany', { count: selected.length }));
  };

  const handleDownloadProjectJsonTemplate = () => {
    const template = [{
      title: { en: 'Example Project', km: '' },
      description: { en: 'Short description here', km: '' },
      techStack: "React, Firebase",
      githubUrl: "https://github.com/example/repo",
      liveUrl: "https://example.com",
      slug: "example-project",
      content: { en: '# Markdown Content\\nDetails here...', km: '' },
      featured: false,
      visible: true
    }];

    downloadJson(template, 'projects_template.json');
  };

  const handleDownloadProjectCsvTemplate = () => {
    const template = [{
      titleEn: "Example Project",
      titleKm: "",
      descriptionEn: "Short description here",
      descriptionKm: "",
      techStack: "React, Firebase",
      githubUrl: "https://github.com/example/repo",
      liveUrl: "https://example.com",
      slug: "example-project",
      contentEn: "# Markdown Content\\nDetails here...",
      contentKm: "",
      featured: "false",
      visible: "true"
    }];

    const csvData = jsonToCsv(template, ["titleEn", "titleKm", "descriptionEn", "descriptionKm", "techStack", "githubUrl", "liveUrl", "slug", "contentEn", "contentKm", "featured", "visible"]);
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
      showToast(err?.message || t('admin.common.messages.updateFailed'), 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onSuccess: (_, variables) => {
      showToast(!variables.currentVisible ? t('admin.projects.messages.shown') : t('admin.projects.messages.hidden'));
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
      showToast(err?.message || t('admin.common.messages.updateFailed'), 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onSuccess: (_, variables) => {
      showToast(
        !variables.currentFeatured
          ? t('admin.projects.messages.featured')
          : t('admin.projects.messages.unfeatured')
      );
    }
  });

  const toggleVisibility = (id, currentVisible) => {
    if (!isActionAllowed(ACTIONS.TOGGLE_VISIBILITY, MODULES.PROJECTS)) {
      return showToast(t('admin.common.noPermissionAction'), "error");
    }
    visibilityMutation.mutate({ id, currentVisible });
  };

  const toggleFeatured = (id, currentFeatured) => {
    if (!isActionAllowed(ACTIONS.FEATURE, MODULES.PROJECTS)) {
      return showToast(t('admin.common.noPermissionAction'), "error");
    }
    featuredMutation.mutate({ id, currentFeatured });
  };

  // Bulk Actions Mutations
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => ProjectService.batchDeleteProjects(userRole, ids, trackDelete),
    onSuccess: (_, ids) => {
      showToast(t('admin.projects.messages.deletedMany', { count: ids.length }));
      setSelectedProjects([]);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err) => showToast(err?.message || t('admin.common.messages.deleteFailed'), 'error')
  });

  const bulkVisibilityMutation = useMutation({
    mutationFn: ({ ids, visible }) => ProjectService.batchUpdateProjectsVisibility(userRole, ids, visible, trackWrite),
    onSuccess: (_, { ids, visible }) => {
      showToast(
        visible
          ? t('admin.projects.messages.shownMany', { count: ids.length })
          : t('admin.projects.messages.hiddenMany', { count: ids.length })
      );
      setSelectedProjects([]);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err) => showToast(err?.message || t('admin.common.messages.updateFailed'), 'error')
  });

  const bulkFeaturedMutation = useMutation({
    mutationFn: ({ ids, featured }) => ProjectService.batchUpdateProjectsFeatured(userRole, ids, featured, trackWrite),
    onSuccess: (_, { ids, featured }) => {
      showToast(
        featured
          ? t('admin.projects.messages.featuredMany', { count: ids.length })
          : t('admin.projects.messages.unfeaturedMany', { count: ids.length })
      );
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
    if (!isActionAllowed(ACTIONS.DELETE, MODULES.PROJECTS)) {
      return showToast(t('admin.common.noPermissionAction'), "error");
    }

    await executeDelete(async () => {
      await ProjectService.deleteProject(userRole, deletingItem.id, (count, label) => 
        trackDelete(count, label, {
          action: 'deleted',
          module: 'projects',
          entityId: deletingItem.id,
          entityName: getLocalizedField(deletingItem.title, 'en')
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
        isSearching={isSearching}
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
              {t('admin.projects.bulk.selected')}
            </span>
          </div>

          <div className="ui-bulk-actions-controls">
            <Button variant="ghost" size="sm" onClick={() => handleBulkVisibility(true)} title={t('admin.projects.bulk.showSelected')} disabled={!canToggleVisibility}>
              <Eye size={16} style={{ marginRight: '0.4rem' }} /> {t('admin.projects.bulk.show')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleBulkVisibility(false)} title={t('admin.projects.bulk.hideSelected')} disabled={!canToggleVisibility}>
              <EyeOff size={16} style={{ marginRight: '0.4rem' }} /> {t('admin.projects.bulk.hide')}
            </Button>
            <div className="ui-bulk-divider" />
            <Button variant="ghost" size="sm" onClick={() => handleBulkFeatured(true)} title={t('admin.projects.bulk.featureSelected')} disabled={!canFeature}>
              <Star size={16} style={{ marginRight: '0.4rem' }} /> {t('admin.projects.bulk.feature')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleBulkFeatured(false)} title={t('admin.projects.bulk.unfeatureSelected')} disabled={!canFeature}>
              <StarOff size={16} style={{ marginRight: '0.4rem' }} /> {t('admin.projects.bulk.unfeature')}
            </Button>
            <div className="ui-bulk-divider" />
            <Button variant="danger" size="sm" onClick={handleBulkDelete} title={t('admin.projects.bulk.deleteSelected')}>
              <Trash2 size={16} style={{ marginRight: '0.4rem' }} /> {t('admin.common.delete')}
            </Button>
          </div>
        </div>
      )}
      
      <ProjectsTable
        projects={tableProjects}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewHistory={handleViewHistory}
        onToggleVisibility={toggleVisibility}
        onToggleFeatured={toggleFeatured}
        onCreate={handleAdd}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        canFeature={canFeature}
        canToggleVisibility={canToggleVisibility}
        canViewHistory={canViewHistory}
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
        searchQuery={searchQuery}
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
        title={t('admin.projects.dialogs.deleteTitle')}
        message={t('admin.projects.dialogs.deleteMessage', {
          title: getLocalizedField(deletingItem?.title, language)
        })}
      />

      <DeleteConfirmDialog 
        open={bulkConfirm.isOpen}
        onOpenChange={(open) => !open && setBulkConfirm({ ...bulkConfirm, isOpen: false })}
        onConfirm={() => {
            bulkDeleteMutation.mutate(bulkConfirm.ids);
            setBulkConfirm({ ...bulkConfirm, isOpen: false });
        }}
        loading={bulkDeleteMutation.isPending}
        title={t('admin.projects.dialogs.deleteManyTitle')}
        message={t('admin.projects.dialogs.deleteManyMessage', { count: bulkConfirm.ids.length })}
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
        title={t('admin.projects.import.title')}
        description={t('admin.projects.import.description')}
        fileName={importDialog.fileName}
        format={importDialog.format}
        stats={[
          { label: t('admin.common.import.rowsFound'), value: importDialog.totalCount },
          { label: t('admin.common.import.readyToImport'), value: importDialog.validCount },
          { label: t('admin.common.import.skipped'), value: importDialog.skippedCount }
        ]}
        notes={[
          t('admin.projects.import.noteMissingTitle'),
          t('admin.projects.import.noteSlug')
        ]}
        confirmText={t('admin.common.import.runImport')}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        recordId={historyItem?.id}
        service={ProjectService}
        title={getLocalizedField(historyItem?.title, language)}
      />
    </div>
  );
};

export default ProjectsTab;
