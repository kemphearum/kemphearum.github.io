import React from 'react';
import { Search } from 'lucide-react';
import { Input, Button } from '../../../../shared/components/ui';

const UsersToolbar = ({ search, onSearch, onCreate, searchResultCount, totalCount }) => {
  return (
    <div className="admin-toolbar">
      <div className="admin-search-container">
        <Search size={16} className="admin-search-icon" />
        <Input 
          type="text" 
          placeholder="Search by email or role..." 
          value={search} 
          onChange={(e) => onSearch(e.target.value)} 
          className="admin-search-input"
        />
        {search && (
          <span className="admin-search-result-count">
            {searchResultCount} of {totalCount}
          </span>
        )}
      </div>
      <Button onClick={onCreate} className="ui-primary">
        + Add User
      </Button>
    </div>
  );
};

export default UsersToolbar;
