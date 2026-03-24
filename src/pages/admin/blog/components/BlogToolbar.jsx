import React, { useRef } from 'react';
import { Plus, Search, Upload, Download, FileText, Sparkles } from 'lucide-react';
import { Button, Input } from '../../../../shared/components/ui';
import { useTranslation } from '../../../../hooks/useTranslation';

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
  const { language } = useTranslation();
  const tr = (enText, kmText) => (language === 'km' ? kmText : enText);

  return (
    <section className="ui-blog-workspace">
      <div className="ui-blog-workspace__overview">
        <div className="ui-blog-workspace__intro">
          <span className="ui-blog-workspace__eyebrow">
            <Sparkles size={14} />
            {tr('Editorial workspace', 'ផ្ទៃការងារកែសម្រួល')}
          </span>
          <div className="ui-blog-workspace__copy">
            <h2>{tr('Keep publishing, imports, and post cleanup in one place.', 'រក្សាការបោះពុម្ព ការនាំចូល និងសម្អាតអត្ថបទនៅកន្លែងតែមួយ។')}</h2>
            <p>{tr('Search the collection, start a new draft quickly, and use templates or bulk actions without hunting through the table.', 'ស្វែងរកក្នុងបណ្ណសារ ចាប់ផ្តើមសេចក្តីព្រាងថ្មីបានរហ័ស ហើយប្រើ template ឬសកម្មភាពជាក្រុមដោយមិនចាំបាច់រករយៈពេលយូរ។')}</p>
          </div>
        </div>

        <div className="ui-blog-workspace__stats" aria-label={tr('Blog workspace summary', 'សង្ខេបផ្ទៃការងារប្លុក')}>
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
            placeholder={tr('Search by title...', 'ស្វែងរកតាមចំណងជើង...')}
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
                <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} title={tr('Import JSON or CSV', 'នាំចូល JSON ឬ CSV')}>
                  <Upload size={16} /> {tr('Import', 'នាំចូល')}
                </Button>
                <Button variant="ghost" size="sm" onClick={onExportSelected} disabled={selectedCount === 0} title={tr('Export selected posts as JSON', 'នាំចេញអត្ថបទដែលបានជ្រើសជា JSON')}>
                  <Download size={16} /> {tr('Export', 'នាំចេញ')} {selectedCount > 0 ? `(${selectedCount})` : ''}
                </Button>
              </div>

              <div className="ui-blog-toolbar__actionGroup">
                <Button variant="ghost" size="sm" onClick={onDownloadTemplateCSV} title={tr('Download CSV template', 'ទាញយកគំរូ CSV')}>
                  <FileText size={16} /> {tr('CSV Template', 'គំរូ CSV')}
                </Button>
                <Button variant="ghost" size="sm" onClick={onDownloadTemplateJSON} title={tr('Download JSON template', 'ទាញយកគំរូ JSON')}>
                  <FileText size={16} /> {tr('JSON Template', 'គំរូ JSON')}
                </Button>
              </div>
            </>
          )}

          {canCreate && (
            <Button onClick={onCreate} className="ui-blog-toolbar__create">
              <Plus size={18} /> {tr('Add New Post', 'បន្ថែមអត្ថបទថ្មី')}
            </Button>
          )}
        </div>
      </div>

      <div className="ui-blog-toolbar__foot">
        <span>{tr('Import accepts `CSV` or `JSON` and matches existing entries by slug.', 'ការនាំចូលទទួល `CSV` ឬ `JSON` ហើយផ្គូផ្គងទិន្នន័យដែលមានរួចតាម slug។')}</span>
        <span>{tr('JSON export uses the selected posts; table export downloads the current page as CSV.', 'JSON export ប្រើអត្ថបទដែលបានជ្រើស; table export ទាញយកទំព័របច្ចុប្បន្នជា CSV។')}</span>
      </div>
    </section>
  );
};

export default BlogToolbar;
