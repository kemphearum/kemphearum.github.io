import React, { useId, useMemo, useRef } from 'react';
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
  const { language } = useTranslation();
  const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
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
          <Server size={18} className="ui-text-accent" /> {tr('Database Actions', 'សកម្មភាពមូលដ្ឋានទិន្នន័យ')}
        </h4>
      </div>
      
      <div className={"ui-grid"}>
        {/* Full Backup */}
        <div className="ui-database-card ui-success ui-hover-bg">
          <div className="ui-flex-column ui-flex-1">
            <h5 className="ui-flex-center-gap-small ui-mb-small">
              <Download size={18} /> {tr('Full JSON Backup', 'បម្រុងទុក JSON ពេញលេញ')}
            </h5>
            <p className="ui-text-secondary ui-text-small ui-mb-medium">
              {tr('Download all database collections in a single JSON file. Perfect for manual backups or data migration.', 'ទាញយកបណ្ដុំទិន្នន័យទាំងអស់របស់មូលដ្ឋានទិន្នន័យជាឯកសារ JSON តែមួយ។ សមស្របសម្រាប់ការបម្រុងទុកដោយដៃ ឬការផ្លាស់ទីទិន្នន័យ។')}
            </p>
          </div>
          <Button 
            variant="primary" 
            onClick={onBackup} 
            isLoading={loadingState.backup}
            disabled={!canBackup || loadingState.any}
            title={canBackup ? tr('Backup Database', 'បម្រុងទុកមូលដ្ឋានទិន្នន័យ') : tr('Not authorized', 'គ្មានសិទ្ធិ')}
            className="ui-self-start"
            icon={Download}
          >
            {tr('Backup Database', 'បម្រុងទុកមូលដ្ឋានទិន្នន័យ')}
          </Button>
        </div>

        {/* Data Restoration */}
        <div className="ui-database-card ui-primary ui-hover-bg">
          <div className="ui-flex-column ui-flex-1">
            <h5 className="ui-flex-center-gap-small ui-mb-small">
              <Upload size={18} /> {tr('Restore from Backup', 'ស្តារពីឯកសារបម្រុងទុក')}
            </h5>
            <p className="ui-text-secondary ui-text-small ui-mb-medium">
              {tr('Restore your database using a previously downloaded JSON file.', 'ស្តារមូលដ្ឋានទិន្នន័យរបស់អ្នកដោយប្រើឯកសារ JSON ដែលបានទាញយកពីមុន។')} <strong>{tr('Warning:', 'ព្រមាន៖')}</strong> {tr('Existing data will be overwritten.', 'ទិន្នន័យដែលមានស្រាប់នឹងត្រូវបានសរសេរជាន់ពីលើ។')}
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
              title={canBackup ? tr('Select File', 'ជ្រើសឯកសារ') : tr('Not authorized', 'គ្មានសិទ្ធិ')}
              icon={Upload}
            >
              {tr('Select JSON File', 'ជ្រើសឯកសារ JSON')}
            </Button>
          </div>
        </div>

        {/* Archive Cleanup */}
        <div className="ui-database-card ui-danger ui-hover-bg">
          <div className="ui-flex-column ui-flex-1">
            <h5 className="ui-flex-center-gap-small ui-mb-small">
              <Trash2 size={18} /> {tr('Archive Old Records', 'បណ្ណសារកំណត់ត្រាចាស់')}
            </h5>
            <p className="ui-text-secondary ui-text-small ui-mb-medium">
              {tr('Clear messages, audit logs, visits, and daily usage records older than a specified period to maintain performance.', 'សម្អាតសារ កំណត់ហេតុសវនកម្ម ចំនួនចូលមើល និងទិន្នន័យប្រើប្រាស់ប្រចាំថ្ងៃ ដែលចាស់ជាងរយៈពេលកំណត់ ដើម្បីរក្សាប្រសិទ្ធភាព។')}
            </p>
          </div>
          <div className="ui-flex-center-gap-medium">
            <Select
              value={archiveDays}
              onChange={(e) => onArchiveDaysChange(Number(e.target.value))}
              options={[
                { value: 7, label: tr('Older than 7 Days (1 Week)', 'Older than 7 Days (1 Week)') },
                { value: 30, label: tr('Older than 30 Days', 'ចាស់ជាង 30 ថ្ងៃ') },
                { value: 90, label: tr('Older than 90 Days', 'ចាស់ជាង 90 ថ្ងៃ') },
                { value: 180, label: tr('Older than 6 Months', 'ចាស់ជាង 6 ខែ') },
                { value: 365, label: tr('Older than 1 Year', 'ចាស់ជាង 1 ឆ្នាំ') }
              ]}
              className="ui-archive-select"
            />
            <Button 
              variant="danger" 
              onClick={onArchiveClick} 
              isLoading={loadingState.archive}
              disabled={!canArchive || loadingState.any}
              title={canArchive ? tr('Archive Now', 'បណ្ណសារឥឡូវនេះ') : tr('Not authorized', 'គ្មានសិទ្ធិ')}
              icon={ShieldAlert}
            >
              {tr('Archive Now', 'បណ្ណសារឥឡូវនេះ')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseActions;
