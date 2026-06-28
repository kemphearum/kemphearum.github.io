import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, Star, StarOff, Trash2, Mic } from 'lucide-react';
import SpeakingService from '../../../services/SpeakingService';
import BulkActionsBar from '../components/BulkActionsBar';
import AdminToolbar from '../components/AdminToolbar';
import SpeakingTable from './components/SpeakingTable';
import SpeakingFormDialog from './components/SpeakingFormDialog';
import DeleteConfirmDialog from '../../../shared/components/dialog/DeleteConfirmDialog';
import HistoryModal from '../components/HistoryModal';
import { useAdminCrud } from '../hooks/useAdminCrud';
import { useTranslation } from '../../../hooks/useTranslation';
import { getLocalizedField } from '../../../utils/localization';
import { ACTIONS, MODULES } from '../../../utils/permissions';

const SpeakingTab = ({ userRole, showToast, isActionAllowed }) => {
  const { language, t } = useTranslation();
  const [bulkConfirm, setBulkConfirm] = useState({ isOpen: false, ids: [] });

  const crud = useAdminCrud({
    resourceKey: 'speaking',
    module: MODULES.SPEAKING || 'speaking', // Fallback if not in constants
    isActionAllowed,
    showToast,
    t,
    fetchPaginated: ({ lastDoc, limit, search, trackRead }) => SpeakingService.fetchPaginated({
      lastDoc,
      limit,
      search,
      searchFields: ['title.en', 'title.km', 'eventName.en', 'eventName.km', 'location.en', 'location.km'],
      sortBy: 'createdAt',
      sortDirection: 'desc',
      includeTotal: true,
      trackRead
    }),
    fetchStats: () => SpeakingService.fetchStats ? SpeakingService.fetchStats() : Promise.resolve({ total: 0, visible: 0, featured: 0 }),
    statsDefault: { total: 0, visible: 0, featured: 0 },
    toggleVisibility: {
      mutationFn: (id, current, trackWrite) => SpeakingService.toggleVisibility(userRole, id, current, trackWrite),
      on: t('admin.speaking.messages.shown', 'Speaking event shown'),
      off: t('admin.speaking.messages.hidden', 'Speaking event hidden')
    },
    toggleFeatured: {
      mutationFn: (id, current, trackWrite) => SpeakingService.toggleFeatured(userRole, id, current, trackWrite),
      on: t('admin.speaking.messages.featured', 'Speaking event featured'),
      off: t('admin.speaking.messages.unfeatured', 'Speaking event unfeatured')
    },
    bulk: {
      delete: (ids, trackDelete) => SpeakingService.batchDeleteSpeaking(userRole, ids, trackDelete),
      setVisibility: (ids, visible, trackWrite) => SpeakingService.batchUpdateSpeakingVisibility(userRole, ids, visible, trackWrite),
      setFeatured: (ids, featured, trackWrite) => SpeakingService.batchUpdateSpeakingFeatured(userRole, ids, featured, trackWrite),
      messages: {
        deleted: (count) => t('admin.speaking.messages.deletedMany', { count }, `${count} events deleted`),
        visibility: (count, visible) => (visible
          ? t('admin.speaking.messages.shownMany', { count }, `${count} events shown`)
          : t('admin.speaking.messages.hiddenMany', { count }, `${count} events hidden`)),
        featured: (count, featured) => (featured
          ? t('admin.speaking.messages.featuredMany', { count }, `${count} events featured`)
          : t('admin.speaking.messages.unfeaturedMany', { count }, `${count} events unfeatured`))
      }
    },
    messages: {
      created: t('admin.speaking.messages.created', 'Speaking event created successfully'),
      updated: t('admin.speaking.messages.updated', 'Speaking event updated successfully'),
      deleted: t('admin.speaking.messages.deleted', 'Speaking event deleted successfully')
    }
  });

  const {
    items: speakingEvents,
    listResult: speakingResult,
    stats: speakingStats,
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

  const tableSpeaking = useMemo(() => speakingEvents.map((event) => ({
    ...event,
    __raw: event,
    title: event.title,
    eventName: event.eventName,
    location: event.location,
  })), [speakingEvents]);

  const workspaceStats = [
    { label: t('admin.speaking.stats.total', 'Total Events'), value: speakingStats.total, icon: Mic },
    { label: t('admin.common.stats.published', 'Published'), value: speakingStats.visible, icon: Eye },
    { label: t('admin.common.stats.featured', 'Featured'), value: speakingStats.featured, icon: Star },
  ];

  const canCreate = isActionAllowed(ACTIONS.CREATE, MODULES.SPEAKING || 'speaking');
  const canEdit = isActionAllowed(ACTIONS.EDIT, MODULES.SPEAKING || 'speaking');
  const canDelete = isActionAllowed(ACTIONS.DELETE, MODULES.SPEAKING || 'speaking');
  const canFeature = isActionAllowed(ACTIONS.FEATURE, MODULES.SPEAKING || 'speaking');
  const canToggleVisibility = isActionAllowed(ACTIONS.TOGGLE_VISIBILITY, MODULES.SPEAKING || 'speaking');
  const canViewHistory = isActionAllowed(ACTIONS.VIEW_HISTORY, MODULES.SPEAKING || 'speaking');

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
        eventName: { en: formData.eventNameEn, km: formData.eventNameKm },
        location: { en: formData.locationEn, km: formData.locationKm },
        description: { en: formData.descriptionEn, km: formData.descriptionKm },
        date: formData.date,
        link: formData.link,
        visible: formData.visible,
        featured: formData.featured
      };
      await SpeakingService.saveSpeaking(userRole, { ...processedData, id: editingItem?.id || null }, (count, label) =>
        trackWrite(count, label, {
          action,
          module: 'speaking',
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
      await SpeakingService.deleteSpeaking(userRole, deletingItem.id, (count, label) =>
        trackDelete(count, label, {
          action: 'deleted',
          module: 'speaking',
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
        addLabel={t('admin.speaking.toolbar.add', 'Add Event')}
        searchPlaceholder={t('admin.speaking.toolbar.search', 'Search events...')}
      />

      <BulkActionsBar
        count={selectedIds.length}
        label={t('admin.common.bulk.selected', '{count} selected', { count: selectedIds.length })}
        actions={[
          { icon: Eye, label: t('admin.common.bulk.show', 'Show'), title: t('admin.speaking.bulk.showSelected', 'Show selected'), onClick: () => handleBulkVisibility(true), disabled: !canToggleVisibility },
          { icon: EyeOff, label: t('admin.common.bulk.hide', 'Hide'), title: t('admin.speaking.bulk.hideSelected', 'Hide selected'), onClick: () => handleBulkVisibility(false), disabled: !canToggleVisibility },
          { divider: true },
          { icon: Star, label: t('admin.common.bulk.feature', 'Feature'), title: t('admin.speaking.bulk.featureSelected', 'Feature selected'), onClick: () => handleBulkFeatured(true), disabled: !canFeature },
          { icon: StarOff, label: t('admin.common.bulk.unfeature', 'Unfeature'), title: t('admin.speaking.bulk.unfeatureSelected', 'Unfeature selected'), onClick: () => handleBulkFeatured(false), disabled: !canFeature },
          { divider: true },
          { icon: Trash2, label: t('admin.common.delete', 'Delete'), title: t('admin.speaking.bulk.deleteSelected', 'Delete selected'), onClick: handleBulkDelete, variant: 'danger' }
        ]}
      />

      <SpeakingTable
        speakingEvents={tableSpeaking}
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
        totalItems={speakingResult.totalCount}
        hasMore={speakingResult.hasMore}
        isFirstPage={pagination.isFirstPage}
        onNext={() => pagination.fetchNext(speakingResult.lastDoc)}
        onPrevious={pagination.fetchPrevious}
        onPageChange={(page, size) => {
          if (size !== pagination.limit) {
            pagination.handlePageSizeChange(size);
          }
        }}
        searchQuery={searchQuery}
        selection={selection}
      />

      <SpeakingFormDialog
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
        title={t('admin.speaking.dialogs.deleteTitle', 'Delete Event')}
        message={t('admin.speaking.dialogs.deleteMessage', 'Are you sure you want to delete this speaking event?', {
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
        title={t('admin.speaking.dialogs.deleteManyTitle', 'Delete Multiple Events')}
        message={t('admin.speaking.dialogs.deleteManyMessage', 'Are you sure you want to delete multiple events?', { count: bulkConfirm.ids.length })}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        recordId={historyItem?.id}
        service={SpeakingService}
        title={getLocalizedField(historyItem?.title, language)}
        canRestore={canEdit}
        showToast={showToast}
      />
    </div>
  );
};

export default SpeakingTab;
