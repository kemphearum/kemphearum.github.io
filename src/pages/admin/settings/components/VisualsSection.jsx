import { BellRing, MousePointer2, PanelLeft, Save, Sparkles } from 'lucide-react';
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
    const bgStyle = settingsData.bgStyle || 'plexus';
    const bgDensity = settingsData.bgDensity ?? 50;
    const bgSpeed = settingsData.bgSpeed ?? 50;
    const bgGlowOpacity = settingsData.bgGlowOpacity ?? 50;
    const bgInteractive = settingsData.bgInteractive ?? true;
    const notificationsEnabled = settingsData.notificationsEnabled ?? true;

    const toggles = [
        {
            key: 'bgInteractive',
            title: 'Interactive mouse effect',
            description: 'Let particles or shapes respond to pointer movement for a more tactile public experience.',
            active: bgInteractive,
            icon: MousePointer2,
            onToggle: () => setSettingsData({ ...settingsData, bgInteractive: !bgInteractive })
        },
        {
            key: 'notificationsEnabled',
            title: 'Notification alerts',
            description: 'Show toast feedback in the admin interface for save, delete, and sync actions.',
            active: notificationsEnabled,
            icon: BellRing,
            onToggle: () => setSettingsData({ ...settingsData, notificationsEnabled: !notificationsEnabled })
        },
        {
            key: 'sidebarPersistent',
            title: 'Persistent admin sidebar',
            description: 'Keep the navigation expanded so the dashboard feels stable during longer editing sessions.',
            active: sidebarPersistent,
            icon: PanelLeft,
            onToggle: () => setSidebarPersistent(!sidebarPersistent)
        }
    ];

    return (
        <form onSubmit={onSave} className={tabStyles.tabContentFadeIn}>
            <div className="ui-card">
                <div className={tabStyles.surfaceHeader}>
                    <div className={tabStyles.surfaceCopy}>
                        <span className={tabStyles.surfaceEyebrow}>Visual Experience</span>
                        <h3 className={tabStyles.surfaceHeadline}>Tune the atmosphere, motion, and UI feedback of the portfolio and admin dashboard.</h3>
                        <p className={tabStyles.surfaceLead}>Background energy and interface behavior are grouped separately now, so it is easier to shape the site mood without losing operational clarity.</p>
                    </div>
                    <div className={tabStyles.surfaceMeta}>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{bgStyle}</span>
                            <span className={tabStyles.surfaceMetaLabel}>Background Style</span>
                            <span className={tabStyles.surfaceMetaHint}>Current visual system used on the public site</span>
                        </div>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{bgInteractive ? 'On' : 'Off'}</span>
                            <span className={tabStyles.surfaceMetaLabel}>Motion Input</span>
                            <span className={tabStyles.surfaceMetaHint}>Pointer interaction for background effects</span>
                        </div>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{notificationsEnabled ? 'Enabled' : 'Muted'}</span>
                            <span className={tabStyles.surfaceMetaLabel}>Admin Feedback</span>
                            <span className={tabStyles.surfaceMetaHint}>Toast notifications for system actions</span>
                        </div>
                    </div>
                </div>

                <div className={tabStyles.settingsSectionGrid}>
                    <div className={tabStyles.settingsPrimaryColumn}>
                        <section className={tabStyles.settingsPanel}>
                            <div className={tabStyles.panelHeader}>
                                <div className={tabStyles.panelTitleGroup}>
                                    <span className={tabStyles.panelEyebrow}>Background Atmosphere</span>
                                    <h4 className={tabStyles.panelTitle}>Set the visual mood of the public site</h4>
                                    <p className={tabStyles.panelDescription}>Choose the scene and then fine-tune the amount of movement, density, and glow so the background supports the content instead of overpowering it.</p>
                                </div>
                                <span className={tabStyles.panelBadge}>Public site</span>
                            </div>

                            <div className={tabStyles.visualPreviewStrip}>
                                <div className={tabStyles.visualMetric}>
                                    <span>Density</span>
                                    <strong>{bgDensity}%</strong>
                                </div>
                                <div className={tabStyles.visualMetric}>
                                    <span>Speed</span>
                                    <strong>{bgSpeed}%</strong>
                                </div>
                                <div className={tabStyles.visualMetric}>
                                    <span>Glow</span>
                                    <strong>{bgGlowOpacity}%</strong>
                                </div>
                            </div>

                            <FormField label="Background Style Variant" hint="Choose the visual pattern for the site background">
                                <FormSelect
                                    value={bgStyle}
                                    onChange={(e) => setSettingsData({ ...settingsData, bgStyle: e.target.value })}
                                    options={[
                                        { value: 'plexus', label: 'Plexus (Connected Lines)' },
                                        { value: 'particles', label: 'Dust Particles' },
                                        { value: 'geometry', label: 'Floating Geometry' },
                                        { value: 'aurora', label: 'Aurora Borealis' }
                                    ]}
                                />
                            </FormField>

                            <div className={tabStyles.rangeStack}>
                                <div className={tabStyles.rangeCard}>
                                    <div className={tabStyles.rangeCardHeader}>
                                        <div>
                                            <div className={tabStyles.rangeTitle}>Particle Density</div>
                                            <div className={tabStyles.rangeHint}>Control how full or minimal the scene feels.</div>
                                        </div>
                                        <span className={tabStyles.rangeValue}>{bgDensity}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="100"
                                        value={bgDensity}
                                        onChange={(e) => setSettingsData({ ...settingsData, bgDensity: parseInt(e.target.value, 10) })}
                                        className="ui-range-input"
                                    />
                                </div>

                                <div className={tabStyles.rangeCard}>
                                    <div className={tabStyles.rangeCardHeader}>
                                        <div>
                                            <div className={tabStyles.rangeTitle}>Animation Speed</div>
                                            <div className={tabStyles.rangeHint}>Move slower for calm or faster for a more energetic canvas.</div>
                                        </div>
                                        <span className={tabStyles.rangeValue}>{bgSpeed}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="100"
                                        value={bgSpeed}
                                        onChange={(e) => setSettingsData({ ...settingsData, bgSpeed: parseInt(e.target.value, 10) })}
                                        className="ui-range-input"
                                    />
                                </div>

                                <div className={tabStyles.rangeCard}>
                                    <div className={tabStyles.rangeCardHeader}>
                                        <div>
                                            <div className={tabStyles.rangeTitle}>Glow Intensity</div>
                                            <div className={tabStyles.rangeHint}>Raise this when the scene needs more contrast and visual depth.</div>
                                        </div>
                                        <span className={tabStyles.rangeValue}>{bgGlowOpacity}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={bgGlowOpacity}
                                        onChange={(e) => setSettingsData({ ...settingsData, bgGlowOpacity: parseInt(e.target.value, 10) })}
                                        className="ui-range-input"
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    <aside className={tabStyles.settingsAsideColumn}>
                        <section className={tabStyles.settingsPanel}>
                            <div className={tabStyles.panelHeader}>
                                <div className={tabStyles.panelTitleGroup}>
                                    <span className={tabStyles.panelEyebrow}>Interface Behavior</span>
                                    <h4 className={tabStyles.panelTitle}>Enable the experience defaults you want</h4>
                                    <p className={tabStyles.panelDescription}>These switches affect how interactive, chatty, and persistent the interface feels for both visitors and admins.</p>
                                </div>
                                <span className={tabStyles.panelBadge}>Behavior</span>
                            </div>

                            <div className={tabStyles.toggleGrid}>
                                {toggles.map((toggle) => {
                                    const ToggleIcon = toggle.icon;
                                    return (
                                        <button
                                            key={toggle.key}
                                            type="button"
                                            onClick={toggle.onToggle}
                                            className={`${tabStyles.toggleCard} ${toggle.active ? tabStyles.toggleCardActive : ''}`}
                                        >
                                            <div className={tabStyles.toggleCardCopy}>
                                                <div className={tabStyles.toggleIconBox}>
                                                    <ToggleIcon size={18} />
                                                </div>
                                                <div className={tabStyles.toggleText}>
                                                    <span className={tabStyles.toggleTitle}>{toggle.title}</span>
                                                    <span className={tabStyles.toggleDescription}>{toggle.description}</span>
                                                </div>
                                            </div>
                                            <span className={`${tabStyles.toggleState} ${toggle.active ? tabStyles.toggleStateActive : ''}`}>
                                                {toggle.active ? 'On' : 'Off'}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        <section className={tabStyles.settingsPanel}>
                            <div className={tabStyles.panelHeader}>
                                <div className={tabStyles.panelTitleGroup}>
                                    <span className={tabStyles.panelEyebrow}>Direction</span>
                                    <h4 className={tabStyles.panelTitle}>Visual guidance</h4>
                                    <p className={tabStyles.panelDescription}>Use these quick checks to keep the overall experience expressive without making the portfolio hard to read.</p>
                                </div>
                                <Sparkles size={18} className={tabStyles.sectionIcon} />
                            </div>

                            <ul className={tabStyles.identityChecklist}>
                                <li>Lower density and glow if the content starts fighting the background.</li>
                                <li>Keep sidebar persistence on for longer admin sessions and off for compact browsing.</li>
                                <li>Leave notifications enabled unless you are troubleshooting UI noise.</li>
                            </ul>
                        </section>
                    </aside>
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
