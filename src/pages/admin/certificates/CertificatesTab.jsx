import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, Star, StarOff, Trash2, Award, Building2 } from 'lucide-react';
import CertificateService from '../../../services/CertificateService';
import BulkActionsBar from '../components/BulkActionsBar';
import CertificatesToolbar from './components/CertificatesToolbar';
import CertificatesTable from './components/CertificatesTable';
import CertificatesFormDialog from './components/CertificatesFormDialog';
import DeleteConfirmDialog from '../../../shared/components/dialog/DeleteConfirmDialog';
import HistoryModal from '../components/HistoryModal';
import { useAdminCrud } from '../hooks/useAdminCrud';
import { useTranslation } from '../../../hooks/useTranslation';
import { getLocalizedField } from '../../../utils/localization';
import { ACTIONS, MODULES } from '../../../utils/permissions';

const CertificatesTab = ({ userRole, showToast, isActionAllowed }) => {
  const { language, t } = useTranslation();
  const [bulkConfirm, setBulkConfirm] = useState({ isOpen: false, ids: [] });

  const crud = useAdminCrud({
    resourceKey: 'certificates',
    module: MODULES.CERTIFICATES,
    isActionAllowed,
    showToast,
    t,
    fetchPaginated: ({ lastDoc, limit, search, trackRead }) => CertificateService.fetchPaginated({
      lastDoc,
      limit,
      search,
      searchFields: ['name.en', 'name.km', 'organization', 'credentialId', 'slug'],
      sortBy: 'createdAt',
      sortDirection: 'desc',
      includeTotal: true,
      trackRead
    }),
    fetchStats: () => CertificateService.fetchStats(),
    statsDefault: { total: 0, visible: 0, featured: 0, organizations: 0 },
    toggleVisibility: {
      mutationFn: (id, current, trackWrite) => CertificateService.toggleVisibility(userRole, id, current, trackWrite),
      on: t('admin.certificates.messages.shown'),
      off: t('admin.certificates.messages.hidden')
    },
    toggleFeatured: {
      mutationFn: (id, current, trackWrite) => CertificateService.toggleFeatured(userRole, id, current, trackWrite),
      on: t('admin.certificates.messages.featured'),
      off: t('admin.certificates.messages.unfeatured')
    },
    bulk: {
      delete: (ids, trackDelete) => CertificateService.batchDeleteCertificates(userRole, ids, trackDelete),
      setVisibility: (ids, visible, trackWrite) => CertificateService.batchUpdateCertificatesVisibility(userRole, ids, visible, trackWrite),
      setFeatured: (ids, featured, trackWrite) => CertificateService.batchUpdateCertificatesFeatured(userRole, ids, featured, trackWrite),
      messages: {
        deleted: (count) => t('admin.certificates.messages.deletedMany', { count }),
        visibility: (count, visible) => (visible
          ? t('admin.certificates.messages.shownMany', { count })
          : t('admin.certificates.messages.hiddenMany', { count })),
        featured: (count, featured) => (featured
          ? t('admin.certificates.messages.featuredMany', { count })
          : t('admin.certificates.messages.unfeaturedMany', { count }))
      }
    },
    messages: {
      created: t('admin.certificates.messages.created'),
      updated: t('admin.certificates.messages.updated'),
      deleted: t('admin.certificates.messages.deleted')
    }
  });

  const {
    items: certificates,
    listResult: certificatesResult,
    stats: certificateStats,
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

  const tableCertificates = useMemo(() => certificates.map((certificate) => ({
    ...certificate,
    __raw: certificate,
    name: getLocalizedField(certificate.name, language),
    description: getLocalizedField(certificate.description, language)
  })), [certificates, language]);

  const workspaceStats = [
    { label: t('admin.certificates.stats.total.label'), value: certificateStats.total, hint: t('admin.certificates.stats.total.hint'), icon: Award },
    { label: t('admin.common.stats.published.label'), value: certificateStats.visible, hint: t('admin.certificates.stats.visible.hint'), icon: Eye },
    { label: t('admin.common.stats.featured.label'), value: certificateStats.featured, hint: t('admin.certificates.stats.featured.hint'), icon: Star },
    { label: t('admin.certificates.stats.organizations.label'), value: certificateStats.organizations, hint: t('admin.certificates.stats.organizations.hint'), icon: Building2 }
  ];

  const canCreate = isActionAllowed(ACTIONS.CREATE, MODULES.CERTIFICATES);
  const canEdit = isActionAllowed(ACTIONS.EDIT, MODULES.CERTIFICATES);
  const canDelete = isActionAllowed(ACTIONS.DELETE, MODULES.CERTIFICATES);
  const canFeature = isActionAllowed(ACTIONS.FEATURE, MODULES.CERTIFICATES);
  const canToggleVisibility = isActionAllowed(ACTIONS.TOGGLE_VISIBILITY, MODULES.CERTIFICATES);
  const canViewHistory = isActionAllowed(ACTIONS.VIEW_HISTORY, MODULES.CERTIFICATES);

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
      await CertificateService.saveCertificate(userRole, { ...formData, id: editingItem?.id || null }, (count, label) =>
        trackWrite(count, label, {
          action,
          module: 'certificates',
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
      await CertificateService.deleteCertificate(userRole, deletingItem.id, (count, label) =>
        trackDelete(count, label, {
          action: 'deleted',
          module: 'certificates',
          entityId: deletingItem.id,
          entityName: getLocalizedField(deletingItem.name, 'en')
        })
      );
    });
  };

  return (
    <div className="admin-tab-container">
      <CertificatesToolbar
        onAdd={handleAdd}
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        isSearching={isSearching}
        canCreate={canCreate}
        stats={workspaceStats}
      />

      <BulkActionsBar
        count={selectedIds.length}
        label={t('admin.certificates.bulk.selected')}
        actions={[
          { icon: Eye, label: t('admin.certificates.bulk.show'), title: t('admin.certificates.bulk.showSelected'), onClick: () => handleBulkVisibility(true), disabled: !canToggleVisibility },
          { icon: EyeOff, label: t('admin.certificates.bulk.hide'), title: t('admin.certificates.bulk.hideSelected'), onClick: () => handleBulkVisibility(false), disabled: !canToggleVisibility },
          { divider: true },
          { icon: Star, label: t('admin.certificates.bulk.feature'), title: t('admin.certificates.bulk.featureSelected'), onClick: () => handleBulkFeatured(true), disabled: !canFeature },
          { icon: StarOff, label: t('admin.certificates.bulk.unfeature'), title: t('admin.certificates.bulk.unfeatureSelected'), onClick: () => handleBulkFeatured(false), disabled: !canFeature },
          { divider: true },
          { icon: Trash2, label: t('admin.common.delete'), title: t('admin.certificates.bulk.deleteSelected'), onClick: handleBulkDelete, variant: 'danger' }
        ]}
      />

      <CertificatesTable
        certificates={tableCertificates}
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
        totalItems={certificatesResult.totalCount}
        hasMore={certificatesResult.hasMore}
        isFirstPage={pagination.isFirstPage}
        onNext={() => pagination.fetchNext(certificatesResult.lastDoc)}
        onPrevious={pagination.fetchPrevious}
        onPageChange={(page, size) => {
          if (size !== pagination.limit) {
            pagination.handlePageSizeChange(size);
          }
        }}
        searchQuery={searchQuery}
        selection={selection}
      />

      <CertificatesFormDialog
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
        title={t('admin.certificates.dialogs.deleteTitle')}
        message={t('admin.certificates.dialogs.deleteMessage', {
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
        title={t('admin.certificates.dialogs.deleteManyTitle')}
        message={t('admin.certificates.dialogs.deleteManyMessage', { count: bulkConfirm.ids.length })}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        recordId={historyItem?.id}
        service={CertificateService}
        title={getLocalizedField(historyItem?.name, language)}
        canRestore={canEdit}
        showToast={showToast}
      />
    </div>
  );
};

export default CertificatesTab;
