import React from 'react';
import { useTranslation } from '../../../../hooks/useTranslation';
import AdminToolbar from '../../components/AdminToolbar';

const EducationToolbar = ({
  onAdd,
  searchQuery,
  onSearchChange,
  isSearching = false,
  canCreate = true,
  stats = []
}) => {
  const { t } = useTranslation();

  return (
    <AdminToolbar
      eyebrow={t('admin.education.workspace.eyebrow')}
      title={t('admin.education.workspace.title')}
      description={t('admin.education.workspace.description')}
      stats={stats}
      searchPlaceholder={t('admin.education.workspace.searchPlaceholder')}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      isSearching={isSearching}
      canCreate={canCreate}
      onAdd={onAdd}
      addLabel={t('admin.education.workspace.addNew')}
      footer={
        <>
          <span>{t('admin.education.workspace.timelineHint')}</span>
          <span>{t('admin.education.workspace.presentHint')}</span>
        </>
      }
    />
  );
};

export default EducationToolbar;
