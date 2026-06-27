import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, Star, StarOff, Trash2, LayoutTemplate, Globe2, Sparkles, Link2 } from 'lucide-react';
import ProjectService from '../../../services/ProjectService';
import BulkActionsBar from '../components/BulkActionsBar';
import ProjectsToolbar from './components/ProjectsToolbar';
import ProjectsTable from './components/ProjectsTable';
import ProjectsFormDialog from './components/ProjectsFormDialog';
import DeleteConfirmDialog from '../../../shared/components/dialog/DeleteConfirmDialog';
import HistoryModal from '../components/HistoryModal';
import ImportConfirmDialog from '../components/ImportConfirmDialog';
import { jsonToCsv } from '../../../utils/csvUtils';
import { parseBoolean, readImportFile, parseImportItems, downloadJson, downloadCsv, runImport } from '../adminCrudIO';
import { slugify } from '../../../domain/shared/slugify';
import ImageProcessingService from '../../../services/ImageProcessingService';
import { useAdminCrud } from '../hooks/useAdminCrud';
import { useTranslation } from '../../../hooks/useTranslation';
import { getLanguageValue, getLocalizedField } from '../../../utils/localization';
import { ACTIONS, MODULES } from '../../../utils/permissions';

const ProjectsTab = ({ userRole, showToast, isActionAllowed }) => {
  const { language, t } = useTranslation();
  const [bulkConfirm, setBulkConfirm] = useState({ isOpen: false, ids: [] });
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

  const crud = useAdminCrud({
    resourceKey: 'projects',
    module: MODULES.PROJECTS,
    isActionAllowed,
    showToast,
    t,
    fetchPaginated: ({ lastDoc, limit, search, trackRead }) => ProjectService.fetchPaginated({
      lastDoc,
      limit,
      search,
      searchFields: ['title.en', 'title.km', 'description.en', 'description.km', 'techStack', 'slug'],
      sortBy: 'createdAt',
      sortDirection: 'desc',
      includeTotal: true,
      trackRead
    }),
    fetchStats: () => ProjectService.fetchStats(),
    statsDefault: { total: 0, published: 0, featured: 0, linked: 0 },
    toggleVisibility: {
      mutationFn: (id, current, trackWrite) => ProjectService.toggleVisibility(userRole, id, current, trackWrite),
      on: t('admin.projects.messages.shown'),
      off: t('admin.projects.messages.hidden')
    },
    toggleFeatured: {
      mutationFn: (id, current, trackWrite) => ProjectService.toggleFeatured(userRole, id, current, trackWrite),
      on: t('admin.projects.messages.featured'),
      off: t('admin.projects.messages.unfeatured')
    },
    bulk: {
      delete: (ids, trackDelete) => ProjectService.batchDeleteProjects(userRole, ids, trackDelete),
      setVisibility: (ids, visible, trackWrite) => ProjectService.batchUpdateProjectsVisibility(userRole, ids, visible, trackWrite),
      setFeatured: (ids, featured, trackWrite) => ProjectService.batchUpdateProjectsFeatured(userRole, ids, featured, trackWrite),
      messages: {
        deleted: (count) => t('admin.projects.messages.deletedMany', { count }),
        visibility: (count, visible) => (visible
          ? t('admin.projects.messages.shownMany', { count })
          : t('admin.projects.messages.hiddenMany', { count })),
        featured: (count, featured) => (featured
          ? t('admin.projects.messages.featuredMany', { count })
          : t('admin.projects.messages.unfeaturedMany', { count }))
      }
    },
    messages: {
      created: t('admin.projects.messages.created'),
      updated: t('admin.projects.messages.updated'),
      deleted: t('admin.projects.messages.deleted')
    }
  });

  const {
    items: projects,
    listResult: projectsResult,
    stats: projectStats,
    isLoading,
    isSearching,
    searchQuery,
    handleSearch,
    pagination,
    selection,
    selectedIds,
    editingItem,
    setEditingItem,
    deletingItem,
    setDeletingItem,
    historyItem,
    setHistoryItem,
    isFormOpen,
    setIsFormOpen,
    isHistoryOpen,
    setIsHistoryOpen,
    ensurePermission,
    handleToggleVisibility,
    handleToggleFeatured,
    bulkDeleteMutation,
    bulkVisibilityMutation,
    bulkFeaturedMutation,
    bulkPending,
    formLoading,
    deleteLoading,
    saveItem,
    executeDelete,
    trackWrite,
    trackDelete,
    queryClient
  } = crud;

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
    if (!ensurePermission(ACTIONS.CREATE)) return;
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item) => {
    if (!ensurePermission(ACTIONS.EDIT)) return;
    const source = item.__raw || item;
    setEditingItem({
      ...source,
      techStack: Array.isArray(source.techStack) ? source.techStack.join(', ') : source.techStack || ''
    });
    setIsFormOpen(true);
  };

  const handleDelete = (item) => {
    if (!ensurePermission(ACTIONS.DELETE)) return;
    setDeletingItem(item.__raw || item);
  };

  const handleViewHistory = (item) => {
    if (!ensurePermission(ACTIONS.VIEW_HISTORY)) return;
    setHistoryItem(item.__raw || item);
    setIsHistoryOpen(true);
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setBulkConfirm({ isOpen: true, ids: selectedIds });
  };

  const handleBulkVisibility = (visible) => {
    if (selectedIds.length === 0) return;
    bulkVisibilityMutation.mutate({ ids: selectedIds, visible });
  };

  const handleBulkFeatured = (featured) => {
    if (selectedIds.length === 0) return;
    bulkFeaturedMutation.mutate({ ids: selectedIds, featured });
  };

  const handleSave = async (formData) => {
    if (!ensurePermission(editingItem ? ACTIONS.EDIT : ACTIONS.CREATE)) return;

    await saveItem(async () => {
      let imageUrl = formData.imageUrl || '';
      if (formData.image instanceof File) {
        imageUrl = await ImageProcessingService.compress(formData.image);
      }

      const { image: _image, ...rest } = formData;
      const action = editingItem ? 'updated' : 'created';
      await ProjectService.saveProject(userRole, {
        ...rest,
        id: editingItem?.id || null,
        publishedAt: editingItem?.publishedAt,
        archivedAt: editingItem?.archivedAt
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
      const { created, updated, skipped, failed } = await runImport({
        items: importDialog.items,
        buildPayload: (item) => {
          const titleEn = (item?.titleEn || getLanguageValue(item?.title, 'en', true) || '').trim();
          if (!titleEn) return null;
          const normalizedSlug = item.slug ? slugify(item.slug) : slugify(titleEn);
          const techStack = Array.isArray(item.techStack)
            ? item.techStack.join(', ')
            : (item.techStack || '');
          return {
            titleEn,
            titleKm: (item?.titleKm || getLanguageValue(item?.title, 'km', false) || '').trim(),
            descriptionEn: (item?.descriptionEn || getLanguageValue(item?.description, 'en', true) || '').trim(),
            descriptionKm: (item?.descriptionKm || getLanguageValue(item?.description, 'km', false) || '').trim(),
            techStack,
            githubUrl: item.githubUrl || '',
            liveUrl: item.liveUrl || '',
            slug: normalizedSlug,
            contentEn: (item?.contentEn || getLanguageValue(item?.content, 'en', true) || '').trim(),
            contentKm: (item?.contentKm || getLanguageValue(item?.content, 'km', false) || '').trim(),
            featured: parseBoolean(item.featured, false),
            visible: parseBoolean(item.visible, true),
            imageUrl: item.imageUrl || ''
          };
        },
        fetchExistingBySlug: (slug) => ProjectService.fetchProjectBySlug(slug, null, true),
        save: (payload) => ProjectService.saveProject(userRole, payload, undefined, trackWrite)
      });

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
    if (selectedIds.length === 0) {
      return showToast(t('admin.projects.messages.selectToExport'), 'warning');
    }

    const selected = projects.filter(project => selectedIds.includes(project.id));
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
    downloadCsv(csvData, 'projects_template.csv');
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    if (!ensurePermission(ACTIONS.DELETE)) return;

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
        selectedCount={selectedIds.length}
        stats={workspaceStats}
        onImportFile={handleImportProjects}
        onExportSelected={handleExportSelectedProjects}
        onDownloadTemplateCSV={handleDownloadProjectCsvTemplate}
        onDownloadTemplateJSON={handleDownloadProjectJsonTemplate}
      />

      <BulkActionsBar
        count={selectedIds.length}
        label={t('admin.projects.bulk.selected')}
        actions={[
          { icon: Eye, label: t('admin.projects.bulk.show'), title: t('admin.projects.bulk.showSelected'), onClick: () => handleBulkVisibility(true), disabled: !canToggleVisibility },
          { icon: EyeOff, label: t('admin.projects.bulk.hide'), title: t('admin.projects.bulk.hideSelected'), onClick: () => handleBulkVisibility(false), disabled: !canToggleVisibility },
          { divider: true },
          { icon: Star, label: t('admin.projects.bulk.feature'), title: t('admin.projects.bulk.featureSelected'), onClick: () => handleBulkFeatured(true), disabled: !canFeature },
          { icon: StarOff, label: t('admin.projects.bulk.unfeature'), title: t('admin.projects.bulk.unfeatureSelected'), onClick: () => handleBulkFeatured(false), disabled: !canFeature },
          { divider: true },
          { icon: Trash2, label: t('admin.common.delete'), title: t('admin.projects.bulk.deleteSelected'), onClick: handleBulkDelete, variant: 'danger' }
        ]}
      />

      <ProjectsTable
        projects={tableProjects}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewHistory={handleViewHistory}
        onToggleVisibility={handleToggleVisibility}
        onToggleFeatured={handleToggleFeatured}
        onCreate={handleAdd}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        canFeature={canFeature}
        canToggleVisibility={canToggleVisibility}
        canViewHistory={canViewHistory}
        loading={isLoading || bulkPending}
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
        selection={selection}
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
        canRestore={canEdit}
        showToast={showToast}
      />
    </div>
  );
};

export default ProjectsTab;
