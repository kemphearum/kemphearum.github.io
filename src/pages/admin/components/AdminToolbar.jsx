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
  searchPlaceholder = 'Search...',
  eyebrow,
  title,
  description,
  actions,
  footer
}) => {
  return (
    <section className="ui-admin-workspace">
      <div className="ui-admin-workspace__overview">
        {(eyebrow || title || description) && (
          <div className="ui-admin-workspace__intro">
            {eyebrow && (
              <span className="ui-admin-workspace__eyebrow">
                <Sparkles size={14} />
                {eyebrow}
              </span>
            )}
            <div className="ui-admin-workspace__copy">
              {title && <h2>{title}</h2>}
              {description && <p>{description}</p>}
            </div>
          </div>
        )}

        {stats.length > 0 && (
          <div className="ui-admin-workspace__stats">
            {stats.map(({ label, value, hint, icon: Icon }) => (
              <div key={label} className="ui-admin-workspace__stat">
                <div className="ui-admin-workspace__statIcon">
                  {Icon && <Icon size={16} />}
                </div>
                <div className="ui-admin-workspace__statBody">
                  <span className="ui-admin-workspace__statValue">{value}</span>
                  <span className="ui-admin-workspace__statLabel">{label}</span>
                  {hint && <span className="ui-admin-workspace__statHint">{hint}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ui-admin-toolbar admin-toolbar">
        <div className="admin-search-wrapper ui-admin-toolbar__search">
          {isSearching ? <div className="admin-search-spinner" /> : <Search size={18} />}
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="ui-admin-toolbar__actions">
          {actions}
          {canCreate && (
            <Button onClick={onAdd} className="ui-admin-toolbar__create">
              <Plus size={18} /> {addLabel}
            </Button>
          )}
        </div>
      </div>
      {footer && (
        <div className="ui-admin-toolbar__foot">
          {footer}
        </div>
      )}
    </section>
  );
};

export default AdminToolbar;
