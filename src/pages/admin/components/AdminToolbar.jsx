import React from 'react';
import { Plus, Search, Sparkles } from 'lucide-react';
import { Button, Input } from '../../../shared/components/ui';

const AdminToolbar = ({
  onAdd,
  searchQuery,
  onSearchChange,
  isSearching = false,
  canCreate = true,
  stats = [],
  addLabel = 'Add',
  searchPlaceholder = 'Search...'
}) => {
  return (
    <section className="ui-blog-workspace">
      <div className="ui-blog-workspace__overview">
        <div className="ui-blog-workspace__intro">
          <span className="ui-blog-workspace__eyebrow">
            <Sparkles size={14} />
          </span>
          <div className="ui-blog-workspace__copy" />
        </div>

        {stats.length > 0 && (
          <div className="ui-blog-workspace__stats">
            {stats.map(({ label, value, hint, icon: Icon }) => (
              <div key={label} className="ui-blog-workspace__stat">
                <div className="ui-blog-workspace__statIcon">
                  {Icon && <Icon size={16} />}
                </div>
                <div className="ui-blog-workspace__statBody">
                  <span className="ui-blog-workspace__statValue">{value}</span>
                  <span className="ui-blog-workspace__statLabel">{label}</span>
                  {hint && <span className="ui-blog-workspace__statHint">{hint}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ui-blog-toolbar admin-toolbar">
        <div className="admin-search-wrapper ui-blog-toolbar__search">
          {isSearching ? <div className="admin-search-spinner" /> : <Search size={18} />}
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {canCreate && (
          <div className="ui-blog-toolbar__actions">
            <Button onClick={onAdd} className="ui-blog-toolbar__create">
              <Plus size={18} /> {addLabel}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminToolbar;
