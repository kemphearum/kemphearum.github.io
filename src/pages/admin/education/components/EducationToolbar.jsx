import React from 'react';
import { Plus, Search, Sparkles } from 'lucide-react';
import { Button, Input } from '../../../../shared/components/ui';
import { useTranslation } from '../../../../hooks/useTranslation';

const EducationToolbar = ({
  onAdd,
  searchQuery,
  onSearchChange,
  isSearching = false,
  canCreate = true,
  stats = []
}) => {
  const { t } = useTranslation();

  return (
    <section className="ui-blog-workspace">
      <div className="ui-blog-workspace__overview">
        <div className="ui-blog-workspace__intro">
          <span className="ui-blog-workspace__eyebrow">
            <Sparkles size={14} />
            {t('admin.education.workspace.eyebrow')}
          </span>
          <div className="ui-blog-workspace__copy">
            <h2>{t('admin.education.workspace.title')}</h2>
            <p>{t('admin.education.workspace.description')}</p>
          </div>
        </div>

        <div className="ui-blog-workspace__stats" aria-label={t('admin.education.workspace.summaryAria')}>
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
          {isSearching ? <div className="admin-search-spinner" /> : <Search size={18} />}
          <Input
            placeholder={t('admin.education.workspace.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {canCreate && (
          <div className="ui-blog-toolbar__actions">
            <Button onClick={onAdd} className="ui-blog-toolbar__create">
              <Plus size={18} /> {t('admin.education.workspace.addNew')}
            </Button>
          </div>
        )}
      </div>

      <div className="ui-blog-toolbar__foot">
        <span>{t('admin.education.workspace.timelineHint')}</span>
        <span>{t('admin.education.workspace.presentHint')}</span>
      </div>
    </section>
  );
};

export default EducationToolbar;
