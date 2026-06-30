import React, { useRef } from 'react';
import { Upload, Download, FileText } from 'lucide-react';
import { Button } from '../../../../shared/components/ui';
import { useTranslation } from '../../../../hooks/useTranslation';
import AdminToolbar from '../../components/AdminToolbar';

const BlogToolbar = ({
  onCreate,
  onSearch,
  searchQuery = '',
  isSearching = false,
  canCreate = true,
  canBulkManage = true,
  selectedCount = 0,
  stats = [],
  onImportFile,
  onExportSelected,
  onDownloadTemplateCSV,
  onDownloadTemplateJSON
}) => {
  const fileInputRef = useRef(null);
  const { t } = useTranslation();

  return (
    <AdminToolbar
      eyebrow={t('admin.blog.toolbar.eyebrow')}
      title={t('admin.blog.toolbar.title')}
      description={t('admin.blog.toolbar.description')}
      stats={stats}
      searchPlaceholder={t('admin.blog.toolbar.searchPlaceholder')}
      searchQuery={searchQuery}
      onSearchChange={onSearch}
      isSearching={isSearching}
      canCreate={canCreate}
      onAdd={onCreate}
      addLabel={t('admin.blog.toolbar.addNewPost')}
      actions={
        canBulkManage && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && onImportFile) onImportFile(file);
                e.target.value = null;
              }}
            />
            <div className="ui-admin-toolbar__actionGroup">
              <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} title={t('admin.blog.toolbar.importTitle')}>
                <Upload size={16} /> {t('admin.blog.toolbar.import')}
              </Button>
              <Button variant="ghost" size="sm" onClick={onExportSelected} disabled={selectedCount === 0} title={t('admin.blog.toolbar.exportTitle')}>
                <Download size={16} /> {t('admin.blog.toolbar.export')} {selectedCount > 0 ? `(${selectedCount})` : ''}
              </Button>
            </div>

            <div className="ui-admin-toolbar__actionGroup">
              <Button variant="ghost" size="sm" onClick={onDownloadTemplateCSV} title={t('admin.blog.toolbar.csvTemplateTitle')}>
                <FileText size={16} /> {t('admin.blog.toolbar.csvTemplate')}
              </Button>
              <Button variant="ghost" size="sm" onClick={onDownloadTemplateJSON} title={t('admin.blog.toolbar.jsonTemplateTitle')}>
                <FileText size={16} /> {t('admin.blog.toolbar.jsonTemplate')}
              </Button>
            </div>
          </>
        )
      }
      footer={
        <>
          <span>{t('admin.blog.toolbar.footNote1')}</span>
          <span>{t('admin.blog.toolbar.footNote2')}</span>
        </>
      }
    />
  );
};

export default BlogToolbar;
