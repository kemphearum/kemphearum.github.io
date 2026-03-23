import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useActivity } from '../../../hooks/useActivity';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import ExperienceService from '../../../services/ExperienceService';
import ExperienceToolbar from './components/ExperienceToolbar';
import ExperienceTable from './components/ExperienceTable';
import ExperienceFormDialog from './components/ExperienceFormDialog';
import DeleteConfirmDialog from '../../../shared/components/dialog/DeleteConfirmDialog';
import { Button } from '../../../shared/components/ui';
import { useCursorPagination } from '../../../hooks/useCursorPagination';
import styles from './ExperienceTab.module.scss';

const ExperienceTab = ({ userRole, showToast, isActionAllowed }) => {
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cursor pagination hook
  const pagination = useCursorPagination(10, [searchQuery]);

  const { loading: formLoading, execute: executeForm } = useAsyncAction({
    showToast,
    successMessage: `Experience ${editingItem ? 'updated' : 'created'} successfully.`,
    invalidateKeys: [['experience']],
    onSuccess: () => setIsFormOpen(false)
  });

  const { loading: deleteLoading, execute: executeDelete } = useAsyncAction({
    showToast,
    successMessage: 'Experience deleted successfully.',
    invalidateKeys: [['experience']],
    onSuccess: () => setDeletingItem(null)
  });
  const { trackRead, trackWrite, trackDelete } = useActivity();

  // Fetch data
  const { data: experiencesResult = { data: [], lastDoc: null, hasMore: false }, isLoading } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    queryKey: ['experience', searchQuery, pagination.cursor],
    queryFn: async () => {
      const result = await ExperienceService.fetchPaginated({
        lastDoc: pagination.cursor,
        limit: 10,
        search: searchQuery,
        searchField: 'company', // Firestore prefix search on company
        sortBy: "createdAt",
        sortDirection: "desc",
        trackRead
      });
      pagination.updateAfterFetch(result.lastDoc, result.hasMore);
      return result;
    }
  });

  const experiences = experiencesResult.data;

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

    // Handle ranges
    if (dateVal.includes(' — ') || dateVal.includes(' - ')) {
        const rangeParts = dateVal.split(/[—\-]/).map(p => p.trim());
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
      return showToast("You do not have permission to perform this action.", "error");
    }
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleSearch = (val) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handleEdit = (exp) => {
    if (!isActionAllowed('edit', 'experience')) {
      return showToast("You do not have permission to perform this action.", "error");
    }
    const startVal = exp.startMonthYear || exp.startDate || exp.period;
    const endVal = exp.endMonthYear || exp.endDate || exp.period;
    const isCurrentlyPresent = exp.current || (typeof endVal === 'string' && endVal.toLowerCase().includes('present'));

    setEditingItem({
      ...exp,
      startDate: parseLegacyDate(startVal, false),
      endDate: isCurrentlyPresent ? '' : parseLegacyDate(endVal, true),
      isPresent: !!isCurrentlyPresent
    });
    setIsFormOpen(true);
  };

  const handleDelete = (item) => {
    if (!isActionAllowed('delete', 'experience')) {
      return showToast("You do not have permission to perform this action.", "error");
    }
    setDeletingItem(item);
  };

  const handleSave = async (formData) => {
    if (!isActionAllowed(editingItem ? 'edit' : 'create', 'experience')) {
      return showToast("You do not have permission to perform this action.", "error");
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
          entityName: `${formData.role} at ${formData.company}`
        })
      );
    });
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    if (!isActionAllowed('delete', 'experience')) {
      return showToast("You do not have permission to perform this action.", "error");
    }

    await executeDelete(async () => {
      await ExperienceService.deleteExperience(userRole, deletingItem.id, (count, label) => 
        trackDelete(count, label, {
          action: 'deleted',
          module: 'experience',
          entityId: deletingItem.id,
          entityName: `${deletingItem.role} at ${deletingItem.company}`
        })
      );
    });
  };


  return (
    <div className={styles.container}>
      <ExperienceToolbar 
        onAdd={handleAdd}
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        canCreate={canCreate}
      />
      
      <div className={styles.tableSection}>
        <ExperienceTable
          experiences={experiences}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canEdit={canEdit}
          canDelete={canDelete}
          loading={isLoading}
          page={pagination.page}
          hasMore={pagination.hasMore}
          isFirstPage={pagination.isFirstPage}
          onNext={() => pagination.fetchNext(experiencesResult.lastDoc)}
          onPrevious={pagination.fetchPrevious}
        />
      </div>

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
        title="Delete Experience"
        message={`Are you sure you want to delete "${deletingItem?.role}" at "${deletingItem?.company}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default ExperienceTab;
