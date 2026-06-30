import React from 'react';
import { useTranslation } from '../../../../hooks/useTranslation';
import AdminToolbar from '../../components/AdminToolbar';

const CertificatesToolbar = ({
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
      eyebrow={t('admin.certificates.workspace.eyebrow')}
      title={t('admin.certificates.workspace.title')}
      description={t('admin.certificates.workspace.description')}
      stats={stats}
      searchPlaceholder={t('admin.certificates.workspace.searchPlaceholder')}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      isSearching={isSearching}
      canCreate={canCreate}
      onAdd={onAdd}
      addLabel={t('admin.certificates.workspace.addNew')}
    />
  );
};

export default CertificatesToolbar;
