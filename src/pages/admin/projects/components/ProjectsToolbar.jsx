import React, { useRef } from 'react';
import { Plus, Search, Upload, Download, FileText } from 'lucide-react';
import { Button, Input } from '../../../../shared/components/ui';

const ProjectsToolbar = ({
  onAdd,
  searchQuery,
  onSearchChange,
  canCreate = true,
  canBulkManage = true,
  selectedCount = 0,
  onImportFile,
  onExportSelected,
  onDownloadTemplateCSV,
  onDownloadTemplateJSON
}) => {
  const fileInputRef = useRef(null);

  return (
    <div className="admin-toolbar">
      <div className="admin-search-wrapper">
        <Search size={18} />
        <Input
          placeholder="Search projects by title or tech..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {canBulkManage && (
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
            <Button variant="ghost" onClick={() => fileInputRef.current?.click()} title="Import JSON/CSV">
              <Upload size={16} /> Import
            </Button>
            <Button variant="ghost" onClick={onExportSelected} disabled={selectedCount === 0} title="Export Selected as JSON">
              <Download size={16} /> Export ({selectedCount})
            </Button>
            <Button variant="ghost" onClick={onDownloadTemplateCSV} title="Download CSV Template">
              <FileText size={16} /> CSV Template
            </Button>
            <Button variant="ghost" onClick={onDownloadTemplateJSON} title="Download JSON Template">
              <FileText size={16} /> JSON Template
            </Button>
          </>
        )}
      
        {canCreate && (
          <Button onClick={onAdd} className="ui-primary">
            <Plus size={18} /> Add New Project
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProjectsToolbar;
