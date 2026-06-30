import React, { useRef } from 'react';
import { Upload, Download, FileText } from 'lucide-react';
import { Button } from '../../../../shared/components/ui';
import { useTranslation } from '../../../../hooks/useTranslation';
import AdminToolbar from '../../components/AdminToolbar';

const ProjectsToolbar = ({
  onAdd,
  searchQuery,
  onSearchChange,
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
      eyebrow={t('admin.projects.workspace.eyebrow')}
      title={t('admin.projects.workspace.title')}
      description={t('admin.projects.workspace.description')}
      stats={stats}
      searchPlaceholder={t('admin.projects.workspace.searchPlaceholder')}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      isSearching={isSearching}
      canCreate={canCreate}
      onAdd={onAdd}
      addLabel={t('admin.projects.workspace.addNew')}
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
              <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} title={t('admin.projects.toolbar.importTitle')}>
                <Upload size={16} /> {t('admin.projects.toolbar.import')}
              </Button>
              <Button variant="ghost" size="sm" onClick={onExportSelected} disabled={selectedCount === 0} title={t('admin.projects.toolbar.exportTitle')}>
                <Download size={16} /> {t('admin.projects.toolbar.export')} {selectedCount > 0 ? `(${selectedCount})` : ''}
              </Button>
            </div>

            <div className="ui-admin-toolbar__actionGroup">
              <Button variant="ghost" size="sm" onClick={onDownloadTemplateCSV} title={t('admin.projects.toolbar.csvTemplateTitle')}>
                <FileText size={16} /> {t('admin.projects.toolbar.csvTemplate')}
              </Button>
              <Button variant="ghost" size="sm" onClick={onDownloadTemplateJSON} title={t('admin.projects.toolbar.jsonTemplateTitle')}>
                <FileText size={16} /> {t('admin.projects.toolbar.jsonTemplate')}
              </Button>
            </div>
          </>
        )
      }
    />
  );
};

export default ProjectsToolbar;
