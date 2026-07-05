import React, { useId, useMemo, useRef, useState, useEffect } from 'react';
import { Server, Download, Upload, Trash2, ShieldAlert } from 'lucide-react';
import { Button, Select } from '../../../../shared/components/ui';
import { useTranslation } from '../../../../hooks/useTranslation';

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
  const { t } = useTranslation();
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

  const [backupHistory, setBackupHistory] = useState([]);
  const [restoreHistory, setRestoreHistory] = useState([]);
  
  useEffect(() => {
     try {
         setBackupHistory(JSON.parse(localStorage.getItem('database_backup_history') || '[]'));
         setRestoreHistory(JSON.parse(localStorage.getItem('database_restore_history') || '[]'));
     } catch (e) {
         console.error(e);
     }
  }, [loadingState.any]); // Reload when actions complete

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
          <Server size={18} className="ui-text-accent" /> {t('ui.databaseActions')}
        </h4>
      </div>
      
      <div className={"ui-grid"}>
        {/* Full Backup */}
        <div className="ui-database-card ui-success ui-hover-bg">
          <div className="ui-flex-column ui-flex-1">
            <h5 className="ui-flex-center-gap-small ui-mb-small">
              <Download size={18} /> {t('ui.fullJSONBackup')}
            </h5>
            <p className="ui-text-secondary ui-text-small ui-mb-medium">
              {t('ui.downloadAllDatabaseCollec')}
            </p>
          </div>
          <Button 
            variant="primary" 
            onClick={onBackup} 
            isLoading={loadingState.backup}
            disabled={!canBackup || loadingState.any}
            title={canBackup ? t('ui.backupDatabase') : t('ui.notAuthorized')}
            className="ui-self-start"
            icon={Download}
          >
            {t('ui.backupDatabase')}
          </Button>
        </div>

        {/* Data Restoration */}
        <div className="ui-database-card ui-primary ui-hover-bg">
          <div className="ui-flex-column ui-flex-1">
            <h5 className="ui-flex-center-gap-small ui-mb-small">
              <Upload size={18} /> {t('ui.restoreFromBackup')}
            </h5>
            <p className="ui-text-secondary ui-text-small ui-mb-medium">
              {t('ui.restoreYourDatabaseUsingA')} <strong>{t('ui.warning')}</strong> {t('ui.existingDataWillBeOverwri')}
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
              title={canBackup ? t('ui.selectFile') : t('ui.notAuthorized')}
              icon={Upload}
            >
              {t('ui.selectJSONFile')}
            </Button>
          </div>
        </div>

        {/* Archive Cleanup */}
        <div className="ui-database-card ui-danger ui-hover-bg">
          <div className="ui-flex-column ui-flex-1">
            <h5 className="ui-flex-center-gap-small ui-mb-small">
              <Trash2 size={18} /> {t('ui.archiveOldRecords')}
            </h5>
            <p className="ui-text-secondary ui-text-small ui-mb-medium">
              {t('ui.clearAuditLogsVisitsAndDa')}
            </p>
          </div>
          <div className="ui-flex-center-gap-medium">
            <Select
              value={archiveDays}
              onChange={(e) => onArchiveDaysChange(Number(e.target.value))}
              options={[
                { value: 7, label: t('ui.olderThan7Days1Week') },
                { value: 30, label: t('ui.olderThan30Days') },
                { value: 90, label: t('ui.olderThan90Days') },
                { value: 180, label: t('ui.olderThan6Months') },
                { value: 365, label: t('ui.olderThan1Year') }
              ]}
              className="ui-archive-select"
            />
            <Button 
              variant="danger" 
              onClick={onArchiveClick} 
              isLoading={loadingState.archive}
              disabled={!canArchive || loadingState.any}
              title={canArchive ? t('ui.archiveNow') : t('ui.notAuthorized')}
              icon={ShieldAlert}
            >
              {t('ui.archiveNow')}
            </Button>
          </div>
        </div>
      </div>

      {(backupHistory.length > 0 || restoreHistory.length > 0) && (
          <div className="ui-mt-large">
              <h5 className="ui-mb-small">{tm('ui.recentActivity')}</h5>
              <div className="ui-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <div className="ui-card ui-p-medium">
                      <h6 className="ui-mb-small">{tm('ui.backups')}</h6>
                      {backupHistory.slice(0, 5).map(item => (
                          <div key={item.id} className="ui-flex-between ui-text-small ui-mb-extra-small ui-pb-extra-small" style={{ borderBottom: '1px solid var(--border)' }}>
                              <span>{new Date(item.date).toLocaleString()}</span>
                              <span className="ui-text-muted">{item.details?.sizeBytes ? Math.round(item.details.sizeBytes / 1024) + ' KB' : '-'}</span>
                          </div>
                      ))}
                      {backupHistory.length === 0 && <span className="ui-text-muted ui-text-small">{tm('ui.noRecentBackups')}</span>}
                  </div>
                  <div className="ui-card ui-p-medium">
                      <h6 className="ui-mb-small">{tm('ui.restores')}</h6>
                      {restoreHistory.slice(0, 5).map(item => (
                          <div key={item.id} className="ui-flex-between ui-text-small ui-mb-extra-small ui-pb-extra-small" style={{ borderBottom: '1px solid var(--border)' }}>
                              <span>{new Date(item.date).toLocaleString()}</span>
                              <span className="ui-text-muted">{item.details?.completedCount || 0} docs</span>
                          </div>
                      ))}
                      {restoreHistory.length === 0 && <span className="ui-text-muted ui-text-small">{tm('ui.noRecentRestores')}</span>}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default DatabaseActions;
