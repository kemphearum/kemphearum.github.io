import React from 'react';
import Button from '../button/Button';

/**
 * EmptyState Component
 * A consistent way to show "no data" states across the admin panel.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Lucide icon component instance
 * @param {string} props.title - Main heading text
 * @param {string} props.description - Supporting detail text
 * @param {Object} props.action - Optional action configuration { label, onClick, icon }
 */
const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className = ''
}) => {
  return (
    <div className={`ui-empty-state ${className}`}>
      {Icon && (
        <div className="ui-empty-state-icon">
          <Icon size={32} />
        </div>
      )}
      <h3 className="ui-empty-state-title">{title}</h3>
      {description && <p className="ui-empty-state-description">{description}</p>}
      
      {action && (
        <div className="ui-empty-state-action">
          <Button 
            onClick={action.onClick}
            variant={action.variant || "primary"}
            className="ui-button--with-icon"
          >
            {action.icon && <action.icon size={16} />}
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
