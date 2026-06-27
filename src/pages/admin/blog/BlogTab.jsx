import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, Star, StarOff, Trash2, FileText, Globe2, Sparkles, PenSquare } from 'lucide-react';
import BlogService from '../../../services/BlogService';
import BulkActionsBar from '../components/BulkActionsBar';
import BlogToolbar from './components/BlogToolbar';
import BlogFormDialog from './components/BlogFormDialog';
import BlogTable from './components/BlogTable';
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

const BlogTab = ({ userRole, showToast, isActionAllowed }) => {
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
    resourceKey: 'posts',
    module: MODULES.BLOG,
    isActionAllowed,
    showToast,
    t,
    fetchPaginated: ({ lastDoc, limit, search, trackRead }) => BlogService.fetchPaginated({
      lastDoc,
      limit,
      search,
      searchFields: ['title.en', 'title.km', 'excerpt.en', 'excerpt.km', 'tags', 'slug'],
      sortBy: 'createdAt',
      sortDirection: 'desc',
      includeTotal: true,
      trackRead
    }),
    fetchStats: () => BlogService.fetchStats(),
    statsDefault: { total: 0, published: 0, featured: 0, drafts: 0 },
    toggleVisibility: {
      mutationFn: (id, current, trackWrite) => BlogService.toggleVisibility(userRole, id, current, trackWrite),
      on: t('admin.blog.messages.published'),
      off: t('admin.blog.messages.hidden')
    },
    toggleFeatured: {
      mutationFn: (id, current, trackWrite) => BlogService.toggleFeatured(userRole, id, current, trackWrite),
      on: t('admin.blog.messages.featured'),
      off: t('admin.blog.messages.unfeatured')
    },
    bulk: {
      delete: (ids, trackDelete) => BlogService.batchDeletePosts(userRole, ids, trackDelete),
      setVisibility: (ids, visible, trackWrite) => BlogService.batchUpdatePostsVisibility(userRole, ids, visible, trackWrite),
      setFeatured: (ids, featured, trackWrite) => BlogService.batchUpdatePostsFeatured(userRole, ids, featured, trackWrite),
      messages: {
        deleted: (count) => t('admin.blog.messages.deletedMany', { count }),
        visibility: (count, visible) => (visible
          ? t('admin.blog.messages.publishedMany', { count })
          : t('admin.blog.messages.hiddenMany', { count })),
        featured: (count, featured) => (featured
          ? t('admin.blog.messages.featuredMany', { count })
          : t('admin.blog.messages.unfeaturedMany', { count }))
      }
    },
    messages: {
      created: t('admin.blog.messages.created'),
      updated: t('admin.blog.messages.updated'),
      deleted: t('admin.blog.messages.deleted')
    }
  });

  const {
    items: posts,
    listResult: postsResult,
    stats: blogStats,
    isLoading,
    isFetching,
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

  const tablePosts = useMemo(() => posts.map((post) => ({
    ...post,
    __raw: post,
    title: getLocalizedField(post.title, language),
    excerpt: getLocalizedField(post.excerpt, language),
    content: getLocalizedField(post.content, language)
  })), [posts, language]);

  const workspaceStats = [
    {
      label: t('admin.blog.stats.total.label'),
      value: blogStats.total,
      hint: t('admin.blog.stats.total.hint'),
      icon: FileText
    },
    {
      label: t('admin.common.stats.published.label'),
      value: blogStats.published,
      hint: t('admin.blog.stats.published.hint'),
      icon: Globe2
    },
    {
      label: t('admin.common.stats.featured.label'),
      value: blogStats.featured,
      hint: t('admin.blog.stats.featured.hint'),
      icon: Sparkles
    },
    {
      label: t('admin.blog.stats.drafts.label'),
      value: blogStats.drafts,
      hint: t('admin.blog.stats.drafts.hint'),
      icon: PenSquare
    }
  ];

  // Permission Booleans
  const canCreate = isActionAllowed(ACTIONS.CREATE, MODULES.BLOG);
  const canEdit = isActionAllowed(ACTIONS.EDIT, MODULES.BLOG);
  const canDelete = isActionAllowed(ACTIONS.DELETE, MODULES.BLOG);
  const canFeature = isActionAllowed(ACTIONS.FEATURE, MODULES.BLOG);
  const canToggleVisibility = isActionAllowed(ACTIONS.TOGGLE_VISIBILITY, MODULES.BLOG);
  const canViewHistory = isActionAllowed(ACTIONS.VIEW_HISTORY, MODULES.BLOG);

  const handleCreate = () => {
    if (!ensurePermission(ACTIONS.CREATE)) return;
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (post) => {
    if (!ensurePermission(ACTIONS.EDIT)) return;
    const source = post.__raw || post;
    setEditingItem({
      ...source,
      tags: Array.isArray(source.tags) ? source.tags.join(', ') : (source.tags || '')
    });
    setIsFormOpen(true);
  };

  const handleDelete = (post) => {
    if (!ensurePermission(ACTIONS.DELETE)) return;
    setDeletingItem(post.__raw || post);
  };

  const handleViewHistory = (post) => {
    if (!ensurePermission(ACTIONS.VIEW_HISTORY)) return;
    setHistoryItem(post.__raw || post);
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

  const handleFormSubmit = async (formData) => {
    if (!ensurePermission(editingItem ? ACTIONS.EDIT : ACTIONS.CREATE)) return;

    await saveItem(async () => {
      let coverImage = formData.coverImage || '';
      if (formData.image instanceof File) {
        coverImage = await ImageProcessingService.compress(formData.image);
      }

      const { image: _image, ...rest } = formData;
      const action = editingItem ? 'updated' : 'created';
      await BlogService.savePost(userRole, {
        ...rest,
        coverImage,
        id: editingItem?.id,
        publishedAt: editingItem?.publishedAt,
        archivedAt: editingItem?.archivedAt
      }, (count, label) =>
        trackWrite(count, label, {
          action,
          module: 'blog',
          entityId: editingItem?.id || 'new',
          entityName: formData.titleEn
        })
      );
    });
  };

  const handleImportPosts = async (file) => {
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
      showToast(error?.message || 'Failed to import posts.', 'error');
    }
  };

  const handleConfirmImportPosts = async () => {
    if (!importDialog.items.length) return;

    setImportLoading(true);
    try {
      const { created, updated, skipped, failed } = await runImport({
        items: importDialog.items,
        buildPayload: (item) => {
          const titleEn = (item?.titleEn || getLanguageValue(item?.title, 'en', true) || '').trim();
          if (!titleEn) return null;
          const normalizedSlug = item.slug ? slugify(item.slug) : slugify(titleEn);
          const tags = Array.isArray(item.tags)
            ? item.tags.join(', ')
            : (item.tags || '');
          return {
            titleEn,
            titleKm: (item?.titleKm || getLanguageValue(item?.title, 'km', false) || '').trim(),
            slug: normalizedSlug,
            excerptEn: (item?.excerptEn || getLanguageValue(item?.excerpt, 'en', true) || '').trim(),
            excerptKm: (item?.excerptKm || getLanguageValue(item?.excerpt, 'km', false) || '').trim(),
            contentEn: (item?.contentEn || getLanguageValue(item?.content, 'en', true) || '').trim(),
            contentKm: (item?.contentKm || getLanguageValue(item?.content, 'km', false) || '').trim(),
            tags,
            coverImage: item.coverImage || '',
            featured: parseBoolean(item.featured, false),
            visible: parseBoolean(item.visible, true)
          };
        },
        fetchExistingBySlug: (slug) => BlogService.fetchPostBySlug(slug, null, true),
        save: (payload) => BlogService.savePost(userRole, payload, trackWrite)
      });

      queryClient.invalidateQueries({ queryKey: ['posts'] });
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
        t('admin.blog.messages.importComplete', { created, updated, skipped, failed }),
        failed > 0 || skipped > 0 ? 'warning' : 'success'
      );
    } catch (error) {
      showToast(error?.message || 'Failed to import posts.', 'error');
    } finally {
      setImportLoading(false);
    }
  };

  const handleExportSelectedPosts = () => {
    if (selectedIds.length === 0) {
      return showToast(t('admin.blog.messages.selectToExport'), 'warning');
    }

    const selected = posts.filter(post => selectedIds.includes(post.id));
    if (selected.length === 0) {
      return showToast(t('admin.blog.messages.selectedNotInPage'), 'warning');
    }

    downloadJson(selected, `blog_export_selected_${new Date().toISOString().split('T')[0]}.json`);
    showToast(t('admin.blog.messages.exportedMany', { count: selected.length }));
  };

  const handleDownloadBlogJsonTemplate = () => {
    const template = [{
      title: { en: 'Sample Blog Post', km: '' },
      slug: 'sample-blog-post',
      excerpt: { en: 'A short summary for the list view.', km: '' },
      content: { en: '# Your Content Here\\nThis is sample markdown content.', km: '' },
      tags: ['React', 'Tutorial'],
      featured: false,
      visible: true
    }];

    downloadJson(template, 'blog_template.json');
  };

  const handleDownloadBlogCsvTemplate = () => {
    const template = [{
      titleEn: 'Sample Blog Post',
      titleKm: '',
      slug: 'sample-blog-post',
      excerptEn: 'A short summary for the list view.',
      excerptKm: '',
      contentEn: '# Your Content Here\\nThis is sample markdown content.',
      contentKm: '',
      tags: 'React, Tutorial',
      featured: 'false',
      visible: 'true'
    }];

    const csvData = jsonToCsv(template, ['titleEn', 'titleKm', 'slug', 'excerptEn', 'excerptKm', 'contentEn', 'contentKm', 'tags', 'featured', 'visible']);
    downloadCsv(csvData, 'blog_template.csv');
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem?.id) return;
    if (!ensurePermission(ACTIONS.DELETE)) return;

    await executeDelete(async () => {
      await BlogService.deletePost(userRole, deletingItem.id, (count, label) =>
        trackDelete(count, label, {
          action: 'deleted',
          module: 'blog',
          entityId: deletingItem.id,
          entityName: getLocalizedField(deletingItem.title, 'en')
        })
      );
    });
  };

  return (
    <div className="admin-tab-container">
      <BlogToolbar
        onCreate={handleCreate}
        onSearch={handleSearch}
        searchQuery={searchQuery}
        isSearching={isSearching || isFetching}
        canCreate={canCreate}
        canBulkManage={canCreate || canEdit}
        selectedCount={selectedIds.length}
        stats={workspaceStats}
        onImportFile={handleImportPosts}
        onExportSelected={handleExportSelectedPosts}
        onDownloadTemplateCSV={handleDownloadBlogCsvTemplate}
        onDownloadTemplateJSON={handleDownloadBlogJsonTemplate}
      />

      <BulkActionsBar
        count={selectedIds.length}
        label={t('admin.blog.bulk.selected')}
        actions={[
          { icon: Eye, label: t('admin.blog.bulk.publish'), title: t('admin.blog.bulk.publishSelected'), onClick: () => handleBulkVisibility(true), disabled: !canToggleVisibility },
          { icon: EyeOff, label: t('admin.blog.bulk.hide'), title: t('admin.blog.bulk.hideSelected'), onClick: () => handleBulkVisibility(false), disabled: !canToggleVisibility },
          { divider: true },
          { icon: Star, label: t('admin.blog.bulk.feature'), title: t('admin.blog.bulk.featureSelected'), onClick: () => handleBulkFeatured(true), disabled: !canFeature },
          { icon: StarOff, label: t('admin.blog.bulk.unfeature'), title: t('admin.blog.bulk.unfeatureSelected'), onClick: () => handleBulkFeatured(false), disabled: !canFeature },
          { divider: true },
          { icon: Trash2, label: t('admin.common.delete'), title: t('admin.blog.bulk.deleteSelected'), onClick: handleBulkDelete, variant: 'danger' }
        ]}
      />

      <BlogTable
        posts={tablePosts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleVisibility={handleToggleVisibility}
        onToggleFeatured={handleToggleFeatured}
        onViewHistory={handleViewHistory}
        onCreate={handleCreate}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        canFeature={canFeature}
        canToggleVisibility={canToggleVisibility}
        canViewHistory={canViewHistory}
        loading={isLoading || bulkPending}
        page={pagination.page}
        pageSize={pagination.limit}
        totalItems={postsResult.totalCount}
        hasMore={postsResult.hasMore}
        isFirstPage={pagination.isFirstPage}
        onNext={() => pagination.fetchNext(postsResult.lastDoc)}
        onPrevious={pagination.fetchPrevious}
        onPageChange={(page, size) => {
          if (size !== pagination.limit) {
            pagination.handlePageSizeChange(size);
          }
        }}
        searchQuery={searchQuery}
        selection={selection}
      />

      {/* Dialogs */}
      <BlogFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        mode={editingItem ? 'edit' : 'create'}
        initialData={editingItem}
        onSubmit={handleFormSubmit}
        loading={formLoading}
      />

      <DeleteConfirmDialog
        open={!!deletingItem}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title={t('admin.blog.dialogs.deleteTitle')}
        message={t('admin.blog.dialogs.deleteMessage', {
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
        title={t('admin.blog.dialogs.deleteManyTitle')}
        message={t('admin.blog.dialogs.deleteManyMessage', { count: bulkConfirm.ids.length })}
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
        onConfirm={handleConfirmImportPosts}
        loading={importLoading}
        title={t('admin.blog.import.title')}
        description={t('admin.blog.import.description')}
        fileName={importDialog.fileName}
        format={importDialog.format}
        stats={[
          { label: t('admin.common.import.rowsFound'), value: importDialog.totalCount },
          { label: t('admin.common.import.readyToImport'), value: importDialog.validCount },
          { label: t('admin.common.import.skipped'), value: importDialog.skippedCount }
        ]}
        notes={[
          t('admin.blog.import.noteMissingTitle'),
          t('admin.blog.import.noteSlug')
        ]}
        confirmText={t('admin.common.import.runImport')}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        recordId={historyItem?.id}
        service={BlogService}
        title={getLocalizedField(historyItem?.title, language)}
        canRestore={canEdit}
        showToast={showToast}
      />
    </div>
  );
};

export default BlogTab;
