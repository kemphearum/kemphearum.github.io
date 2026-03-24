import React from 'react';
import { Plus, Search, Sparkles } from 'lucide-react';
import { Button, Input } from '../../../../shared/components/ui';
import { useTranslation } from '../../../../hooks/useTranslation';

const ExperienceToolbar = ({
  onAdd,
  searchQuery,
  onSearchChange,
  canCreate = true,
  stats = []
}) => {
  const { language } = useTranslation();
  const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
  return (
    <section className="ui-blog-workspace">
      <div className="ui-blog-workspace__overview">
        <div className="ui-blog-workspace__intro">
          <span className="ui-blog-workspace__eyebrow">
            <Sparkles size={14} />
            {tr('Career workspace', 'កន្លែងការងារអាជីព')}
          </span>
          <div className="ui-blog-workspace__copy">
            <h2>{tr('Keep your timeline, company history, and visibility settings easy to manage.', 'ធ្វើឱ្យការគ្រប់គ្រងពេលវេលាការងារ ប្រវត្តិក្រុមហ៊ុន និងស្ថានភាពបង្ហាញ ងាយស្រួល។')}</h2>
            <p>{tr('Search by role or company, add new experience quickly, and keep the public career story polished without digging through dense rows.', 'ស្វែងរកតាមតួនាទី ឬក្រុមហ៊ុន បន្ថែមបទពិសោធន៍បានលឿន និងរក្សាអត្ថន័យអាជីពសាធារណៈឱ្យច្បាស់លាស់។')}</p>
          </div>
        </div>

        <div className="ui-blog-workspace__stats" aria-label={tr('Experience workspace summary', 'សេចក្តីសង្ខេបកន្លែងការងារបទពិសោធន៍')}>
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
            placeholder={tr('Search experience by role or company...', 'ស្វែងរកបទពិសោធន៍តាមតួនាទី ឬក្រុមហ៊ុន...')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {canCreate && (
          <div className="ui-blog-toolbar__actions">
            <Button onClick={onAdd} className="ui-blog-toolbar__create">
              <Plus size={18} /> {tr('Add New Experience', 'បន្ថែមបទពិសោធន៍ថ្មី')}
            </Button>
          </div>
        )}
      </div>

      <div className="ui-blog-toolbar__foot">
        <span>{tr('Use precise month ranges so the public timeline stays consistent.', 'ប្រើចន្លោះខែឱ្យត្រឹមត្រូវ ដើម្បីរក្សាពេលវេលាសាធារណៈឱ្យស៊ីសង្វាក់។')}</span>
        <span>{tr('Mark current roles as present to keep sorting and timeline display clear.', 'សម្គាល់តួនាទីបច្ចុប្បន្នថា Present ដើម្បីឱ្យការរៀបចំ និងការបង្ហាញពេលវេលាច្បាស់លាស់។')}</span>
      </div>
    </section>
  );
};

export default ExperienceToolbar;
