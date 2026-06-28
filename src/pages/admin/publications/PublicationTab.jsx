import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, Star, StarOff, Trash2, BookOpen } from 'lucide-react';
import PublicationService from '../../../services/PublicationService';
import BulkActionsBar from '../components/BulkActionsBar';
import AdminToolbar from '../components/AdminToolbar';
import PublicationsTable from './components/PublicationsTable';
import PublicationFormDialog from './components/PublicationFormDialog';
import DeleteConfirmDialog from '../../../shared/components/dialog/DeleteConfirmDialog';
import HistoryModal from '../components/HistoryModal';
import { useAdminCrud } from '../hooks/useAdminCrud';
import { useTranslation } from '../../../hooks/useTranslation';
import { getLocalizedField } from '../../../utils/localization';
import { ACTIONS, MODULES } from '../../../utils/permissions';

const PublicationTab = ({ userRole, showToast, isActionAllowed }) => {
  const { language, t } = useTranslation();
  const [bulkConfirm, setBulkConfirm] = useState({ isOpen: false, ids: [] });

  const crud = useAdminCrud({
    resourceKey: 'publications',
    module: MODULES.PUBLICATIONS || 'publications', // Fallback if not in constants
    isActionAllowed,
    showToast,
    t,
    fetchPaginated: ({ lastDoc, limit, search, trackRead }) => PublicationService.fetchPaginated({
      lastDoc,
      limit,
      search,
      searchFields: ['title.en', 'title.km', 'publisher.en', 'publisher.km'],
      sortBy: 'createdAt',
      sortDirection: 'desc',
      includeTotal: true,
      trackRead
    }),
    fetchStats: () => PublicationService.fetchStats ? PublicationService.fetchStats() : Promise.resolve({ total: 0, visible: 0, featured: 0 }),
    statsDefault: { total: 0, visible: 0, featured: 0 },
    toggleVisibility: {
      mutationFn: (id, current, trackWrite) => PublicationService.toggleVisibility(userRole, id, current, trackWrite),
      on: t('admin.publications.messages.shown', 'Publication shown'),
      off: t('admin.publications.messages.hidden', 'Publication hidden')
    },
    toggleFeatured: {
      mutationFn: (id, current, trackWrite) => PublicationService.toggleFeatured(userRole, id, current, trackWrite),
      on: t('admin.publications.messages.featured', 'Publication featured'),
      off: t('admin.publications.messages.unfeatured', 'Publication unfeatured')
    },
    bulk: {
      delete: (ids, trackDelete) => PublicationService.batchDeletePublications(userRole, ids, trackDelete),
      setVisibility: (ids, visible, trackWrite) => PublicationService.batchUpdatePublicationsVisibility(userRole, ids, visible, trackWrite),
      setFeatured: (ids, featured, trackWrite) => PublicationService.batchUpdatePublicationsFeatured(userRole, ids, featured, trackWrite),
      messages: {
        deleted: (count) => t('admin.publications.messages.deletedMany', { count }, `${count} publications deleted`),
        visibility: (count, visible) => (visible
          ? t('admin.publications.messages.shownMany', { count }, `${count} publications shown`)
          : t('admin.publications.messages.hiddenMany', { count }, `${count} publications hidden`)),
        featured: (count, featured) => (featured
          ? t('admin.publications.messages.featuredMany', { count }, `${count} publications featured`)
          : t('admin.publications.messages.unfeaturedMany', { count }, `${count} publications unfeatured`))
      }
    },
    messages: {
      created: t('admin.publications.messages.created', 'Publication created successfully'),
      updated: t('admin.publications.messages.updated', 'Publication updated successfully'),
      deleted: t('admin.publications.messages.deleted', 'Publication deleted successfully')
    }
  });

  const {
    items: publications,
    listResult: publicationsResult,
    stats: publicationStats,
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
    trackDelete
  } = crud;

  const tablePublications = useMemo(() => publications.map((pub) => ({
    ...pub,
    __raw: pub,
    title: pub.title,
    publisher: pub.publisher,
  })), [publications]);

  const workspaceStats = [
    { label: t('admin.publications.stats.total', 'Total Publications'), value: publicationStats.total, icon: BookOpen },
    { label: t('admin.common.stats.published.label', 'Published'), value: publicationStats.visible, icon: Eye },
    { label: t('admin.common.stats.featured.label', 'Featured'), value: publicationStats.featured, icon: Star },
  ];

  const canCreate = isActionAllowed(ACTIONS.CREATE, MODULES.PUBLICATIONS || 'publications');
  const canEdit = isActionAllowed(ACTIONS.EDIT, MODULES.PUBLICATIONS || 'publications');
  const canDelete = isActionAllowed(ACTIONS.DELETE, MODULES.PUBLICATIONS || 'publications');
  const canFeature = isActionAllowed(ACTIONS.FEATURE, MODULES.PUBLICATIONS || 'publications');
  const canToggleVisibility = isActionAllowed(ACTIONS.TOGGLE_VISIBILITY, MODULES.PUBLICATIONS || 'publications');
  const canViewHistory = isActionAllowed(ACTIONS.VIEW_HISTORY, MODULES.PUBLICATIONS || 'publications');

  const handleAdd = () => {
    if (!ensurePermission(ACTIONS.CREATE)) return;
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item) => {
    if (!ensurePermission(ACTIONS.EDIT)) return;
    setEditingItem(item.__raw || item);
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
      const action = editingItem ? 'updated' : 'created';
      const processedData = {
        title: { en: formData.titleEn, km: formData.titleKm },
        publisher: { en: formData.publisherEn, km: formData.publisherKm },
        description: { en: formData.descriptionEn, km: formData.descriptionKm },
        publishDate: formData.publishDate,
        link: formData.link,
        visible: formData.visible,
        featured: formData.featured
      };
      await PublicationService.savePublication(userRole, { ...processedData, id: editingItem?.id || null }, (count, label) =>
        trackWrite(count, label, {
          action,
          module: 'publications',
          entityId: editingItem?.id || 'new',
          entityName: formData.titleEn
        })
      );
    });
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    if (!ensurePermission(ACTIONS.DELETE)) return;

    await executeDelete(async () => {
      await PublicationService.deletePublication(userRole, deletingItem.id, (count, label) =>
        trackDelete(count, label, {
          action: 'deleted',
          module: 'publications',
          entityId: deletingItem.id,
          entityName: getLocalizedField(deletingItem.title, 'en')
        })
      );
    });
  };

  return (
    <div className="admin-tab-container">
      <AdminToolbar
        onAdd={handleAdd}
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        isSearching={isSearching}
        canCreate={canCreate}
        stats={workspaceStats}
        addLabel={t('admin.publications.toolbar.add', 'Add Publication')}
        searchPlaceholder={t('admin.publications.toolbar.search', 'Search publications...')}
      />

      <BulkActionsBar
        count={selectedIds.length}
        label={t('admin.common.bulk.selected', '{count} selected', { count: selectedIds.length })}
        actions={[
          { icon: Eye, label: t('admin.common.bulk.show', 'Show'), title: t('admin.publications.bulk.showSelected', 'Show selected'), onClick: () => handleBulkVisibility(true), disabled: !canToggleVisibility },
          { icon: EyeOff, label: t('admin.common.bulk.hide', 'Hide'), title: t('admin.publications.bulk.hideSelected', 'Hide selected'), onClick: () => handleBulkVisibility(false), disabled: !canToggleVisibility },
          { divider: true },
          { icon: Star, label: t('admin.common.bulk.feature', 'Feature'), title: t('admin.publications.bulk.featureSelected', 'Feature selected'), onClick: () => handleBulkFeatured(true), disabled: !canFeature },
          { icon: StarOff, label: t('admin.common.bulk.unfeature', 'Unfeature'), title: t('admin.publications.bulk.unfeatureSelected', 'Unfeature selected'), onClick: () => handleBulkFeatured(false), disabled: !canFeature },
          { divider: true },
          { icon: Trash2, label: t('admin.common.delete', 'Delete'), title: t('admin.publications.bulk.deleteSelected', 'Delete selected'), onClick: handleBulkDelete, variant: 'danger' }
        ]}
      />

      <PublicationsTable
        publications={tablePublications}
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
        totalItems={publicationsResult.totalCount}
        hasMore={publicationsResult.hasMore}
        isFirstPage={pagination.isFirstPage}
        onNext={() => pagination.fetchNext(publicationsResult.lastDoc)}
        onPrevious={pagination.fetchPrevious}
        onPageChange={(page, size) => {
          if (size !== pagination.limit) {
            pagination.handlePageSizeChange(size);
          }
        }}
        searchQuery={searchQuery}
        selection={selection}
      />

      <PublicationFormDialog
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
        title={t('admin.publications.dialogs.deleteTitle', 'Delete Publication')}
        message={t('admin.publications.dialogs.deleteMessage', 'Are you sure you want to delete this publication?', {
          name: getLocalizedField(deletingItem?.title, language)
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
        title={t('admin.publications.dialogs.deleteManyTitle', 'Delete Multiple Publications')}
        message={t('admin.publications.dialogs.deleteManyMessage', 'Are you sure you want to delete multiple publications?', { count: bulkConfirm.ids.length })}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        recordId={historyItem?.id}
        service={PublicationService}
        title={getLocalizedField(historyItem?.title, language)}
        canRestore={canEdit}
        showToast={showToast}
      />
    </div>
  );
};

export default PublicationTab;
