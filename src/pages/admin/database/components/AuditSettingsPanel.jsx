import React from 'react';
import { Shield, Check, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from '../../../../shared/components/ui';
import { useTranslation } from '../../../../hooks/useTranslation';

const AuditSettingsPanel = ({ auditSettings, onUpdateSetting, canEdit = true, loading = false }) => {
  const { language } = useTranslation();
  const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
  const settingsList = [
    { key: 'logReads', label: tr('Log Read Operations', 'កត់ត្រាសកម្មភាពអាន'), desc: tr('Track when documents are fetched.', 'តាមដានពេលមានការទាញយកឯកសារ។') },
    { key: 'logWrites', label: tr('Log Write Operations', 'កត់ត្រាសកម្មភាពសរសេរ'), desc: tr('Track creates and updates.', 'តាមដានការបង្កើត និងការកែប្រែ។') },
    { key: 'logDeletes', label: tr('Log Delete Operations', 'កត់ត្រាសកម្មភាពលុប'), desc: tr('Track document removals.', 'តាមដានការលុបឯកសារ។') },
    { key: 'logAnonymous', label: tr('Log Anonymous Actions', 'កត់ត្រាសកម្មភាពអនាមិក'), desc: tr('Track public visitors.', 'តាមដានភ្ញៀវសាធារណៈ។') },
  ];
  const activeSettings = settingsList.filter((item) => auditSettings[item.key]).length;
  const disabled = !canEdit || loading;

  const handleSettingToggle = (key) => {
    if (disabled) return;
    onUpdateSetting(key, !auditSettings[key]);
  };

  const handleSettingKeyDown = (event, key) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSettingToggle(key);
    }
  };

  return (
    <div className="ui-audit-settings-section">
      <h4 className="ui-flex-center-gap-small ui-mb-medium">
        <Shield size={20} className="ui-text-accent" /> {tr('Audit Log Configuration', 'ការកំណត់ Audit Log')}
      </h4>
      
      <div className="ui-card ui-p-large">
        <div className="ui-flex-column-gap-large">
          {/* Master Toggle Section */}
          <div className="ui-flex-center-gap-large ui-bg-subtle ui-p-large ui-rounded-large ui-border ui-hover-bg-subtle">
            <div className={`ui-icon-box ${auditSettings.logAll ? 'ui-primary' : ''}`}>
              <Shield size={22} />
            </div>
            <div className="ui-flex-1">
              <div className="ui-font-bold ui-text-primary ui-mb-extra-small">{tr('Master Audit Tracking', 'ការតាមដាន Audit មេ')}</div>
              <div className="ui-text-small ui-text-secondary">{tr('Enable or disable all database activity logging globally. Highly recommended for production stability.', 'បើក ឬបិទការកត់ត្រាសកម្មភាពមូលដ្ឋានទិន្នន័យទាំងមូល។ ផ្តល់អនុសាសន៍ខ្ពស់សម្រាប់ស្ថេរភាពប្រព័ន្ធពេលប្រើប្រាស់ពិត។')}</div>
              <div className="ui-db-inline-meta">{activeSettings}/{settingsList.length} {tr('granular rules enabled', 'ច្បាប់លម្អិតដែលបានបើក')}</div>
            </div>
            <Button 
              variant={auditSettings.logAll ? 'primary' : 'ghost'}
              onClick={() => onUpdateSetting('logAll', !auditSettings.logAll)}
              className="ui-btn-sm"
              icon={auditSettings.logAll ? ShieldCheck : ShieldAlert}
              isLoading={loading}
              disabled={disabled}
              title={canEdit ? tr('Toggle Master Audit', 'ប្ដូរ Master Audit') : tr('Not authorized', 'គ្មានសិទ្ធិ')}
            >
              {auditSettings.logAll ? tr('Tracking Enabled', 'បានបើកការតាមដាន') : tr('Tracking Disabled', 'បានបិទការតាមដាន')}
            </Button>
          </div>

          {/* Detailed Settings Grid */}
          <div className="ui-grid-2">
            {settingsList.map(item => (
              <div 
                key={item.key} 
                className={`ui-flex-center-gap-medium ui-p-medium ui-rounded-medium ui-border ${canEdit ? 'ui-cursor-pointer ui-hover-bg' : 'ui-cursor-not-allowed'} ${auditSettings[item.key] ? 'ui-bg-subtle-light' : ''}`}
                onClick={() => handleSettingToggle(item.key)}
                onKeyDown={(event) => handleSettingKeyDown(event, item.key)}
                role="button"
                aria-pressed={Boolean(auditSettings[item.key])}
                tabIndex={disabled ? -1 : 0}
                title={canEdit ? tr(`Toggle ${item.label}`, `ប្ដូរ ${item.label}`) : tr('Not authorized', 'គ្មានសិទ្ធិ')}
              >
                <div className="ui-flex-1">
                  <div className={`ui-font-bold ui-text-small ui-mb-extra-small ${auditSettings[item.key] ? 'ui-text-accent' : 'ui-text-primary'}`}>
                    {item.label}
                  </div>
                  <div className="ui-text-extra-small ui-text-secondary">{item.desc}</div>
                </div>
                <div className={`ui-checkbox-container ${auditSettings[item.key] ? 'ui-active' : ''}`}>
                  {auditSettings[item.key] && <Check size={14} strokeWidth={3} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditSettingsPanel;
