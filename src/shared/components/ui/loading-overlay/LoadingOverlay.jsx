import React from 'react';
import './LoadingOverlay.scss';

/**
 * LoadingOverlay Component
 * A consistent way to show loading states over containers.
 * 
 * @param {Object} props
 * @param {boolean} props.active - Whether the overlay is visible
 * @param {string} props.message - Optional message to show
 * @param {string} props.className - Optional additional classes
 */
const LoadingOverlay = ({ active, message, className = '' }) => {
  if (!active) return null;

  return (
    <div className={`ui-loading-overlay ${className}`}>
      <div className="ui-spinner-container">
        <div className="ui-spinner" />
        {message && <p className="ui-loading-message">{message}</p>}
      </div>
    </div>
  );
};

export default LoadingOverlay;
