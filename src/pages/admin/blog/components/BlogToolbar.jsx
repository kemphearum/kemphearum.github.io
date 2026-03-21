import React from 'react';
import { Plus, Search } from 'lucide-react';
import { Button, Input } from '../../../../shared/components/ui';

const BlogToolbar = ({ onCreate, onSearch, canCreate = true }) => {
  return (
    <div className="ui-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
      <div className="ui-searchWrapper" style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
        <Search 
          size={16} 
          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', zIndex: 1 }} 
        />
        <Input
          placeholder="Search by title..."
          onChange={(e) => onSearch(e.target.value)}
          style={{ paddingLeft: '36px' }}
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
