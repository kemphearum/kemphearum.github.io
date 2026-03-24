import React from 'react';
import { Plus, Search } from 'lucide-react';
import { Button, Input } from '../../../../shared/components/ui';

const ProjectsToolbar = ({ onAdd, searchQuery, onSearchChange, canCreate = true }) => {
  return (
    <div className="admin-toolbar">
      <div className="admin-search-wrapper">
        <Search size={18} />
        <Input
          placeholder="Search projects by title or tech..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      {canCreate && (
        <Button onClick={onAdd} className="ui-primary">
          <Plus size={18} /> Add New Project
        </Button>
      )}
    </div>
  );
};

export default ProjectsToolbar;
