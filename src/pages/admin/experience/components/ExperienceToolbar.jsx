import React from 'react';
import { Plus, Search, Sparkles } from 'lucide-react';
import { Button, Input } from '../../../../shared/components/ui';

const ExperienceToolbar = ({
  onAdd,
  searchQuery,
  onSearchChange,
  canCreate = true,
  stats = []
}) => {
  return (
    <section className="ui-blog-workspace">
      <div className="ui-blog-workspace__overview">
        <div className="ui-blog-workspace__intro">
          <span className="ui-blog-workspace__eyebrow">
            <Sparkles size={14} />
            Career workspace
          </span>
          <div className="ui-blog-workspace__copy">
            <h2>Keep your timeline, company history, and visibility settings easy to manage.</h2>
            <p>Search by role or company, add new experience quickly, and keep the public career story polished without digging through dense rows.</p>
          </div>
        </div>

        <div className="ui-blog-workspace__stats" aria-label="Experience workspace summary">
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
            placeholder="Search experience by role or company..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {canCreate && (
          <div className="ui-blog-toolbar__actions">
            <Button onClick={onAdd} className="ui-blog-toolbar__create">
              <Plus size={18} /> Add New Experience
            </Button>
          </div>
        )}
      </div>

      <div className="ui-blog-toolbar__foot">
        <span>Use precise month ranges so the public timeline stays consistent.</span>
        <span>Mark current roles as present to keep sorting and timeline display clear.</span>
      </div>
    </section>
  );
};

export default ExperienceToolbar;
