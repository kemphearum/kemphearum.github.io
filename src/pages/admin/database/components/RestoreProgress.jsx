import React from 'react';
import { RefreshCw } from 'lucide-react';

const RestoreProgress = ({ progress }) => {
  if (!progress) return null;
  const percentage = Math.max(0, Math.min(100, Number(progress.percentage) || 0));

  return (
    <div className={"ui-floating-progress"} role="status" aria-live="polite">
      <div className={"ui-progress-header"}>
        <div className={"ui-progress-title"}>
          <RefreshCw size={18} className={"ui-spin"} />
          <span>Restoring Database...</span>
        </div>
        <span className={"ui-progress-percent"}>{percentage}%</span>
      </div>
      <div className="ui-progress-bar">
        <div 
          className="ui-progress-fill" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className={"ui-progress-details"}>
        {progress.completed.toLocaleString()} / {progress.total.toLocaleString()} records processed
      </div>
    </div>
  );
};

export default RestoreProgress;
