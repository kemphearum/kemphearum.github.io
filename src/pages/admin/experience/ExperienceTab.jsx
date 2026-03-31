import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useActivity } from '../../../hooks/useActivity';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import { useDebounce } from '../../../hooks/useDebounce';
import ExperienceService from '../../../services/ExperienceService';
import BaseService from '../../../services/BaseService';
import ExperienceToolbar from './components/ExperienceToolbar';
import ExperienceTable from './components/ExperienceTable';
import ExperienceFormDialog from './components/ExperienceFormDialog';
import DeleteConfirmDialog from '../../../shared/components/dialog/DeleteConfirmDialog';
import { BriefcaseBusiness, Eye, Building2, Clock3 } from 'lucide-react';
import { useCursorPagination } from '../../../hooks/useCursorPagination';
import { useTranslation } from '../../../hooks/useTranslation';
import { getLocalizedField } from '../../../utils/localization';

const normalizeTimelineMonth = (value, isEnd = false) => {
  if (!value) return '';

  let date = null;
  if (typeof value === 'object') {
    if (value?.seconds) date = new Date(value.seconds * 1000);
    else if (typeof value?.toDate === 'function') date = value.toDate();
    else if (value instanceof Date) date = value;
  }

  if (date && !Number.isNaN(date.getTime())) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  if (typeof value !== 'string') return '';

  const raw = value.trim();
  const lower = raw.toLowerCase();
  if (isEnd && lower === 'present') return '';

  const rangeMatch = raw.split(/\s*(?:-|\u2013|\u2014)\s*/).map((part) => part.trim()).filter(Boolean);
  if (rangeMatch.length > 1) {
    const selected = isEnd ? rangeMatch[rangeMatch.length - 1] : rangeMatch[0];
    if (isEnd && selected.toLowerCase() === 'present') return '';
    return normalizeTimelineMonth(selected, isEnd);
  }

  const yyyyMm = raw.match(/^(\d{4})-(\d{2})/);
  if (yyyyMm) return yyyyMm[0];

  const nativeDate = new Date(raw);
  if (!Number.isNaN(nativeDate.getTime())) {
    return `${nativeDate.getFullYear()}-${String(nativeDate.getMonth() + 1).padStart(2, '0')}`;
  }

  return '';
};

const timelineValue = (value, fallback = 0) => {
  const normalized = normalizeTimelineMonth(value);
  if (!normalized) return fallback;
  const [year, month] = normalized.split('-').map(Number);
  return (year * 12) + month;
};

const isCurrentRole = (item) => {
  if (item.current === true) return true;
  const rawEnd = `${item.endMonthYear || item.endDate || item.period || ''}`.toLowerCase();
  return rawEnd.includes('present');
};

const ExperienceTab = ({ userRole, showToast, isActionAllowed }) => {
  const { language, t } = useTranslation();
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  
  // Cursor pagination hook
  const pagination = useCursorPagination(5, [debouncedSearch]);
  const queryClient = useQueryClient();

  const { loading: formLoading, execute: executeForm } = useAsyncAction({
    showToast,
    successMessage: editingItem ? t('admin.experience.messages.updated') : t('admin.experience.messages.created'),
    invalidateKeys: [['experience']],
    onSuccess: () => setIsFormOpen(false)
  });

  const { loading: deleteLoading, execute: executeDelete } = useAsyncAction({
    showToast,
    successMessage: t('admin.experience.messages.deleted'),
    invalidateKeys: [['experience']],
    onSuccess: () => setDeletingItem(null)
  });
  const { trackRead, trackWrite, trackDelete } = useActivity();

  // Fetch data
  const { data: experiencesResult = { data: [], lastDoc: null, hasMore: false, totalCount: null }, isLoading } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    queryKey: ['experience', debouncedSearch, pagination.cursor, pagination.limit],
    queryFn: async () => {
      const requestCursor = pagination.cursor;
      const result = await BaseService.safe(() => ExperienceService.fetchPaginated({
        lastDoc: requestCursor,
        limit: pagination.limit || 10,
        search: debouncedSearch,
        searchField: 'company.en',
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

  const { data: experienceStats = { total: 0, visible: 0, companies: 0, currentRoles: 0 } } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    queryKey: ['experience', 'stats', language],
    queryFn: async () => {
      const result = await BaseService.safe(() => ExperienceService.fetchStats(language));
      if (result.error) {
        showToast(result.error, 'error');
        return { total: 0, visible: 0, companies: 0, currentRoles: 0 };
      }
      return result.data;
    }
  });

  const experiences = experiencesResult.data;
  const isSearching = searchQuery !== debouncedSearch;

  const experiencesByTimeline = useMemo(() => {
    return [...experiences].sort((a, b) => {
      const currentDiff = Number(isCurrentRole(b)) - Number(isCurrentRole(a));
      if (currentDiff !== 0) return currentDiff;

      const startDiff = timelineValue(b.startMonthYear || b.startDate || b.period) - timelineValue(a.startMonthYear || a.startDate || a.period);
      if (startDiff !== 0) return startDiff;

      const endA = isCurrentRole(a) ? Number.MAX_SAFE_INTEGER : timelineValue(a.endMonthYear || a.endDate || a.period, -1);
      const endB = isCurrentRole(b) ? Number.MAX_SAFE_INTEGER : timelineValue(b.endMonthYear || b.endDate || b.period, -1);
      const endDiff = endB - endA;
      if (endDiff !== 0) return endDiff;

      const createdA = a.createdAt?.seconds || 0;
      const createdB = b.createdAt?.seconds || 0;
      return createdB - createdA;
    });
  }, [experiences]);

  const tableExperiences = useMemo(() => experiencesByTimeline.map((item) => ({
    ...item,
    __raw: item,
    company: getLocalizedField(item.company, language),
    role: getLocalizedField(item.role, language),
    description: getLocalizedField(item.description, language)
  })), [experiencesByTimeline, language]);

  const workspaceStats = useMemo(() => {
    return [
      {
        label: t('admin.experience.stats.total.label'),
        value: experienceStats.total,
        hint: t('admin.experience.stats.total.hint'),
        icon: BriefcaseBusiness
      },
      {
        label: t('admin.experience.stats.visible.label'),
        value: experienceStats.visible,
        hint: t('admin.experience.stats.visible.hint'),
        icon: Eye
      },
      {
        label: t('admin.experience.stats.companies.label'),
        value: experienceStats.companies,
        hint: t('admin.experience.stats.companies.hint'),
        icon: Building2
      },
      {
        label: t('admin.experience.stats.currentRoles.label'),
        value: experienceStats.currentRoles,
        hint: t('admin.experience.stats.currentRoles.hint'),
        icon: Clock3
      }
    ];
  }, [experienceStats, t]);

  // Robust date parser for legacy formats (yyyy-mm)
  const parseLegacyDate = (dateVal, isEnd = false) => {
    if (!dateVal) return '';

    // Handle Native Object Types
    let d = null;
    if (typeof dateVal === 'object') {
        if (dateVal.seconds) d = new Date(dateVal.seconds * 1000);
        else if (dateVal instanceof Date) d = dateVal;
        else if (typeof dateVal.toDate === 'function') d = dateVal.toDate();
    }
    if (d && !isNaN(d.getTime())) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    if (typeof dateVal !== 'string') return '';

    // Handle ranges using hyphen, en dash, or em dash delimiters.
    const rangeSeparatorPattern = /\s*(?:-|\u2013|\u2014)\s*/;
    if (rangeSeparatorPattern.test(dateVal)) {
        const rangeParts = dateVal.split(rangeSeparatorPattern).map(p => p.trim()).filter(Boolean);
        dateVal = isEnd ? rangeParts[rangeParts.length - 1] : rangeParts[0];
        if (isEnd && dateVal.toLowerCase() === 'present') return '';
    }

    const yyyyMm = dateVal.match(/^(\d{4})-(\d{2})/);
    if (yyyyMm) return yyyyMm[0];

    const nativeDate = new Date(dateVal);
    if (!isNaN(nativeDate.getTime())) {
        return `${nativeDate.getFullYear()}-${String(nativeDate.getMonth() + 1).padStart(2, '0')}`;
    }

    return '';
  };

  // Permission Booleans
  const canCreate = isActionAllowed('create', 'experience');
  const canEdit = isActionAllowed('edit', 'experience');
  const canDelete = isActionAllowed('delete', 'experience');

  const handleAdd = () => {
    if (!canCreate) {
      return showToast(t('admin.common.noPermissionAction'), "error");
    }
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleSearch = (val) => {
    setSearchQuery(val);
    pagination.reset();
  };

  const handleEdit = (exp) => {
    if (!isActionAllowed('edit', 'experience')) {
      return showToast(t('admin.common.noPermissionAction'), "error");
    }
    const source = exp.__raw || exp;
    const startVal = source.startMonthYear || source.startDate || source.period;
    const endVal = source.endMonthYear || source.endDate || source.period;
    const isCurrentlyPresent = source.current || (typeof endVal === 'string' && endVal.toLowerCase().includes('present'));

    setEditingItem({
      ...source,
      startDate: parseLegacyDate(startVal, false),
      endDate: isCurrentlyPresent ? '' : parseLegacyDate(endVal, true),
      isPresent: !!isCurrentlyPresent
    });
    setIsFormOpen(true);
  };

  const handleDelete = (item) => {
    if (!isActionAllowed('delete', 'experience')) {
      return showToast(t('admin.common.noPermissionAction'), "error");
    }
    setDeletingItem(item.__raw || item);
  };

  const handleSave = async (formData) => {
    if (!isActionAllowed(editingItem ? 'edit' : 'create', 'experience')) {
      return showToast(t('admin.common.noPermissionAction'), "error");
    }
    
    await executeForm(async () => {
      const action = editingItem ? 'updated' : 'created';
      const dataToSave = {
        ...formData,
        startMonthYear: formData.startDate,
        endMonthYear: formData.endDate,
        current: formData.isPresent,
        id: editingItem?.id || null
      };

      await ExperienceService.saveExperience(userRole, dataToSave, (count, label) => 
        trackWrite(count, label, {
          action,
          module: 'experience',
          entityId: editingItem?.id || 'new',
          entityName: `${formData.roleEn} at ${formData.companyEn}`
        })
      );
    });
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    if (!isActionAllowed('delete', 'experience')) {
      return showToast(t('admin.common.noPermissionAction'), "error");
    }

    await executeDelete(async () => {
      await ExperienceService.deleteExperience(userRole, deletingItem.id, (count, label) => 
        trackDelete(count, label, {
          action: 'deleted',
          module: 'experience',
          entityId: deletingItem.id,
          entityName: `${getLocalizedField(deletingItem.role, 'en')} at ${getLocalizedField(deletingItem.company, 'en')}`
        })
      );
    });
  };

  // Mutations with Optimistic Updates
  const visibilityMutation = useMutation({
    mutationFn: ({ id, currentVisible }) => 
      ExperienceService.toggleVisibility(userRole, id, currentVisible, trackWrite),
    onMutate: async ({ id, currentVisible }) => {
      await queryClient.cancelQueries({ queryKey: ['experience'] });
      const previousExperience = queryClient.getQueryData(['experience', debouncedSearch, pagination.cursor]);
      
      if (previousExperience) {
        queryClient.setQueryData(['experience', searchQuery, pagination.cursor], {
          ...previousExperience,
          data: previousExperience.data.map(exp => 
            exp.id === id ? { ...exp, visible: !currentVisible } : exp
          )
        });
      }
      return { previousExperience };
    },
    onError: (err, variables, context) => {
      if (context?.previousExperience) {
        queryClient.setQueryData(['experience', debouncedSearch, pagination.cursor], context.previousExperience);
      }
      showToast(err?.message || 'Failed to update visibility', 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['experience'] });
    },
    onSuccess: (_, variables) => {
      showToast(
        !variables.currentVisible
          ? t('admin.experience.messages.shownOnHomepage')
          : t('admin.experience.messages.hiddenOnHomepage')
      );
    }
  });

  const toggleVisibility = (id, currentVisible) => {
    if (!isActionAllowed('edit', 'experience')) {
      return showToast(t('admin.common.noPermissionAction'), "error");
    }
    visibilityMutation.mutate({ id, currentVisible });
  };


  return (
    <div className={'admin-tab-container'}>
      <ExperienceToolbar 
        onAdd={handleAdd}
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        isSearching={isSearching}
        canCreate={canCreate}
        stats={workspaceStats}
      />
      
      <ExperienceTable
        experiences={tableExperiences}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleVisibility={toggleVisibility}
        onCreate={handleAdd}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        loading={isLoading}
        page={pagination.page}
        pageSize={pagination.limit}
        totalItems={experiencesResult.totalCount}
        hasMore={experiencesResult.hasMore}
        isFirstPage={pagination.isFirstPage}
        onNext={() => pagination.fetchNext(experiencesResult.lastDoc)}
        onPrevious={pagination.fetchPrevious}
        onPageChange={(page, size) => {
          if (size !== pagination.limit) {
            pagination.handlePageSizeChange(size);
          }
        }}
      />

      <ExperienceFormDialog 
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
        title={t('admin.experience.dialogs.deleteTitle')}
        message={t('admin.experience.dialogs.deleteMessage', {
          role: getLocalizedField(deletingItem?.role, language),
          company: getLocalizedField(deletingItem?.company, language)
        })}
      />
    </div>
  );
};

export default ExperienceTab;
