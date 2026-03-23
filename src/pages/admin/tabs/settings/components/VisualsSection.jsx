import { Save } from 'lucide-react';
import { Button } from '../../../../../shared/components/ui';
import FormSelect from '../../../components/FormSelect';
import styles from '../../../../Admin.module.scss';
import tabStyles from '../../SettingsTab.module.scss';

const VisualsSection = ({ 
    settingsData, 
    setSettingsData, 
    sidebarPersistent, 
    setSidebarPersistent,
    onSave,
    loading
}) => {
    return (
        <form onSubmit={onSave} className={tabStyles.tabContentFadeIn}>
            <div className="ui-card">
                <div className={tabStyles.sectionHeader}>
                    <h4>Visual Experience</h4>
                </div>
                
                <div className={tabStyles.visualsGrid}>
                    <FormSelect
                        label="Background Style Variant"
                        value={settingsData.bgStyle || 'plexus'}
                        onChange={(e) => setSettingsData({ ...settingsData, bgStyle: e.target.value })}
                        options={[
                            { value: 'plexus', label: '🕸️ Plexus (Connected Lines)' },
                            { value: 'particles', label: '✨ Dust Particles' },
                            { value: 'geometry', label: '📐 Floating Geometry' },
                            { value: 'aurora', label: '🌈 Aurora Borealis' }
                        ]}
                        fullWidth
                    />
                    
                    <div className={tabStyles.inputGroup}>
                        <label>Particle Density ({settingsData.bgDensity ?? 50}%)</label>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={settingsData.bgDensity ?? 50}
                            onChange={(e) => setSettingsData({ ...settingsData, bgDensity: parseInt(e.target.value) })}
                        />
                    </div>
                    
                    <div className={tabStyles.inputGroup}>
                        <label>Animation Speed ({settingsData.bgSpeed ?? 50}%)</label>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={settingsData.bgSpeed ?? 50}
                            onChange={(e) => setSettingsData({ ...settingsData, bgSpeed: parseInt(e.target.value) })}
                        />
                    </div>
                    
                    <div className={tabStyles.inputGroup}>
                        <label>Glow Intensity ({settingsData.bgGlowOpacity ?? 50}%)</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={settingsData.bgGlowOpacity ?? 50}
                            onChange={(e) => setSettingsData({ ...settingsData, bgGlowOpacity: parseInt(e.target.value) })}
                        />
                    </div>
                    
                    <div className={`${tabStyles.inputGroup} tabStyles.inputGroupRow`}>
                        <label className={tabStyles.inline}>
                            <input
                                type="checkbox"
                                checked={settingsData.bgInteractive ?? true}
                                onChange={(e) => setSettingsData({ ...settingsData, bgInteractive: e.target.checked })}
                            />
                            <span>
                                Interactive Mouse Effect
                            </span>
                        </label>
                        <p className={tabStyles.desc}>
                            Background particles respond to mouse movement.
                        </p>
                    </div>
                    
                    <div className={`${tabStyles.inputGroup} tabStyles.inputGroupRow`}>
                        <label className={tabStyles.inline}>
                            <input
                                type="checkbox"
                                checked={settingsData.notificationsEnabled ?? true}
                                onChange={(e) => setSettingsData({ ...settingsData, notificationsEnabled: e.target.checked })}
                            />
                            <span>
                                Notification Alerts (Toasts)
                            </span>
                        </label>
                        <p className={tabStyles.desc}>
                            Show popup alerts in the top right for actions (saving, deleting, etc).
                        </p>
                    </div>
                    
                    <div className={`${tabStyles.inputGroup} tabStyles.inputGroupRow`}>
                        <label className={tabStyles.inline}>
                            <input
                                type="checkbox"
                                checked={sidebarPersistent}
                                onChange={(e) => setSidebarPersistent(e.target.checked)}
                            />
                            <span>
                                Persistent Admin Sidebar
                            </span>
                        </label>
                        <p className={tabStyles.desc}>
                            Keep the admin sidebar permanently expanded instead of collapsing it.
                        </p>
                    </div>
                </div>

                <div className={tabStyles.formFooter}>
                    <Button
                        type="submit"
                        isLoading={loading}
                        className={tabStyles.saveButton}
                    >
                        <Save size={18} /> Save Visual Settings
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default VisualsSection;
