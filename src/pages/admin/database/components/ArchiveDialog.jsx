import React from 'react';
import { Trash2 } from 'lucide-react';
import { Dialog, Button } from '../../../../shared/components/ui';
import { useTranslation } from '../../../../hooks/useTranslation';

const ArchiveDialog = ({ 
  open, 
  onOpenChange, 
  archiveDays, 
  archiveTargets,
  onArchiveTargetsChange,
  onConfirm, 
  loading 
}) => {
  const { language } = useTranslation();
  const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
  const selectedCount = Object.values(archiveTargets || {}).filter(Boolean).length;
  const archiveOptions = [
    { key: 'authLogs', label: tr('Security / Auth Logs', 'កំណត់ហេតុសុវត្ថិភាព / ចូលប្រព័ន្ធ'), description: tr('Failed logins and authentication events.', 'ការចូលប្រើបរាជ័យ និងព្រឹត្តិការណ៍ផ្ទៀងផ្ទាត់។') },
    { key: 'systemLogs', label: tr('System Logs', 'កំណត់ហេតុប្រព័ន្ធ'), description: tr('General admin and system audit entries.', 'កំណត់ត្រាសវនកម្មទូទៅរបស់អ្នកគ្រប់គ្រង និងប្រព័ន្ធ។') },
    { key: 'activityFeed', label: tr('Activity Feed Records', 'កំណត់ត្រាសកម្មភាព'), description: tr('Detailed read/write/delete activity history.', 'ប្រវត្តិសកម្មភាព read/write/delete លម្អិត។') },
    { key: 'draftContent', label: tr('Draft / Temporary Records', 'ទិន្នន័យសាកល្បង / ព្រាង'), description: tr('Hidden posts and projects older than the cutoff.', 'ប្រកាស និងគម្រោងដែលលាក់ និងចាស់ជាងកំណត់។') },
    { key: 'dailyUsage', label: tr('Daily Analytics Breakdown', 'បំបែកស្ថិតិប្រចាំថ្ងៃ'), description: tr('Daily usage totals and related logs.', 'ចំនួនសរុបប្រចាំថ្ងៃ និងកំណត់ហេតុពាក់ព័ន្ធ។') },
    { key: 'messages', label: tr('Messages', 'សារ'), description: tr('Inbox and contact form messages.', 'សារក្នុងប្រអប់ទទួល និងសារពីទម្រង់ទំនាក់ទំនង។') },
    { key: 'visits', label: tr('Visits', 'ការចូលមើល'), description: tr('Page visit records and timestamps.', 'កំណត់ត្រាចូលមើលទំព័រ និងម៉ោង។') }
  ];

  const updateTarget = (key, checked) => {
    onArchiveTargetsChange?.((prev) => ({
      ...(prev || {}),
      [key]: checked
    }));
  };

  const setAllTargets = (checked) => {
    onArchiveTargetsChange?.(
      archiveOptions.reduce((acc, option) => {
        acc[option.key] = checked;
        return acc;
      }, {})
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="460px">
        <Dialog.Header 
          title={tr('Confirm Archive', 'បញ្ជាក់ការប័ណ្ណសារ')} 
          icon={Trash2}
          variant="danger"
        />
        
        <Dialog.Body>
          <p className="ui-text-secondary ui-text-center ui-mb-large">
            {tr('You are about to permanently archive and delete the selected records older than', 'អ្នកកំពុងត្រៀមបណ្ណសារ និងលុបចោលកំណត់ត្រាដែលបានជ្រើស ដែលចាស់ជាង')} <span className="ui-text-danger ui-font-bold">{archiveDays} {tr('days', 'ថ្ងៃ')}</span>.
          </p>

          <div className="ui-card ui-bg-subtle ui-p-medium ui-mb-large">
            <div className="ui-flex-start-gap-medium ui-mb-medium">
              <div className="ui-badge ui-badge-info ui-badge-sm">1</div>
              <div className="ui-text-small">
                <strong>{tr('Recommended:', 'ណែនាំ៖')}</strong> {tr('Download full JSON Backup before proceeding.', 'ទាញយក JSON Backup ពេញលេញ មុនពេលបន្ត។')}
              </div>
            </div>
            <div className="ui-flex-start-gap-medium">
              <div className="ui-badge ui-badge-danger ui-badge-sm">2</div>
              <div className="ui-text-small">
                <strong>{tr('Permanent:', 'អចិន្ត្រៃយ៍៖')}</strong> {tr('Records will be permanently removed from Firebase.', 'កំណត់ត្រានឹងត្រូវដកចេញពី Firebase ជាអចិន្ត្រៃយ៍។')}
              </div>
            </div>
          </div>

          <div className="ui-card ui-bg-subtle ui-p-medium ui-mb-large">
            <div className="ui-flex-between ui-mb-medium">
              <strong>{tr('Archive Scope', 'វិសាលភាពបណ្ណសារ')}</strong>
              <div className="ui-flex-gap-small">
                <Button type="button" variant="ghost" size="sm" onClick={() => setAllTargets(true)}>
                  {tr('Select All', 'ជ្រើសទាំងអស់')}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setAllTargets(false)}>
                  {tr('Clear All', 'លុបទាំងអស់')}
                </Button>
              </div>
            </div>
            <div className="ui-flex-column" style={{ gap: '0.75rem' }}>
              {archiveOptions.map((option) => (
                <label key={option.key} className="ui-flex-start-gap-medium" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(archiveTargets?.[option.key])}
                    onChange={(event) => updateTarget(option.key, event.target.checked)}
                  />
                  <div className="ui-flex-column">
                    <span className="ui-font-semibold">{option.label}</span>
                    <span className="ui-text-small ui-text-secondary">{option.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <p className="ui-text-primary ui-font-bold ui-text-center">
            {tr('Are you absolutely sure?', 'តើអ្នកប្រាកដទេ?')}
            {selectedCount === 0 && (
              <span className="ui-text-danger ui-block ui-text-small ui-mt-small">
                {tr('Select at least one archive category to continue.', 'សូមជ្រើសរើសយ៉ាងហោចណាស់មួយប្រភេទសម្រាប់បណ្ណសារមុនបន្ត។')}
              </span>
            )}
          </p>
        </Dialog.Body>

        <Dialog.Footer>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {tr('Cancel', 'បោះបង់')}
          </Button>
          <Button 
            variant="danger" 
            onClick={onConfirm} 
            isLoading={loading}
            disabled={loading || selectedCount === 0}
            icon={Trash2}
          >
            {tr('Archive and Delete', 'ប័ណ្ណសារ និងលុប')}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

export default ArchiveDialog;
