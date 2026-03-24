import React from 'react';
import { Shield, Check, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from '../../../../shared/components/ui';

const AuditSettingsPanel = ({ auditSettings, onUpdateSetting, canEdit = true, loading = false }) => {
  const settingsList = [
    { key: 'logReads', label: 'Log Read Operations', desc: 'Track when documents are fetched.' },
    { key: 'logWrites', label: 'Log Write Operations', desc: 'Track creates and updates.' },
    { key: 'logDeletes', label: 'Log Delete Operations', desc: 'Track document removals.' },
    { key: 'logAnonymous', label: 'Log Anonymous Actions', desc: 'Track public visitors.' },
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
        <Shield size={20} className="ui-text-accent" /> Audit Log Configuration
      </h4>
      
      <div className="ui-card ui-p-large">
        <div className="ui-flex-column-gap-large">
          {/* Master Toggle Section */}
          <div className="ui-flex-center-gap-large ui-bg-subtle ui-p-large ui-rounded-large ui-border ui-hover-bg-subtle">
            <div className={`ui-icon-box ${auditSettings.logAll ? 'ui-primary' : ''}`}>
              <Shield size={22} />
            </div>
            <div className="ui-flex-1">
              <div className="ui-font-bold ui-text-primary ui-mb-extra-small">Master Audit Tracking</div>
              <div className="ui-text-small ui-text-secondary">Enable or disable all database activity logging globally. Highly recommended for production stability.</div>
              <div className="ui-db-inline-meta">{activeSettings}/{settingsList.length} granular rules enabled</div>
            </div>
            <Button 
              variant={auditSettings.logAll ? 'primary' : 'ghost'}
              onClick={() => onUpdateSetting('logAll', !auditSettings.logAll)}
              className="ui-btn-sm"
              icon={auditSettings.logAll ? ShieldCheck : ShieldAlert}
              isLoading={loading}
              disabled={disabled}
              title={canEdit ? 'Toggle Master Audit' : 'Not authorized'}
            >
              {auditSettings.logAll ? 'Tracking Enabled' : 'Tracking Disabled'}
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
                title={canEdit ? `Toggle ${item.label}` : 'Not authorized'}
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
