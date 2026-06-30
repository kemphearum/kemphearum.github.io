import React from 'react';
import { useTranslation } from '../../../../hooks/useTranslation';
import AdminToolbar from '../../components/AdminToolbar';

const ExperienceToolbar = ({
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
      eyebrow={t('admin.experience.workspace.eyebrow')}
      title={t('admin.experience.workspace.title')}
      description={t('admin.experience.workspace.description')}
      stats={stats}
      searchPlaceholder={t('admin.experience.workspace.searchPlaceholder')}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      isSearching={isSearching}
      canCreate={canCreate}
      onAdd={onAdd}
      addLabel={t('admin.experience.workspace.addNew')}
      footer={
        <>
          <span>{t('admin.experience.workspace.timelineHint')}</span>
          <span>{t('admin.experience.workspace.presentHint')}</span>
        </>
      }
    />
  );
};

export default ExperienceToolbar;
