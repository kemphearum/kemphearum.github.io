import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, Star, StarOff, Trash2, Sparkles, Layers } from 'lucide-react';
import SkillService from '../../../services/SkillService';
import BulkActionsBar from '../components/BulkActionsBar';
import SkillsToolbar from './components/SkillsToolbar';
import SkillsTable from './components/SkillsTable';
import SkillsFormDialog from './components/SkillsFormDialog';
import DeleteConfirmDialog from '../../../shared/components/dialog/DeleteConfirmDialog';
import HistoryModal from '../components/HistoryModal';
import { useAdminCrud } from '../hooks/useAdminCrud';
import { useTranslation } from '../../../hooks/useTranslation';
import { getLocalizedField } from '../../../utils/localization';
import { ACTIONS, MODULES } from '../../../utils/permissions';
import ImageProcessingService from '../../../services/ImageProcessingService';

const SkillsTab = ({ userRole, showToast, isActionAllowed }) => {
  const { language, t } = useTranslation();
  const [bulkConfirm, setBulkConfirm] = useState({ isOpen: false, ids: [] });

  const crud = useAdminCrud({
    resourceKey: 'skills',
    module: MODULES.SKILLS,
    isActionAllowed,
    showToast,
    t,
    fetchPaginated: ({ lastDoc, limit, search, trackRead }) => SkillService.fetchPaginated({
      lastDoc,
      limit,
      search,
      searchFields: ['name.en', 'name.km', 'category', 'slug'],
      sortBy: 'createdAt',
      sortDirection: 'desc',
      includeTotal: true,
      trackRead
    }),
    fetchStats: () => SkillService.fetchStats(),
    statsDefault: { total: 0, visible: 0, featured: 0, categories: 0 },
    toggleVisibility: {
      mutationFn: (id, current, trackWrite) => SkillService.toggleVisibility(userRole, id, current, trackWrite),
      on: t('admin.skills.messages.shown'),
      off: t('admin.skills.messages.hidden')
    },
    toggleFeatured: {
      mutationFn: (id, current, trackWrite) => SkillService.toggleFeatured(userRole, id, current, trackWrite),
      on: t('admin.skills.messages.featured'),
      off: t('admin.skills.messages.unfeatured')
    },
    bulk: {
      delete: (ids, trackDelete) => SkillService.batchDeleteSkills(userRole, ids, trackDelete),
      setVisibility: (ids, visible, trackWrite) => SkillService.batchUpdateSkillsVisibility(userRole, ids, visible, trackWrite),
      setFeatured: (ids, featured, trackWrite) => SkillService.batchUpdateSkillsFeatured(userRole, ids, featured, trackWrite),
      messages: {
        deleted: (count) => t('admin.skills.messages.deletedMany', { count }),
        visibility: (count, visible) => (visible
          ? t('admin.skills.messages.shownMany', { count })
          : t('admin.skills.messages.hiddenMany', { count })),
        featured: (count, featured) => (featured
          ? t('admin.skills.messages.featuredMany', { count })
          : t('admin.skills.messages.unfeaturedMany', { count }))
      }
    },
    messages: {
      created: t('admin.skills.messages.created'),
      updated: t('admin.skills.messages.updated'),
      deleted: t('admin.skills.messages.deleted')
    }
  });

  const {
    items: skills,
    listResult: skillsResult,
    stats: skillStats,
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

  const tableSkills = useMemo(() => skills.map((skill) => ({
    ...skill,
    __raw: skill,
    name: getLocalizedField(skill.name, language),
    description: getLocalizedField(skill.description, language)
  })), [skills, language]);

  const workspaceStats = [
    { label: t('admin.skills.stats.total.label'), value: skillStats.total, hint: t('admin.skills.stats.total.hint'), icon: Sparkles },
    { label: t('admin.common.stats.published.label'), value: skillStats.visible, hint: t('admin.skills.stats.visible.hint'), icon: Eye },
    { label: t('admin.common.stats.featured.label'), value: skillStats.featured, hint: t('admin.skills.stats.featured.hint'), icon: Star },
    { label: t('admin.skills.stats.categories.label'), value: skillStats.categories, hint: t('admin.skills.stats.categories.hint'), icon: Layers }
  ];

  const canCreate = isActionAllowed(ACTIONS.CREATE, MODULES.SKILLS);
  const canEdit = isActionAllowed(ACTIONS.EDIT, MODULES.SKILLS);
  const canDelete = isActionAllowed(ACTIONS.DELETE, MODULES.SKILLS);
  const canFeature = isActionAllowed(ACTIONS.FEATURE, MODULES.SKILLS);
  const canToggleVisibility = isActionAllowed(ACTIONS.TOGGLE_VISIBILITY, MODULES.SKILLS);
  const canViewHistory = isActionAllowed(ACTIONS.VIEW_HISTORY, MODULES.SKILLS);

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
      let iconUrl = formData.iconUrl || '';
      if (formData.icon instanceof File) {
        iconUrl = await ImageProcessingService.compress(formData.icon);
      }

      const { icon: _icon, ...rest } = formData;
      const action = editingItem ? 'updated' : 'created';
      await SkillService.saveSkill(userRole, { ...rest, iconUrl, id: editingItem?.id || null }, (count, label) =>
        trackWrite(count, label, {
          action,
          module: 'skills',
          entityId: editingItem?.id || 'new',
          entityName: formData.nameEn
        })
      );
    });
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    if (!ensurePermission(ACTIONS.DELETE)) return;

    await executeDelete(async () => {
      await SkillService.deleteSkill(userRole, deletingItem.id, (count, label) =>
        trackDelete(count, label, {
          action: 'deleted',
          module: 'skills',
          entityId: deletingItem.id,
          entityName: getLocalizedField(deletingItem.name, 'en')
        })
      );
    });
  };

  return (
    <div className="admin-tab-container">
      <SkillsToolbar
        onAdd={handleAdd}
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        isSearching={isSearching}
        canCreate={canCreate}
        stats={workspaceStats}
      />

      <BulkActionsBar
        count={selectedIds.length}
        label={t('admin.skills.bulk.selected')}
        actions={[
          { icon: Eye, label: t('admin.skills.bulk.show'), title: t('admin.skills.bulk.showSelected'), onClick: () => handleBulkVisibility(true), disabled: !canToggleVisibility },
          { icon: EyeOff, label: t('admin.skills.bulk.hide'), title: t('admin.skills.bulk.hideSelected'), onClick: () => handleBulkVisibility(false), disabled: !canToggleVisibility },
          { divider: true },
          { icon: Star, label: t('admin.skills.bulk.feature'), title: t('admin.skills.bulk.featureSelected'), onClick: () => handleBulkFeatured(true), disabled: !canFeature },
          { icon: StarOff, label: t('admin.skills.bulk.unfeature'), title: t('admin.skills.bulk.unfeatureSelected'), onClick: () => handleBulkFeatured(false), disabled: !canFeature },
          { divider: true },
          { icon: Trash2, label: t('admin.common.delete'), title: t('admin.skills.bulk.deleteSelected'), onClick: handleBulkDelete, variant: 'danger' }
        ]}
      />

      <SkillsTable
        skills={tableSkills}
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
        totalItems={skillsResult.totalCount}
        hasMore={skillsResult.hasMore}
        isFirstPage={pagination.isFirstPage}
        onNext={() => pagination.fetchNext(skillsResult.lastDoc)}
        onPrevious={pagination.fetchPrevious}
        onPageChange={(page, size) => {
          if (size !== pagination.limit) {
            pagination.handlePageSizeChange(size);
          }
        }}
        searchQuery={searchQuery}
        selection={selection}
      />

      <SkillsFormDialog
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
        title={t('admin.skills.dialogs.deleteTitle')}
        message={t('admin.skills.dialogs.deleteMessage', {
          name: getLocalizedField(deletingItem?.name, language)
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
        title={t('admin.skills.dialogs.deleteManyTitle')}
        message={t('admin.skills.dialogs.deleteManyMessage', { count: bulkConfirm.ids.length })}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        recordId={historyItem?.id}
        service={SkillService}
        title={getLocalizedField(historyItem?.name, language)}
        canRestore={canEdit}
        showToast={showToast}
      />
    </div>
  );
};

export default SkillsTab;
