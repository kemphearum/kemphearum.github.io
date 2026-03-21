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
                <div className={tabStyles.sectionHeader} style={{ marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--input-border)', paddingBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Visual Experience</h4>
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
                            style={{ width: '100%', accentColor: 'var(--primary-color)' }}
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
                            style={{ width: '100%', accentColor: 'var(--primary-color)' }}
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
                            style={{ width: '100%', accentColor: 'var(--primary-color)' }}
                        />
                    </div>
                    
                    <div className={tabStyles.inputGroup} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={settingsData.bgInteractive ?? true}
                                onChange={(e) => setSettingsData({ ...settingsData, bgInteractive: e.target.checked })}
                                style={{
                                    width: '18px',
                                    height: '18px',
                                    accentColor: 'var(--primary-color)',
                                    cursor: 'pointer'
                                }}
                            />
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, letterSpacing: '0.2px' }}>
                                Interactive Mouse Effect
                            </span>
                        </label>
                        <p style={{ margin: '0.25rem 0 0 2rem', fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
                            Background particles respond to mouse movement.
                        </p>
                    </div>
                    
                    <div className={tabStyles.inputGroup} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={settingsData.notificationsEnabled ?? true}
                                onChange={(e) => setSettingsData({ ...settingsData, notificationsEnabled: e.target.checked })}
                                style={{
                                    width: '18px',
                                    height: '18px',
                                    accentColor: 'var(--primary-color)',
                                    cursor: 'pointer'
                                }}
                            />
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, letterSpacing: '0.2px' }}>
                                Notification Alerts (Toasts)
                            </span>
                        </label>
                        <p style={{ margin: '0.25rem 0 0 2rem', fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
                            Show popup alerts in the top right for actions (saving, deleting, etc).
                        </p>
                    </div>
                    
                    <div className={tabStyles.inputGroup} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={sidebarPersistent}
                                onChange={(e) => setSidebarPersistent(e.target.checked)}
                                style={{
                                    width: '18px',
                                    height: '18px',
                                    accentColor: 'var(--primary-color)',
                                    cursor: 'pointer'
                                }}
                            />
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, letterSpacing: '0.2px' }}>
                                Persistent Admin Sidebar
                            </span>
                        </label>
                        <p style={{ margin: '0.25rem 0 0 2rem', fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
                            Keep the admin sidebar permanently expanded instead of collapsing it.
                        </p>
                    </div>
                </div>

                <div className={tabStyles.formFooter} style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
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
