import React, { useRef } from 'react';
import { Plus, Search, Upload, Download, FileText, Sparkles } from 'lucide-react';
import { Button, Input } from '../../../../shared/components/ui';

const BlogToolbar = ({
  onCreate,
  onSearch,
  searchQuery = '',
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
            Editorial workspace
          </span>
          <div className="ui-blog-workspace__copy">
            <h2>Keep publishing, imports, and post cleanup in one place.</h2>
            <p>Search the collection, start a new draft quickly, and use templates or bulk actions without hunting through the table.</p>
          </div>
        </div>

        <div className="ui-blog-workspace__stats" aria-label="Blog workspace summary">
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
          <Search size={16} />
          <Input
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
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
                <Button variant="ghost" size="sm" onClick={onExportSelected} disabled={selectedCount === 0} title="Export selected posts as JSON">
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
            <Button onClick={onCreate} className="ui-blog-toolbar__create">
              <Plus size={18} /> Add New Post
            </Button>
          )}
        </div>
      </div>

      <div className="ui-blog-toolbar__foot">
        <span>Import accepts `CSV` or `JSON` and matches existing entries by slug.</span>
        <span>JSON export uses the selected posts; table export downloads the current page as CSV.</span>
      </div>
    </section>
  );
};

export default BlogToolbar;
