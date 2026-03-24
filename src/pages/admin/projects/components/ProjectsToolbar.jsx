import React, { useRef } from 'react';
import { Plus, Search, Upload, Download, FileText, Sparkles } from 'lucide-react';
import { Button, Input } from '../../../../shared/components/ui';

const ProjectsToolbar = ({
  onAdd,
  searchQuery,
  onSearchChange,
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

  return (
    <section className="ui-blog-workspace">
      <div className="ui-blog-workspace__overview">
        <div className="ui-blog-workspace__intro">
          <span className="ui-blog-workspace__eyebrow">
            <Sparkles size={14} />
            Project workspace
          </span>
          <div className="ui-blog-workspace__copy">
            <h2>Organize featured work, links, and imports from one portfolio surface.</h2>
            <p>Search the catalog quickly, keep demos and repositories current, and launch new case studies without losing context.</p>
          </div>
        </div>

        <div className="ui-blog-workspace__stats" aria-label="Project workspace summary">
          {stats.map(({ label, value, hint, icon: Icon }) => (
            <div key={label} className="ui-blog-workspace__stat">
              <div className="ui-blog-workspace__statIcon">
                {Icon && <Icon size={16} />}
              </div>
              <div className="ui-blog-workspace__statBody">
                <span className="ui-blog-workspace__statValue">{value}</span>
                <span className="ui-blog-workspace__statLabel">{label}</span>
                <span className="ui-blog-workspace__statHint">{hint}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ui-blog-toolbar admin-toolbar">
        <div className="admin-search-wrapper ui-blog-toolbar__search">
          <Search size={18} />
          <Input
            placeholder="Search projects by title or stack..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="ui-blog-toolbar__actions">
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
              <div className="ui-blog-toolbar__actionGroup">
                <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} title="Import JSON or CSV">
                  <Upload size={16} /> Import
                </Button>
                <Button variant="ghost" size="sm" onClick={onExportSelected} disabled={selectedCount === 0} title="Export selected projects as JSON">
                  <Download size={16} /> Export {selectedCount > 0 ? `(${selectedCount})` : ''}
                </Button>
              </div>

              <div className="ui-blog-toolbar__actionGroup">
                <Button variant="ghost" size="sm" onClick={onDownloadTemplateCSV} title="Download CSV template">
                  <FileText size={16} /> CSV Template
                </Button>
                <Button variant="ghost" size="sm" onClick={onDownloadTemplateJSON} title="Download JSON template">
                  <FileText size={16} /> JSON Template
                </Button>
              </div>
            </>
          )}
        
          {canCreate && (
            <Button onClick={onAdd} className="ui-blog-toolbar__create">
              <Plus size={18} /> Add New Project
            </Button>
          )}
        </div>
      </div>

      <div className="ui-blog-toolbar__foot">
        <span>Import accepts `CSV` or `JSON` and updates existing entries when the slug already exists.</span>
        <span>JSON export uses your current selection; the table toolbar still exports the visible page as CSV.</span>
      </div>
    </section>
  );
};

export default ProjectsToolbar;
