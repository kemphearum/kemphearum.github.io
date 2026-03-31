import React, { useRef } from 'react';
import { Plus, Search, Upload, Download, FileText, Sparkles } from 'lucide-react';
import { Button, Input } from '../../../../shared/components/ui';
import { useTranslation } from '../../../../hooks/useTranslation';

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
    <section className="ui-blog-workspace">
      <div className="ui-blog-workspace__overview">
        <div className="ui-blog-workspace__intro">
          <span className="ui-blog-workspace__eyebrow">
            <Sparkles size={14} />
            {t('admin.blog.toolbar.eyebrow')}
          </span>
          <div className="ui-blog-workspace__copy">
            <h2>{t('admin.blog.toolbar.title')}</h2>
            <p>{t('admin.blog.toolbar.description')}</p>
          </div>
        </div>

        <div className="ui-blog-workspace__stats" aria-label={t('admin.blog.toolbar.summaryAria')}>
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
          {isSearching ? <div className="admin-search-spinner" /> : <Search size={16} />}
          <Input
            placeholder={t('admin.blog.toolbar.searchPlaceholder')}
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
                <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} title={t('admin.blog.toolbar.importTitle')}>
                  <Upload size={16} /> {t('admin.blog.toolbar.import')}
                </Button>
                <Button variant="ghost" size="sm" onClick={onExportSelected} disabled={selectedCount === 0} title={t('admin.blog.toolbar.exportTitle')}>
                  <Download size={16} /> {t('admin.blog.toolbar.export')} {selectedCount > 0 ? `(${selectedCount})` : ''}
                </Button>
              </div>

              <div className="ui-blog-toolbar__actionGroup">
                <Button variant="ghost" size="sm" onClick={onDownloadTemplateCSV} title={t('admin.blog.toolbar.csvTemplateTitle')}>
                  <FileText size={16} /> {t('admin.blog.toolbar.csvTemplate')}
                </Button>
                <Button variant="ghost" size="sm" onClick={onDownloadTemplateJSON} title={t('admin.blog.toolbar.jsonTemplateTitle')}>
                  <FileText size={16} /> {t('admin.blog.toolbar.jsonTemplate')}
                </Button>
              </div>
            </>
          )}

          {canCreate && (
            <Button onClick={onCreate} className="ui-blog-toolbar__create">
              <Plus size={18} /> {t('admin.blog.toolbar.addNewPost')}
            </Button>
          )}
        </div>
      </div>

      <div className="ui-blog-toolbar__foot">
        <span>{t('admin.blog.toolbar.footNote1')}</span>
        <span>{t('admin.blog.toolbar.footNote2')}</span>
      </div>
    </section>
  );
};

export default BlogToolbar;
