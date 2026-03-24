import React, { useId, useMemo, useRef } from 'react';
import { Server, Download, Upload, Trash2, ShieldAlert } from 'lucide-react';
import { Button, Select } from '../../../../shared/components/ui';

const DatabaseActions = ({ 
  loading,
  onBackup, 
  onRestoreSelect, 
  archiveDays, 
  onArchiveDaysChange, 
  onArchiveClick,
  canBackup = true,
  canArchive = true
}) => {
  const restoreInputId = useId();
  const restoreInputRef = useRef(null);

  const loadingState = useMemo(() => {
    if (typeof loading === 'boolean') {
      return { any: loading, backup: loading, restore: loading, archive: loading };
    }
    return {
      any: Boolean(loading?.any),
      backup: Boolean(loading?.backup),
      restore: Boolean(loading?.restore),
      archive: Boolean(loading?.archive)
    };
  }, [loading]);

  const triggerFilePicker = () => {
    if (!canBackup || loadingState.any) return;
    restoreInputRef.current?.click();
  };

  const handleRestoreFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onRestoreSelect(file);
    }
    // Allow selecting the same file again after cancel/error.
    event.target.value = '';
  };

  return (
    <div className={"ui-actions-section"}>
      <div className="ui-flex-between ui-mb-medium">
        <h4 className="ui-flex-center-gap-small ui-m-0">
          <Server size={18} className="ui-text-accent" /> Database Actions
        </h4>
      </div>
      
      <div className={"ui-grid"}>
        {/* Full Backup */}
        <div className="ui-database-card ui-success ui-hover-bg">
          <div className="ui-flex-column ui-flex-1">
            <h5 className="ui-flex-center-gap-small ui-mb-small">
              <Download size={18} /> Full JSON Backup
            </h5>
            <p className="ui-text-secondary ui-text-small ui-mb-medium">
              Download all database collections in a single JSON file. Perfect for manual backups or data migration.
            </p>
          </div>
          <Button 
            variant="primary" 
            onClick={onBackup} 
            isLoading={loadingState.backup}
            disabled={!canBackup || loadingState.any}
            title={canBackup ? "Backup Database" : "Not authorized"}
            className="ui-self-start"
            icon={Download}
          >
            Backup Database
          </Button>
        </div>

        {/* Data Restoration */}
        <div className="ui-database-card ui-primary ui-hover-bg">
          <div className="ui-flex-column ui-flex-1">
            <h5 className="ui-flex-center-gap-small ui-mb-small">
              <Upload size={18} /> Restore from Backup
            </h5>
            <p className="ui-text-secondary ui-text-small ui-mb-medium">
              Restore your database using a previously downloaded JSON file. <strong>Warning:</strong> Existing data will be overwritten.
            </p>
          </div>
          <div className="ui-flex-gap-medium">
            <input 
              type="file" 
              id={restoreInputId}
              ref={restoreInputRef}
              hidden 
              accept=".json" 
              onChange={handleRestoreFileChange}
            />
            <Button 
              variant="primary" 
              onClick={triggerFilePicker}
              isLoading={loadingState.restore}
              disabled={!canBackup || loadingState.any}
              title={canBackup ? "Select File" : "Not authorized"}
              icon={Upload}
            >
              Select JSON File
            </Button>
          </div>
        </div>

        {/* Archive Cleanup */}
        <div className="ui-database-card ui-danger ui-hover-bg">
          <div className="ui-flex-column ui-flex-1">
            <h5 className="ui-flex-center-gap-small ui-mb-small">
              <Trash2 size={18} /> Archive Old Records
            </h5>
            <p className="ui-text-secondary ui-text-small ui-mb-medium">
              Clear messages, audit logs, and analytics older than a specified period to maintain performance.
            </p>
          </div>
          <div className="ui-flex-center-gap-medium">
            <Select
              value={archiveDays}
              onChange={(e) => onArchiveDaysChange(Number(e.target.value))}
              options={[
                { value: 30, label: 'Older than 30 Days' },
                { value: 90, label: 'Older than 90 Days' },
                { value: 180, label: 'Older than 6 Months' },
                { value: 365, label: 'Older than 1 Year' }
              ]}
              className="ui-archive-select"
            />
            <Button 
              variant="danger" 
              onClick={onArchiveClick} 
              isLoading={loadingState.archive}
              disabled={!canArchive || loadingState.any}
              title={canArchive ? "Archive Now" : "Not authorized"}
              icon={ShieldAlert}
            >
              Archive Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseActions;
