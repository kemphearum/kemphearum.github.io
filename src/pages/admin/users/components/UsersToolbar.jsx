import React from 'react';
import { Search, UserPlus, Users } from 'lucide-react';
import { Input, Button } from '../../../../shared/components/ui';

const UsersToolbar = ({ search, onSearch, onCreate, searchResultCount, totalCount, stats = [] }) => {
  return (
    <section className="ui-users-toolbar">
      <div className="ui-users-toolbar__summary">
        <span className="ui-users-toolbar__eyebrow">
          <Users size={14} />
          User workspace
        </span>
        <div className="ui-users-toolbar__copy">
          <h3>Manage access and account roles from one place.</h3>
          <p>
            Search by email or role, inspect account history, and invite new admins without leaving the table.
          </p>
        </div>
      </div>

      {stats.length > 0 && (
        <div className="ui-users-toolbar__stats" aria-label="User workspace summary">
          {stats.map((stat) => (
            <div key={stat.label} className="ui-users-toolbar__stat">
              <span className="ui-users-toolbar__statLabel">{stat.label}</span>
              <strong className="ui-users-toolbar__statValue">{stat.value}</strong>
              <span className="ui-users-toolbar__statMeta">{stat.meta}</span>
            </div>
          ))}
        </div>
      )}

      <div className="admin-toolbar ui-users-toolbar__controls">
        <div className="admin-search-container ui-users-toolbar__search">
          <Search size={16} className="admin-search-icon" />
          <Input 
            type="text" 
            placeholder="Search by email or role..." 
            value={search} 
            onChange={(e) => onSearch(e.target.value)} 
            className="admin-search-input"
          />
          <span className="admin-search-result-count">
            {search ? `${searchResultCount} of ${totalCount}` : `${totalCount} total`}
          </span>
        </div>

        <Button onClick={onCreate} className="ui-primary ui-users-toolbar__create">
          <UserPlus size={18} /> Add User
        </Button>
      </div>
    </section>
  );
};

export default UsersToolbar;
