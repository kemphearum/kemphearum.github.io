import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, Star, StarOff, Trash2, Award } from 'lucide-react';
import AwardService from '../../../services/AwardService';
import BulkActionsBar from '../components/BulkActionsBar';
import AdminToolbar from '../components/AdminToolbar';
import AwardsTable from './components/AwardsTable';
import AwardFormDialog from './components/AwardFormDialog';
import DeleteConfirmDialog from '../../../shared/components/dialog/DeleteConfirmDialog';
import HistoryModal from '../components/HistoryModal';
import { useAdminCrud } from '../hooks/useAdminCrud';
import { useTranslation } from '../../../hooks/useTranslation';
import { getLocalizedField } from '../../../utils/localization';
import { ACTIONS, MODULES } from '../../../utils/permissions';

const AwardTab = ({ userRole, showToast, isActionAllowed }) => {
  const { language, t } = useTranslation();
  const [bulkConfirm, setBulkConfirm] = useState({ isOpen: false, ids: [] });

  const crud = useAdminCrud({
    resourceKey: 'awards',
    module: MODULES.AWARDS || 'awards', // Fallback if not in constants
    isActionAllowed,
    showToast,
    t,
    fetchPaginated: ({ lastDoc, limit, search, trackRead }) => AwardService.fetchPaginated({
      lastDoc,
      limit,
      search,
      searchFields: ['title.en', 'title.km', 'organization.en', 'organization.km'],
      sortBy: 'createdAt',
      sortDirection: 'desc',
      includeTotal: true,
      trackRead
    }),
    fetchStats: () => AwardService.fetchStats ? AwardService.fetchStats() : Promise.resolve({ total: 0, visible: 0, featured: 0 }),
    statsDefault: { total: 0, visible: 0, featured: 0 },
    toggleVisibility: {
      mutationFn: (id, current, trackWrite) => AwardService.toggleVisibility(userRole, id, current, trackWrite),
      on: t('admin.awards.messages.shown', 'Award shown'),
      off: t('admin.awards.messages.hidden', 'Award hidden')
    },
    toggleFeatured: {
      mutationFn: (id, current, trackWrite) => AwardService.toggleFeatured(userRole, id, current, trackWrite),
      on: t('admin.awards.messages.featured', 'Award featured'),
      off: t('admin.awards.messages.unfeatured', 'Award unfeatured')
    },
    bulk: {
      delete: (ids, trackDelete) => AwardService.batchDeleteAwards(userRole, ids, trackDelete),
      setVisibility: (ids, visible, trackWrite) => AwardService.batchUpdateAwardsVisibility(userRole, ids, visible, trackWrite),
      setFeatured: (ids, featured, trackWrite) => AwardService.batchUpdateAwardsFeatured(userRole, ids, featured, trackWrite),
      messages: {
        deleted: (count) => t('admin.awards.messages.deletedMany', { count }, `${count} awards deleted`),
        visibility: (count, visible) => (visible
          ? t('admin.awards.messages.shownMany', { count }, `${count} awards shown`)
          : t('admin.awards.messages.hiddenMany', { count }, `${count} awards hidden`)),
        featured: (count, featured) => (featured
          ? t('admin.awards.messages.featuredMany', { count }, `${count} awards featured`)
          : t('admin.awards.messages.unfeaturedMany', { count }, `${count} awards unfeatured`))
      }
    },
    messages: {
      created: t('admin.awards.messages.created', 'Award created successfully'),
      updated: t('admin.awards.messages.updated', 'Award updated successfully'),
      deleted: t('admin.awards.messages.deleted', 'Award deleted successfully')
    }
  });

  const {
    items: awards,
    listResult: awardsResult,
    stats: awardStats,
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

  const tableAwards = useMemo(() => awards.map((award) => ({
    ...award,
    __raw: award,
    title: award.title,
    organization: award.organization,
  })), [awards]);

  const workspaceStats = [
    { label: t('admin.awards.stats.total', 'Total Awards'), value: awardStats.total, icon: Award },
    { label: t('admin.common.stats.published', 'Published'), value: awardStats.visible, icon: Eye },
    { label: t('admin.common.stats.featured', 'Featured'), value: awardStats.featured, icon: Star },
  ];

  const canCreate = isActionAllowed(ACTIONS.CREATE, MODULES.AWARDS || 'awards');
  const canEdit = isActionAllowed(ACTIONS.EDIT, MODULES.AWARDS || 'awards');
  const canDelete = isActionAllowed(ACTIONS.DELETE, MODULES.AWARDS || 'awards');
  const canFeature = isActionAllowed(ACTIONS.FEATURE, MODULES.AWARDS || 'awards');
  const canToggleVisibility = isActionAllowed(ACTIONS.TOGGLE_VISIBILITY, MODULES.AWARDS || 'awards');
  const canViewHistory = isActionAllowed(ACTIONS.VIEW_HISTORY, MODULES.AWARDS || 'awards');

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
      // Build title, org, description to match Domain structure
      const processedData = {
        title: { en: formData.titleEn, km: formData.titleKm },
        organization: { en: formData.organizationEn, km: formData.organizationKm },
        description: { en: formData.descriptionEn, km: formData.descriptionKm },
        issueDate: formData.issueDate,
        link: formData.link,
        visible: formData.visible,
        featured: formData.featured
      };
      await AwardService.saveAward(userRole, { ...processedData, id: editingItem?.id || null }, (count, label) =>
        trackWrite(count, label, {
          action,
          module: 'awards',
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
      await AwardService.deleteAward(userRole, deletingItem.id, (count, label) =>
        trackDelete(count, label, {
          action: 'deleted',
          module: 'awards',
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
        addLabel={t('admin.awards.toolbar.add', 'Add Award')}
        searchPlaceholder={t('admin.awards.toolbar.search', 'Search awards...')}
      />

      <BulkActionsBar
        count={selectedIds.length}
        label={t('admin.common.bulk.selected', '{count} selected', { count: selectedIds.length })}
        actions={[
          { icon: Eye, label: t('admin.common.bulk.show', 'Show'), title: t('admin.awards.bulk.showSelected', 'Show selected'), onClick: () => handleBulkVisibility(true), disabled: !canToggleVisibility },
          { icon: EyeOff, label: t('admin.common.bulk.hide', 'Hide'), title: t('admin.awards.bulk.hideSelected', 'Hide selected'), onClick: () => handleBulkVisibility(false), disabled: !canToggleVisibility },
          { divider: true },
          { icon: Star, label: t('admin.common.bulk.feature', 'Feature'), title: t('admin.awards.bulk.featureSelected', 'Feature selected'), onClick: () => handleBulkFeatured(true), disabled: !canFeature },
          { icon: StarOff, label: t('admin.common.bulk.unfeature', 'Unfeature'), title: t('admin.awards.bulk.unfeatureSelected', 'Unfeature selected'), onClick: () => handleBulkFeatured(false), disabled: !canFeature },
          { divider: true },
          { icon: Trash2, label: t('admin.common.delete', 'Delete'), title: t('admin.awards.bulk.deleteSelected', 'Delete selected'), onClick: handleBulkDelete, variant: 'danger' }
        ]}
      />

      <AwardsTable
        awards={tableAwards}
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
        totalItems={awardsResult.totalCount}
        hasMore={awardsResult.hasMore}
        isFirstPage={pagination.isFirstPage}
        onNext={() => pagination.fetchNext(awardsResult.lastDoc)}
        onPrevious={pagination.fetchPrevious}
        onPageChange={(page, size) => {
          if (size !== pagination.limit) {
            pagination.handlePageSizeChange(size);
          }
        }}
        searchQuery={searchQuery}
        selection={selection}
      />

      <AwardFormDialog
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
        title={t('admin.awards.dialogs.deleteTitle', 'Delete Award')}
        message={t('admin.awards.dialogs.deleteMessage', 'Are you sure you want to delete this award?', {
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
        title={t('admin.awards.dialogs.deleteManyTitle', 'Delete Multiple Awards')}
        message={t('admin.awards.dialogs.deleteManyMessage', 'Are you sure you want to delete multiple awards?', { count: bulkConfirm.ids.length })}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        recordId={historyItem?.id}
        service={AwardService}
        title={getLocalizedField(historyItem?.title, language)}
        canRestore={canEdit}
        showToast={showToast}
      />
    </div>
  );
};

export default AwardTab;
