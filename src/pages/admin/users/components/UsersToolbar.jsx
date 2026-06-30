import React from 'react';
import { useTranslation } from '../../../../hooks/useTranslation';
import AdminToolbar from '../../components/AdminToolbar';

const UsersToolbar = ({ search, onSearch, onCreate, isSearching = false, canCreate = true, searchResultCount, totalCount, stats = [] }) => {
  const { t } = useTranslation();

  return (
    <AdminToolbar
      eyebrow={t('ui.userWorkspace')}
      title={t('ui.manageAccessAndAccountRol')}
      description={t('ui.searchByEmailOrRoleInspec')}
      stats={stats}
      searchPlaceholder={t('ui.searchUsers')}
      searchQuery={search}
      onSearchChange={onSearch}
      isSearching={isSearching}
      canCreate={canCreate}
      onAdd={onCreate}
      addLabel={t('ui.inviteUser')}
      searchResultCount={searchResultCount}
      totalCount={totalCount}
    />
  );
};

export default UsersToolbar;
