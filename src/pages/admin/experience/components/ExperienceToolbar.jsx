import React from 'react';
import { Plus, Search } from 'lucide-react';
import { Button, Input } from '../../../../shared/components/ui';

const ExperienceToolbar = ({ onAdd, searchQuery, onSearchChange, canCreate = true }) => {
  return (
    <div className="admin-toolbar">
      <div className="admin-search-wrapper">
        <Search size={18} />
        <Input
          placeholder="Search experience by role or company..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      {canCreate && (
        <Button onClick={onAdd} className="ui-primary">
          <Plus size={18} /> Add New Experience
        </Button>
      )}
    </div>
  );
};

export default ExperienceToolbar;
