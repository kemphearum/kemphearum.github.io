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
  const { t } = useTranslation();
  const selectedCount = Object.values(archiveTargets || {}).filter(Boolean).length;
  const archiveOptions = [
    { key: 'authLogs', label: t('admin.forms.securityAuthLogs'), description: t('admin.forms.failedLoginsAndAuthe') },
    { key: 'systemLogs', label: t('admin.forms.systemLogs'), description: t('admin.forms.generalAdminAndSyste') },
    { key: 'activityFeed', label: t('admin.forms.activityFeedRecords'), description: t('admin.forms.detailedReadWriteDel') },
    { key: 'draftContent', label: t('admin.forms.draftTemporaryRecord'), description: t('admin.forms.hiddenPostsAndProjec') },
    { key: 'dailyUsage', label: t('admin.forms.dailyAnalyticsBreakd'), description: t('admin.forms.dailyUsageTotalsAndR') },
    { key: 'visits', label: t('admin.forms.visits'), description: t('admin.forms.pageVisitRecordsAndT') }
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
          title={t('admin.forms.confirmArchive')} 
          icon={Trash2}
          variant="danger"
        />
        
        <Dialog.Body>
          <p className="ui-text-secondary ui-text-center ui-mb-large">
            {t('admin.forms.youAreAboutToPermane')} <span className="ui-text-danger ui-font-bold">{archiveDays} {t('admin.forms.days')}</span>.
          </p>

          <div className="ui-card ui-bg-subtle ui-p-medium ui-mb-large">
            <div className="ui-flex-start-gap-medium ui-mb-medium">
              <div className="ui-badge ui-badge-info ui-badge-sm">1</div>
              <div className="ui-text-small">
                <strong>{t('admin.forms.recommended')}</strong> {t('admin.forms.downloadFullJSONBack')}
              </div>
            </div>
            <div className="ui-flex-start-gap-medium">
              <div className="ui-badge ui-badge-danger ui-badge-sm">2</div>
              <div className="ui-text-small">
                <strong>{t('admin.forms.permanent')}</strong> {t('admin.forms.recordsWillBePermane')}
              </div>
            </div>
          </div>

          <div className="ui-card ui-bg-subtle ui-p-medium ui-mb-large">
            <div className="ui-flex-between ui-mb-medium">
              <strong>{t('admin.forms.archiveScope')}</strong>
              <div className="ui-flex-gap-small">
                <Button type="button" variant="ghost" size="sm" onClick={() => setAllTargets(true)}>
                  {t('admin.forms.selectAll')}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setAllTargets(false)}>
                  {t('admin.forms.clearAll')}
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
            {t('admin.forms.areYouAbsolutelySure')}
            {selectedCount === 0 && (
              <span className="ui-text-danger ui-block ui-text-small ui-mt-small">
                {t('admin.forms.selectAtLeastOneArch')}
              </span>
            )}
          </p>
        </Dialog.Body>

        <Dialog.Footer>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('admin.forms.cancel')}
          </Button>
          <Button 
            variant="danger" 
            onClick={onConfirm} 
            isLoading={loading}
            disabled={loading || selectedCount === 0}
            icon={Trash2}
          >
            {t('admin.forms.archiveAndDelete')}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

export default ArchiveDialog;
