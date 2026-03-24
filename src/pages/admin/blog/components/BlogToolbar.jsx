import React from 'react';
import { Plus, Search } from 'lucide-react';
import { Button, Input } from '../../../../shared/components/ui';

const BlogToolbar = ({ onCreate, onSearch, canCreate = true }) => {
  return (
    <div className="admin-toolbar">
      <div className="admin-search-wrapper">
        <Search size={16} />
        <Input
          placeholder="Search by title..."
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      
      {canCreate && (
        <Button onClick={onCreate} className="ui-button ui-primary">
          <Plus size={18} /> Add New Post
        </Button>
      )}
    </div>
  );
};

export default BlogToolbar;
