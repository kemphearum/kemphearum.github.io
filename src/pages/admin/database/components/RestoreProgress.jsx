import React from 'react';
import { RefreshCw } from 'lucide-react';
import styles from '../DatabaseTab.module.scss';

const RestoreProgress = ({ progress }) => {
  if (!progress) return null;

  return (
    <div className={styles.floatingProgress}>
      <div className={styles.progressHeader}>
        <div className={styles.progressTitle}>
          <RefreshCw size={18} className={styles.spin} />
          <span>Restoring Database...</span>
        </div>
        <span className={styles.progressPercent}>{progress.percentage}%</span>
      </div>
      <div className="ui-progress-bar">
        <div 
          className="ui-progress-fill" 
          style={{ width: `${progress.percentage}%` }}
        ></div>
      </div>
      <div className={styles.progressDetails}>
        {progress.completed.toLocaleString()} / {progress.total.toLocaleString()} records processed
      </div>
    </div>
  );
};

export default RestoreProgress;
