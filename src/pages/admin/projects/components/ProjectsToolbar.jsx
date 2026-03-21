import React from 'react';
import { Plus, Search } from 'lucide-react';
import { Button, Input } from '../../../../shared/components/ui';

const ProjectsToolbar = ({ onAdd, searchQuery, onSearchChange, canCreate = true }) => {
  return (
    <div className="ui-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
      <div className="ui-search-wrapper" style={{ position: 'relative', flex: '1', maxWidth: '400px' }}>
        <Search 
          size={18} 
          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} 
        />
        <Input
          placeholder="Search projects by title or tech..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ paddingLeft: '40px' }}
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
