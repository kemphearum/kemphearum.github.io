import React, { useState } from 'react';
import { Rocket, Settings2, DatabaseZap, BookOpen, Copy, Play } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { useTranslation } from '../../../../hooks/useTranslation';
import { seedSampleData } from '../../../../utils/sampleData';

const DatabaseAdvancedPanel = ({ showToast, userRole, trackWrite, onSuccess }) => {
  const { language } = useTranslation();
  const tr = (enText, kmText) => (language === 'km' ? kmText : enText);

  const copyText = async (value, successLabel) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast?.(
        tr(`${successLabel} copied.`, `បានចម្លង ${successLabel} រួចរាល់។`),
        'success'
      );
    } catch {
      showToast?.(
        tr('Failed to copy command.', 'មិនអាចចម្លងពាក្យបញ្ជាបានទេ។'),
        'error'
      );
    }
  };

  const [isSeeding, setIsSeeding] = useState(false);
  const handleSeed = async () => {
    if (!window.confirm(tr('Are you sure you want to seed sample data?', 'តើអ្នកប្រាកដថាចង់បញ្ចូលទិន្នន័យគំរូឬទេ?'))) return;
    setIsSeeding(true);
    try {
        const results = await seedSampleData(userRole, trackWrite);
        let createdCount = 0;
        Object.values(results).forEach(r => createdCount += r.created);
        showToast?.(tr(`Successfully seeded ${createdCount} items.`, `បានបញ្ចូលទិន្នន័យចំនួន ${createdCount} ជោគជ័យ។`), 'success');
        if (onSuccess) onSuccess();
    } catch (error) {
        console.error(error);
        showToast?.(tr('Seeding failed.', 'ការបញ្ចូលទិន្នន័យបានបរាជ័យ។'), 'error');
    } finally {
        setIsSeeding(false);
    }
  };

  return (
    <div className="ui-actions-section ui-advanced-section">
      <div className="ui-flex-between ui-mb-medium">
        <h4 className="ui-flex-center-gap-small ui-m-0">
          <Rocket size={18} className="ui-text-accent" /> {tr('Advanced Workflow', 'លំហូរការងារ​កម្រិត​ខ្ពស់')}
        </h4>
      </div>

      <div className="ui-grid ui-advanced-grid">
        <div className="ui-database-card ui-primary">
          <div className="ui-flex-column ui-flex-1">
            <h5 className="ui-flex-center-gap-small ui-mb-small">
              <Rocket size={18} /> {tr('Advanced Seeding', 'ការបញ្ចូលទិន្នន័យកម្រិតខ្ពស់')}
            </h5>
            <p className="ui-text-secondary ui-text-small ui-mb-medium">
              {tr(
                'Use standard, hard-reset, or full-reset modes from seed-sample-data.mjs.',
                'ប្រើ Standard, Hard Reset ឬ Full Reset ពី seed-sample-data.mjs។'
              )}
            </p>
            <code className="ui-advanced-code">node scripts/seed-sample-data.mjs</code>
            <code className="ui-advanced-code">node scripts/seed-sample-data.mjs --hard-reset</code>
            <code className="ui-advanced-code">node scripts/seed-sample-data.mjs --full-reset</code>
          </div>
          <div className="ui-flex-gap-medium">
            <Button variant="primary" size="sm" icon={Play} onClick={handleSeed} disabled={isSeeding}>
              {isSeeding ? tr('Seeding...', 'កំពុងបញ្ចូល...') : tr('Run Seed in Browser', 'បញ្ចូលទិន្នន័យទីនេះ')}
            </Button>
            <Button variant="ghost" size="sm" icon={Copy} onClick={() => copyText('node scripts/seed-sample-data.mjs', 'seed script')}>
              {tr('Copy CLI Command', 'ចម្លង CLI Command')}
            </Button>
          </div>
        </div>

        <div className="ui-database-card ui-success">
          <div className="ui-flex-column ui-flex-1">
            <h5 className="ui-flex-center-gap-small ui-mb-small">
              <Settings2 size={18} /> {tr('Clean Settings', 'សម្អាតការកំណត់')}
            </h5>
            <p className="ui-text-secondary ui-text-small ui-mb-medium">
              {tr(
                'seed-settings.cjs is configured with merge: false for full replacement.',
                'seed-settings.cjs ត្រូវបានកំណត់ merge: false ដើម្បីសរសេរជំនួសពេញលេញ។'
              )}
            </p>
            <code className="ui-advanced-code">{`db.collection('settings').doc('global').set(payload, { merge: false })`}</code>
          </div>
        </div>

        <div className="ui-database-card ui-primary">
          <div className="ui-flex-column ui-flex-1">
            <h5 className="ui-flex-center-gap-small ui-mb-small">
              <DatabaseZap size={18} /> {tr('Optimized Indexes', 'Indexes ដែលបានបង្កើនប្រសិទ្ធភាព')}
            </h5>
            <p className="ui-text-secondary ui-text-small ui-mb-medium">
              {tr(
                'firestore.indexes.json is part of the workflow. Deploy indexes after changes.',
                'firestore.indexes.json ជាផ្នែកនៃលំហូរការងារ។ Deploy indexes បន្ទាប់ពីមានការកែប្រែ។'
              )}
            </p>
            <code className="ui-advanced-code">firebase deploy --only firestore:indexes</code>
          </div>
          <Button variant="ghost" size="sm" icon={Copy} onClick={() => copyText('firebase deploy --only firestore:indexes', 'indexes deploy')}>
            {tr('Copy Deploy Command', 'ចម្លងពាក្យបញ្ជា Deploy')}
          </Button>
        </div>

        <div className="ui-database-card ui-success">
          <div className="ui-flex-column ui-flex-1">
            <h5 className="ui-flex-center-gap-small ui-mb-small">
              <BookOpen size={18} /> {tr('Master Walkthrough', 'មគ្គុទ្ទេសក៍មេ')}
            </h5>
            <p className="ui-text-secondary ui-text-small ui-mb-medium">
              {tr(
                'The complete end-to-end process is documented in walkthrough.md.',
                'ដំណើរការពេញលេញពីដើមដល់ចប់ ត្រូវបានកត់ត្រាទុកក្នុង walkthrough.md។'
              )}
            </p>
            <code className="ui-advanced-code">walkthrough.md</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseAdvancedPanel;
