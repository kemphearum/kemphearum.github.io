import React from 'react';
import { RefreshCw } from 'lucide-react';

const RestoreProgress = ({ progress }) => {
  if (!progress) return null;

  return (
    <div className={"ui-floating-progress"}>
      <div className={"ui-progress-header"}>
        <div className={"ui-progress-title"}>
          <RefreshCw size={18} className={"ui-spin"} />
          <span>Restoring Database...</span>
        </div>
        <span className={"ui-progress-percent"}>{progress.percentage}%</span>
      </div>
      <div className="ui-progress-bar">
        <div 
          className="ui-progress-fill" 
          style={{ width: `${progress.percentage}%` }}
        ></div>
      </div>
      <div className={"ui-progress-details"}>
        {progress.completed.toLocaleString()} / {progress.total.toLocaleString()} records processed
      </div>
    </div>
  );
};

export default RestoreProgress;
