import { Save } from 'lucide-react';
import { Button } from '../../../../shared/components/ui';
import FormSelect from '../../components/FormSelect';
import FormField from '../../components/FormField';
import tabStyles from '../SettingsTab.module.scss';

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
                    <FormField label="Background Style Variant" hint="Choose the visual pattern for the site background">
                        <FormSelect
                            value={settingsData.bgStyle || 'plexus'}
                            onChange={(e) => setSettingsData({ ...settingsData, bgStyle: e.target.value })}
                            options={[
                                { value: 'plexus', label: 'ðŸ•¸ï¸ Plexus (Connected Lines)' },
                                { value: 'particles', label: 'âœ¨ Dust Particles' },
                                { value: 'geometry', label: 'ðŸ“ Floating Geometry' },
                                { value: 'aurora', label: 'ðŸŒˆ Aurora Borealis' }
                            ]}
                        />
                    </FormField>

                    <FormField label={`Particle Density (${settingsData.bgDensity ?? 50}%)`}>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={settingsData.bgDensity ?? 50}
                            onChange={(e) => setSettingsData({ ...settingsData, bgDensity: parseInt(e.target.value) })}
                            className="ui-range-input"
                        />
                    </FormField>
                    
                    <FormField label={`Animation Speed (${settingsData.bgSpeed ?? 50}%)`}>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={settingsData.bgSpeed ?? 50}
                            onChange={(e) => setSettingsData({ ...settingsData, bgSpeed: parseInt(e.target.value) })}
                            className="ui-range-input"
                        />
                    </FormField>
                    
                    <FormField label={`Glow Intensity (${settingsData.bgGlowOpacity ?? 50}%)`}>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={settingsData.bgGlowOpacity ?? 50}
                            onChange={(e) => setSettingsData({ ...settingsData, bgGlowOpacity: parseInt(e.target.value) })}
                            className="ui-range-input"
                        />
                    </FormField>
                    
                    <div className={`${tabStyles.inputGroup} ${tabStyles.inputGroupRow} ${tabStyles.inline}`}>
                        <label>
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
                    
                    <div className={`${tabStyles.inputGroup} ${tabStyles.inputGroupRow} ${tabStyles.inline}`}>
                        <label>
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
                    
                    <div className={`${tabStyles.inputGroup} ${tabStyles.inputGroupRow} ${tabStyles.inline}`}>
                        <label>
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
