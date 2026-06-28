import React, { useMemo } from 'react';
import EducationService from '../../../services/EducationService';
import EducationToolbar from './components/EducationToolbar';
import EducationTable from './components/EducationTable';
import EducationFormDialog from './components/EducationFormDialog';
import DeleteConfirmDialog from '../../../shared/components/dialog/DeleteConfirmDialog';
import { GraduationCap, Eye, Building2, Clock3 } from 'lucide-react';
import { useAdminCrud } from '../hooks/useAdminCrud';
import { useTranslation } from '../../../hooks/useTranslation';
import { getLocalizedField } from '../../../utils/localization';
import { ACTIONS, MODULES } from '../../../utils/permissions';


const EducationTab = ({ userRole, showToast, isActionAllowed }) => {
  const { language, t } = useTranslation();

  const crud = useAdminCrud({
    resourceKey: 'education',
    module: MODULES.EDUCATION || 'education',
    isActionAllowed,
    showToast,
    t,
    fetchPaginated: ({ lastDoc, limit, search, trackRead }) => EducationService.fetchPaginated({
      lastDoc,
      limit,
      search,
      searchField: 'school.en',
      sortBy: 'createdAt',
      sortDirection: 'desc',
      includeTotal: true,
      trackRead
    }),
    fetchStats: (lang) => EducationService.fetchStats(lang),
    statsDefault: { total: 0, visible: 0, schools: 0 },
    statsParam: language,
    statsKeyExtra: [language],
    toggleVisibility: {
      mutationFn: (id, current, trackWrite) => EducationService.toggleVisibility(userRole, id, current, trackWrite),
      on: t('admin.education.messages.shownOnHomepage'),
      off: t('admin.education.messages.hiddenOnHomepage')
    },
    messages: {
      created: t('admin.education.messages.created'),
      updated: t('admin.education.messages.updated'),
      deleted: t('admin.education.messages.deleted')
    }
  });

  const {
    items: educations,
    listResult: educationsResult,
    stats: educationStats,
    isLoading,
    isSearching,
    searchQuery,
    handleSearch,
    pagination,
    editingItem,
    setEditingItem,
    deletingItem,
    setDeletingItem,
    isFormOpen,
    setIsFormOpen,
    ensurePermission,
    handleToggleVisibility,
    formLoading,
    deleteLoading,
    saveItem,
    executeDelete,
    trackWrite,
    trackDelete
  } = crud;

  const educationsByTimeline = useMemo(() => {
    return [...educations].sort((a, b) => {
      const startDiff = (b.startYear || 0) - (a.startYear || 0);
      if (startDiff !== 0) return startDiff;

      const createdA = a.createdAt?.seconds || 0;
      const createdB = b.createdAt?.seconds || 0;
      return createdB - createdA;
    });
  }, [educations]);

  const tableEducations = useMemo(() => educationsByTimeline.map((item) => ({
    ...item,
    __raw: item,
    school: getLocalizedField(item.school, language),
    degree: getLocalizedField(item.degree, language),
    fieldOfStudy: getLocalizedField(item.fieldOfStudy, language),
    description: getLocalizedField(item.description, language)
  })), [educationsByTimeline, language]);

  const workspaceStats = useMemo(() => {
    return [
      {
        label: t('admin.education.stats.total.label'),
        value: educationStats.total,
        hint: t('admin.education.stats.total.hint'),
        icon: GraduationCap
      },
      {
        label: t('admin.education.stats.visible.label'),
        value: educationStats.visible,
        hint: t('admin.education.stats.visible.hint'),
        icon: Eye
      },
      {
        label: t('admin.education.stats.schools.label'),
        value: educationStats.schools,
        hint: t('admin.education.stats.schools.hint'),
        icon: Building2
      }
    ];
  }, [educationStats, t]);

  // Permission Booleans
  const moduleKey = MODULES.EDUCATION || 'education';
  const canCreate = isActionAllowed(ACTIONS.CREATE, moduleKey);
  const canEdit = isActionAllowed(ACTIONS.EDIT, moduleKey);
  const canDelete = isActionAllowed(ACTIONS.DELETE, moduleKey);
  const canToggleVisibility = isActionAllowed(ACTIONS.TOGGLE_VISIBILITY, moduleKey);

  const handleAdd = () => {
    if (!ensurePermission(ACTIONS.CREATE)) return;
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (exp) => {
    if (!ensurePermission(ACTIONS.EDIT)) return;
    const source = exp.__raw || exp;
    
    setEditingItem({
      ...source,
      startYear: source.startYear || '',
      endYear: source.endYear || '',
      isPresent: !!source.current
    });
    setIsFormOpen(true);
  };

  const handleDelete = (item) => {
    if (!ensurePermission(ACTIONS.DELETE)) return;
    setDeletingItem(item.__raw || item);
  };

  const handleSave = async (formData) => {
    if (!ensurePermission(editingItem ? ACTIONS.EDIT : ACTIONS.CREATE)) return;

    await saveItem(async () => {
      const action = editingItem ? 'updated' : 'created';
      const dataToSave = {
        ...formData,
        startYear: formData.startYear,
        endYear: formData.endYear,
        current: formData.isPresent,
        id: editingItem?.id || null
      };

      await EducationService.saveEducation(userRole, dataToSave, (count, label) =>
        trackWrite(count, label, {
          action,
          module: 'education',
          entityId: editingItem?.id || 'new',
          entityName: `${formData.degreeEn} at ${formData.schoolEn}`
        })
      );
    });
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    if (!ensurePermission(ACTIONS.DELETE)) return;

    await executeDelete(async () => {
      await EducationService.deleteEducation(userRole, deletingItem.id, (count, label) =>
        trackDelete(count, label, {
          action: 'deleted',
          module: 'education',
          entityId: deletingItem.id,
          entityName: `${getLocalizedField(deletingItem.degree, 'en')} at ${getLocalizedField(deletingItem.school, 'en')}`
        })
      );
    });
  };

  return (
    <div className={'admin-tab-container'}>
      <EducationToolbar 
        onAdd={handleAdd}
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        isSearching={isSearching}
        canCreate={canCreate}
        stats={workspaceStats}
      />
      
      <EducationTable
        educations={tableEducations}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleVisibility={handleToggleVisibility}
        onCreate={handleAdd}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        canToggleVisibility={canToggleVisibility}
        loading={isLoading}
        page={pagination.page}
        pageSize={pagination.limit}
        totalItems={educationsResult.totalCount}
        hasMore={educationsResult.hasMore}
        isFirstPage={pagination.isFirstPage}
        onNext={() => pagination.fetchNext(educationsResult.lastDoc)}
        onPrevious={pagination.fetchPrevious}
        onPageChange={(page, size) => {
          if (size !== pagination.limit) {
            pagination.handlePageSizeChange(size);
          }
        }}
      />

      <EducationFormDialog 
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
        title={t('admin.education.dialogs.deleteTitle')}
        message={t('admin.education.dialogs.deleteMessage', {
          degree: getLocalizedField(deletingItem?.degree, language),
          school: getLocalizedField(deletingItem?.school, language)
        })}
      />
    </div>
  );
};

export default EducationTab;
