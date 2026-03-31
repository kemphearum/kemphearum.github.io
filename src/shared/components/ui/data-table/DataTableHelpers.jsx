import React from 'react';
import { Edit2, Trash2, ExternalLink, Star, Eye, EyeOff } from 'lucide-react';
import { Button, Badge } from '@/shared/components/ui';

/**
 * Shared renderers and helpers for DataTable columns.
 * These are used across Projects, Blog, and Experience tabs to ensure UI consistency.
 */

/**
 * Render a simple status badge (Visible / Hidden)
 */
export const renderStatusBadge = (row, field = 'visible') => {
  const isVisible = row[field] !== false;
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <Badge variant={isVisible ? 'success' : 'warning'}>
        {isVisible ? 'Visible' : 'Hidden'}
      </Badge>
      {row.featured && (
        <Badge variant="primary">Featured</Badge>
      )}
    </div>
  );
};

/**
 * Render a tech stack / tags list as small badges
 */
export const renderTags = (row, field = 'techStack', max = 3) => {
  const tags = Array.isArray(row[field]) ? row[field] : [];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
      {tags.slice(0, max).map((tag, i) => (
        <Badge key={i} variant="default" size="sm" style={{ fontSize: '10px' }}>
          {tag}
        </Badge>
      ))}
      {tags.length > max && (
        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
          +{tags.length - max}
        </span>
      )}
    </div>
  );
};

/**
 * Render a standardized Actions grid for Admin tables
 */
export const renderAdminActions = ({
  row,
  onEdit,
  onDelete,
  onToggleVisibility,
  onToggleFeatured,
  viewUrlPrefix,
  canEdit = true,
  canDelete = true,
  canFeature,
  canToggleVisibility,
  extraActions = null
}) => {
  const isVisible = row.visible !== false;
  const resolvedCanFeature = canFeature !== undefined ? canFeature : canEdit;
  const resolvedCanToggleVisibility = canToggleVisibility !== undefined ? canToggleVisibility : canEdit;
  
  return (
    <div className="ui-table-actions-grid">
      {/* View Live Link */}
      {viewUrlPrefix && row.slug && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => window.open(`${viewUrlPrefix}${row.slug}`, '_blank')} 
          title="View Live"
        >
          <ExternalLink size={16} />
        </Button>
      )}

      {/* Featured Toggle */}
      {onToggleFeatured && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onToggleFeatured(row.id, !!row.featured)} 
          disabled={!resolvedCanFeature}
          title={row.featured ? "Unfeature" : "Feature"}
        >
          <Star 
            size={16} 
            fill={row.featured ? "currentColor" : "none"} 
            style={{ color: row.featured ? '#FFD700' : 'inherit' }} 
          />
        </Button>
      )}

      {/* Visibility Toggle */}
      {onToggleVisibility && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onToggleVisibility(row.id, isVisible)} 
          disabled={!resolvedCanToggleVisibility}
          title={isVisible ? "Hide" : "Show"}
        >
          {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
        </Button>
      )}

      {/* Extra Actions (Table specific) */}
      {extraActions}

      {/* Edit Action */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => onEdit(row)} 
        disabled={!canEdit}
        title={canEdit ? "Edit" : "Not authorized"}
      >
        <Edit2 size={16} />
      </Button>

      {/* Delete Action */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => onDelete(row)} 
        disabled={!canDelete}
        title={canDelete ? "Delete" : "Not authorized"}
        style={{ color: canDelete ? 'var(--danger-color, #ef4444)' : 'inherit' }}
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );
};
