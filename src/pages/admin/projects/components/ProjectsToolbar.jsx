import React, { useRef } from 'react';
import { Plus, Search, Upload, Download, FileText, Sparkles } from 'lucide-react';
import { Button, Input } from '../../../../shared/components/ui';
import { useTranslation } from '../../../../hooks/useTranslation';

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
  const { language } = useTranslation();
  const tr = (enText, kmText) => (language === 'km' ? kmText : enText);

  return (
    <section className="ui-blog-workspace">
      <div className="ui-blog-workspace__overview">
        <div className="ui-blog-workspace__intro">
          <span className="ui-blog-workspace__eyebrow">
            <Sparkles size={14} />
            {tr('Project workspace', 'ផ្ទៃការងារគម្រោង')}
          </span>
          <div className="ui-blog-workspace__copy">
            <h2>{tr('Organize featured work, links, and imports from one portfolio surface.', 'រៀបចំការងារពិសេស តំណ និងការនាំចូលពីផ្ទៃ portfolio តែមួយ។')}</h2>
            <p>{tr('Search the catalog quickly, keep demos and repositories current, and launch new case studies without losing context.', 'ស្វែងរកកាតាឡុកបានរហ័ស រក្សា demo និង repository ឲ្យទាន់សម័យ ហើយបង្កើត case study ថ្មីដោយមិនបាត់បង់បរិបទ។')}</p>
          </div>
        </div>

        <div className="ui-blog-workspace__stats" aria-label={tr('Project workspace summary', 'សង្ខេបផ្ទៃការងារគម្រោង')}>
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
            placeholder={tr('Search projects by title or stack...', 'ស្វែងរកគម្រោងតាមចំណងជើង ឬ tech stack...')}
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
                <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} title={tr('Import JSON or CSV', 'នាំចូល JSON ឬ CSV')}>
                  <Upload size={16} /> {tr('Import', 'នាំចូល')}
                </Button>
                <Button variant="ghost" size="sm" onClick={onExportSelected} disabled={selectedCount === 0} title={tr('Export selected projects as JSON', 'នាំចេញគម្រោងដែលបានជ្រើសជា JSON')}>
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
            <Button onClick={onAdd} className="ui-blog-toolbar__create">
              <Plus size={18} /> {tr('Add New Project', 'បន្ថែមគម្រោងថ្មី')}
            </Button>
          )}
        </div>
      </div>

      <div className="ui-blog-toolbar__foot">
        <span>{tr('Import accepts `CSV` or `JSON` and updates existing entries when the slug already exists.', 'ការនាំចូលទទួល `CSV` ឬ `JSON` ហើយធ្វើបច្ចុប្បន្នភាពទិន្នន័យដែលមាន slug ដូចគ្នា។')}</span>
        <span>{tr('JSON export uses your current selection; the table toolbar still exports the visible page as CSV.', 'JSON export ប្រើការជ្រើសបច្ចុប្បន្ន; toolbar តារាងនៅតែអាចនាំចេញទំព័រដែលមើលឃើញជា CSV។')}</span>
      </div>
    </section>
  );
};

export default ProjectsToolbar;
