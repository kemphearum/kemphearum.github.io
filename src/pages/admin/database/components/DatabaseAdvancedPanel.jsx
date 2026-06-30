import React, { useState } from 'react';
import { Rocket, Settings2, DatabaseZap, BookOpen, Copy, Play } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { useTranslation } from '../../../../hooks/useTranslation';
import { seedSampleData } from '../../../../utils/sampleData';

const DatabaseAdvancedPanel = ({ showToast, userRole, trackWrite, onSuccess }) => {
  const { t } = useTranslation();

  const copyText = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast?.(
        t('ui.SuccessLabelCopied'),
        'success'
      );
    } catch {
      showToast?.(
        t('ui.failedToCopyCommand'),
        'error'
      );
    }
  };

  const [isSeeding, setIsSeeding] = useState(false);
  const handleSeed = async () => {
    if (!window.confirm(t('ui.areYouSureYouWantToSeedSa'))) return;
    setIsSeeding(true);
    try {
        const results = await seedSampleData(userRole, trackWrite);
        let createdCount = 0;
        Object.values(results).forEach(r => createdCount += r.created);
        showToast?.(t('ui.successfullySeededCreated'), 'success');
        if (onSuccess) onSuccess();
    } catch (error) {
        console.error(error);
        showToast?.(t('ui.seedingFailed'), 'error');
    } finally {
        setIsSeeding(false);
    }
  };

  return (
    <div className="ui-actions-section ui-advanced-section">
      <div className="ui-flex-between ui-mb-medium">
        <h4 className="ui-flex-center-gap-small ui-m-0">
          <Rocket size={18} className="ui-text-accent" /> {t('ui.advancedWorkflow')}
        </h4>
      </div>

      <div className="ui-grid ui-advanced-grid">
        <div className="ui-database-card ui-primary">
          <div className="ui-flex-column ui-flex-1">
            <h5 className="ui-flex-center-gap-small ui-mb-small">
              <Rocket size={18} /> {t('ui.advancedSeeding')}
            </h5>
            <p className="ui-text-secondary ui-text-small ui-mb-medium">
              {t('ui.useStandardHardResetOrFul')}
            </p>
            <code className="ui-advanced-code">node scripts/seed-sample-data.mjs</code>
            <code className="ui-advanced-code">node scripts/seed-sample-data.mjs --hard-reset</code>
            <code className="ui-advanced-code">node scripts/seed-sample-data.mjs --full-reset</code>
          </div>
          <div className="ui-flex-gap-medium">
            <Button variant="primary" size="sm" icon={Play} onClick={handleSeed} disabled={isSeeding}>
              {isSeeding ? t('ui.seeding') : t('ui.runSeedInBrowser')}
            </Button>
            <Button variant="ghost" size="sm" icon={Copy} onClick={() => copyText('node scripts/seed-sample-data.mjs', 'seed script')}>
              {t('ui.copyCLICommand')}
            </Button>
          </div>
        </div>

        <div className="ui-database-card ui-success">
          <div className="ui-flex-column ui-flex-1">
            <h5 className="ui-flex-center-gap-small ui-mb-small">
              <Settings2 size={18} /> {t('ui.cleanSettings')}
            </h5>
            <p className="ui-text-secondary ui-text-small ui-mb-medium">
              {t('ui.seedSettingsCjsIsConfigur')}
            </p>
            <code className="ui-advanced-code">{`db.collection('settings').doc('global').set(payload, { merge: false })`}</code>
          </div>
        </div>

        <div className="ui-database-card ui-primary">
          <div className="ui-flex-column ui-flex-1">
            <h5 className="ui-flex-center-gap-small ui-mb-small">
              <DatabaseZap size={18} /> {t('ui.optimizedIndexes')}
            </h5>
            <p className="ui-text-secondary ui-text-small ui-mb-medium">
              {t('ui.firestoreIndexesJsonIsPar')}
            </p>
            <code className="ui-advanced-code">firebase deploy --only firestore:indexes</code>
          </div>
          <Button variant="ghost" size="sm" icon={Copy} onClick={() => copyText('firebase deploy --only firestore:indexes', 'indexes deploy')}>
            {t('ui.copyDeployCommand')}
          </Button>
        </div>

        <div className="ui-database-card ui-success">
          <div className="ui-flex-column ui-flex-1">
            <h5 className="ui-flex-center-gap-small ui-mb-small">
              <BookOpen size={18} /> {t('ui.masterWalkthrough')}
            </h5>
            <p className="ui-text-secondary ui-text-small ui-mb-medium">
              {t('ui.theCompleteEndToEndProces')}
            </p>
            <code className="ui-advanced-code">walkthrough.md</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseAdvancedPanel;
