import React from 'react';
import { useTranslation } from '../../../../hooks/useTranslation';
import AdminToolbar from '../../components/AdminToolbar';

const SkillsToolbar = ({
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
      eyebrow={t('admin.skills.workspace.eyebrow')}
      title={t('admin.skills.workspace.title')}
      description={t('admin.skills.workspace.description')}
      stats={stats}
      searchPlaceholder={t('admin.skills.workspace.searchPlaceholder')}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      isSearching={isSearching}
      canCreate={canCreate}
      onAdd={onAdd}
      addLabel={t('admin.skills.workspace.addNew')}
    />
  );
};

export default SkillsToolbar;
