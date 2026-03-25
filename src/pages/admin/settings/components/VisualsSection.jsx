import { BellRing, MousePointer2, PanelLeft, Save, Sparkles } from 'lucide-react';
import { Button } from '../../../../shared/components/ui';
import FormSelect from '../../components/FormSelect';
import FormField from '../../components/FormField';
import tabStyles from '../SettingsTab.module.scss';
import { useTranslation } from '../../../../hooks/useTranslation';

const VisualsSection = ({
    settingsData,
    setSettingsData,
    sidebarPersistent,
    setSidebarPersistent,
    onSave,
    loading
}) => {
    const { language } = useTranslation();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
    const bgStyle = settingsData.bgStyle || 'plexus';
    const bgDensity = settingsData.bgDensity ?? 50;
    const bgSpeed = settingsData.bgSpeed ?? 50;
    const bgGlowOpacity = settingsData.bgGlowOpacity ?? 50;
    const bgInteractive = settingsData.bgInteractive ?? true;
    const notificationsEnabled = settingsData.notificationsEnabled ?? true;

    const toggles = [
        {
            key: 'bgInteractive',
            title: tr('Interactive mouse effect', 'ប្រតិកម្មតាមកណ្ដុរ'),
            description: tr('Let particles or shapes respond to pointer movement for a more tactile public experience.', 'ឱ្យភាគល្អិតឬរាងឆ្លើយតបនឹងចលនាកណ្ដុរ ដើម្បីបង្កើនអន្តរកម្ម។'),
            active: bgInteractive,
            icon: MousePointer2,
            onToggle: () => setSettingsData({ ...settingsData, bgInteractive: !bgInteractive })
        },
        {
            key: 'notificationsEnabled',
            title: tr('Notification alerts', 'ការជូនដំណឹង'),
            description: tr('Show toast feedback in the admin interface for save, delete, and sync actions.', 'បង្ហាញការជូនដំណឹង toast លើ Admin សម្រាប់សកម្មភាពរក្សាទុក លុប និង sync។'),
            active: notificationsEnabled,
            icon: BellRing,
            onToggle: () => setSettingsData({ ...settingsData, notificationsEnabled: !notificationsEnabled })
        },
        {
            key: 'sidebarPersistent',
            title: tr('Persistent admin sidebar', 'Sidebar Admin ថេរ'),
            description: tr('Keep the navigation expanded so the dashboard feels stable during longer editing sessions.', 'រក្សា navigation ឱ្យបើកជានិច្ច ដើម្បីឱ្យ dashboard មានស្ថិរភាពពេលកែប្រែយូរ។'),
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
                        <span className={tabStyles.surfaceEyebrow}>{tr('Visual Experience', 'បទពិសោធន៍រូបភាព')}</span>
                        <h3 className={tabStyles.surfaceHeadline}>{tr('Tune the atmosphere, motion, and UI feedback of the portfolio and admin dashboard.', 'កែតម្រូវបរិយាកាស ចលនា និងការឆ្លើយតប UI របស់ Portfolio និង Dashboard Admin។')}</h3>
                        <p className={tabStyles.surfaceLead}>{tr('Background energy and interface behavior are grouped separately now, so it is easier to shape the site mood without losing operational clarity.', 'ការកំណត់ផ្ទៃខាងក្រោយ និងឥរិយាបថ UI ត្រូវបានបំបែកច្បាស់ ដើម្បីងាយកំណត់អារម្មណ៍គេហទំព័រ។')}</p>
                    </div>
                    <div className={tabStyles.surfaceMeta}>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{bgStyle}</span>
                            <span className={tabStyles.surfaceMetaLabel}>{tr('Background Style', 'រចនាប័ទ្មផ្ទៃខាងក្រោយ')}</span>
                            <span className={tabStyles.surfaceMetaHint}>{tr('Current visual system used on the public site', 'ប្រព័ន្ធរូបភាពបច្ចុប្បន្នលើគេហទំព័រសាធារណៈ')}</span>
                        </div>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{bgInteractive ? tr('On', 'បើក') : tr('Off', 'បិទ')}</span>
                            <span className={tabStyles.surfaceMetaLabel}>{tr('Motion Input', 'បញ្ចូលចលនា')}</span>
                            <span className={tabStyles.surfaceMetaHint}>{tr('Pointer interaction for background effects', 'អន្តរកម្ម pointer សម្រាប់បែបផែនផ្ទៃខាងក្រោយ')}</span>
                        </div>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{notificationsEnabled ? tr('Enabled', 'បើក') : tr('Muted', 'បិទ')}</span>
                            <span className={tabStyles.surfaceMetaLabel}>{tr('Admin Feedback', 'មតិឆ្លើយតប Admin')}</span>
                            <span className={tabStyles.surfaceMetaHint}>{tr('Toast notifications for system actions', 'ការជូនដំណឹង toast សម្រាប់សកម្មភាពប្រព័ន្ធ')}</span>
                        </div>
                    </div>
                </div>

                <div className={tabStyles.settingsSectionGrid}>
                    <div className={tabStyles.settingsPrimaryColumn}>
                        <section className={tabStyles.settingsPanel}>
                            <div className={tabStyles.panelHeader}>
                                <div className={tabStyles.panelTitleGroup}>
                                    <span className={tabStyles.panelEyebrow}>{tr('Background Atmosphere', 'បរិយាកាសផ្ទៃខាងក្រោយ')}</span>
                                    <h4 className={tabStyles.panelTitle}>{tr('Set the visual mood of the public site', 'កំណត់អារម្មណ៍រូបភាពសម្រាប់គេហទំព័រសាធារណៈ')}</h4>
                                    <p className={tabStyles.panelDescription}>{tr('Choose the scene and then fine-tune the amount of movement, density, and glow so the background supports the content instead of overpowering it.', 'ជ្រើសរើសស្ទីល ហើយកែចលនា ភាពដិត និងពន្លឺ ដើម្បីឱ្យផ្ទៃខាងក្រោយគាំទ្រខ្លឹមសារ។')}</p>
                                </div>
                                <span className={tabStyles.panelBadge}>{tr('Public site', 'គេហទំព័រសាធារណៈ')}</span>
                            </div>

                            <div className={tabStyles.visualPreviewStrip}>
                                <div className={tabStyles.visualMetric}>
                                    <span>{tr('Density', 'ភាពដិត')}</span>
                                    <strong>{bgDensity}%</strong>
                                </div>
                                <div className={tabStyles.visualMetric}>
                                    <span>{tr('Speed', 'ល្បឿន')}</span>
                                    <strong>{bgSpeed}%</strong>
                                </div>
                                <div className={tabStyles.visualMetric}>
                                    <span>{tr('Glow', 'ពន្លឺ')}</span>
                                    <strong>{bgGlowOpacity}%</strong>
                                </div>
                            </div>

                            <FormField label={tr('Background Style Variant', 'ជម្រើសរចនាប័ទ្មផ្ទៃខាងក្រោយ')} hint={tr('Choose the visual pattern for the site background', 'ជ្រើសរើសលំនាំរូបភាពសម្រាប់ផ្ទៃខាងក្រោយ')}>
                                <FormSelect
                                    value={bgStyle}
                                    onChange={(e) => setSettingsData({ ...settingsData, bgStyle: e.target.value })}
                                    options={[
                                        { value: 'plexus', label: tr('Plexus (Connected Lines)', 'Plexus (បន្ទាត់ភ្ជាប់គ្នា)') },
                                        { value: 'particles', label: tr('Dust Particles', 'ភាគល្អិត') },
                                        { value: 'geometry', label: tr('Floating Geometry', 'រាងអណ្តែត') },
                                        { value: 'aurora', label: tr('Aurora Borealis', 'Aurora') }
                                    ]}
                                />
                            </FormField>

                            <div className={tabStyles.rangeStack}>
                                <div className={tabStyles.rangeCard}>
                                    <div className={tabStyles.rangeCardHeader}>
                                        <div>
                                            <div className={tabStyles.rangeTitle}>{tr('Particle Density', 'ដង់ស៊ីតេភាគល្អិត')}</div>
                                            <div className={tabStyles.rangeHint}>{tr('Control how full or minimal the scene feels.', 'គ្រប់គ្រងកម្រិតកកកុញ ឬទំនេរនៃឈុត។')}</div>
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
                                            <div className={tabStyles.rangeTitle}>{tr('Animation Speed', 'ល្បឿនចលនា')}</div>
                                            <div className={tabStyles.rangeHint}>{tr('Move slower for calm or faster for a more energetic canvas.', 'បន្ថយល្បឿនសម្រាប់ភាពស្ងប់ ឬបន្ថែមល្បឿនសម្រាប់ភាពរស់រវើក។')}</div>
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
                                            <div className={tabStyles.rangeTitle}>{tr('Glow Intensity', 'កម្រិតពន្លឺ')}</div>
                                            <div className={tabStyles.rangeHint}>{tr('Raise this when the scene needs more contrast and visual depth.', 'បន្ថែមតម្លៃនេះ ពេលត្រូវការភាពផ្ទុយ និងជម្រៅរូបភាព។')}</div>
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
                        
                        <section className={tabStyles.settingsPanel}>
                            <div className={tabStyles.panelHeader}>
                                <div className={tabStyles.panelTitleGroup}>
                                    <span className={tabStyles.panelEyebrow}>{tr('Container Appearance', 'រូបរាងកុងតឺន័រ')}</span>
                                    <h4 className={tabStyles.panelTitle}>{tr('Glassmorphism & Surfaces', 'បែបកញ្ចក់ និងផ្ទៃ')}</h4>
                                    <p className={tabStyles.panelDescription}>{tr('Control the transparency, blur, and base color of UI containers across the entire portfolio and admin dashboard.', 'គ្រប់គ្រងតម្លាភាព ភាពព្រាល និងពណ៌មូលដ្ឋាននៃកុងតឺន័រ UI ទូទាំង Portfolio និង Dashboard Admin។')}</p>
                                </div>
                                <span className={tabStyles.panelBadge}>{tr('Shared UI', 'UI រួម')}</span>
                            </div>

                            <div className={tabStyles.rangeStack}>
                                <div className={tabStyles.rangeCard}>
                                    <div className={tabStyles.rangeCardHeader}>
                                        <div>
                                            <div className={tabStyles.rangeTitle}>{tr('Glass Opacity', 'តម្លាភាពកញ្ចក់')}</div>
                                            <div className={tabStyles.rangeHint}>{tr('Control how translucent the containers appear.', 'គ្រប់គ្រងកម្រិតថ្លានៃកុងតឺន័រ។')}</div>
                                        </div>
                                        <span className={tabStyles.rangeValue}>{Math.round((settingsData.glassOpacity ?? 0.82) * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={Math.round((settingsData.glassOpacity ?? 0.82) * 100)}
                                        onChange={(e) => setSettingsData({ ...settingsData, glassOpacity: parseFloat((e.target.value / 100).toFixed(2)) })}
                                        className="ui-range-input"
                                    />
                                </div>

                                <div className={tabStyles.rangeCard}>
                                    <div className={tabStyles.rangeCardHeader}>
                                        <div>
                                            <div className={tabStyles.rangeTitle}>{tr('Backdrop Blur', 'ភាពព្រាលផ្ទៃក្រោយ')}</div>
                                            <div className={tabStyles.rangeHint}>{tr('Set the intensity of the glass blur effect.', 'កំណត់កម្រិតព្រាលនៃបែបផែនកញ្ចក់។')}</div>
                                        </div>
                                        <span className={tabStyles.rangeValue}>{settingsData.glassBlur ?? 12}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="40"
                                        value={settingsData.glassBlur ?? 12}
                                        onChange={(e) => setSettingsData({ ...settingsData, glassBlur: parseInt(e.target.value, 10) })}
                                        className="ui-range-input"
                                    />
                                </div>

                                <div className={tabStyles.rangeCard}>
                                    <div className={tabStyles.rangeCardHeader}>
                                        <div>
                                            <div className={tabStyles.rangeTitle}>{tr('Surface Base Color', 'ពណ៌មូលដ្ឋានផ្ទៃ')}</div>
                                            <div className={tabStyles.rangeHint}>{tr('The primary hue for containers and cards.', 'ពណ៌ចម្បងសម្រាប់កុងតឺន័រ និងកាត។')}</div>
                                        </div>
                                        <div className={tabStyles.colorInputWrapper}>
                                            <span className={tabStyles.colorValue}>{settingsData.glassColor || '#0b1527'}</span>
                                            <input
                                                type="color"
                                                value={settingsData.glassColor || '#0b1527'}
                                                onChange={(e) => setSettingsData({ ...settingsData, glassColor: e.target.value })}
                                                className={tabStyles.colorInput}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <aside className={tabStyles.settingsAsideColumn}>
                        <section className={tabStyles.settingsPanel}>
                            <div className={tabStyles.panelHeader}>
                                <div className={tabStyles.panelTitleGroup}>
                                    <span className={tabStyles.panelEyebrow}>{tr('Interface Behavior', 'ឥរិយាបថផ្ទៃប្រើប្រាស់')}</span>
                                    <h4 className={tabStyles.panelTitle}>{tr('Enable the experience defaults you want', 'បើករបៀបបទពិសោធន៍លំនាំដើមដែលអ្នកចង់បាន')}</h4>
                                    <p className={tabStyles.panelDescription}>{tr('These switches affect how interactive, chatty, and persistent the interface feels for both visitors and admins.', 'ស្វិតទាំងនេះប៉ះពាល់ដល់អន្តរកម្ម ការជូនដំណឹង និងភាពថេររបស់ UI សម្រាប់ភ្ញៀវ និង Admin។')}</p>
                                </div>
                                <span className={tabStyles.panelBadge}>{tr('Behavior', 'ឥរិយាបថ')}</span>
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
                                                {toggle.active ? tr('On', 'បើក') : tr('Off', 'បិទ')}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        <section className={tabStyles.settingsPanel}>
                            <div className={tabStyles.panelHeader}>
                                <div className={tabStyles.panelTitleGroup}>
                                    <span className={tabStyles.panelEyebrow}>{tr('Direction', 'ទិសដៅ')}</span>
                                    <h4 className={tabStyles.panelTitle}>{tr('Visual guidance', 'ការណែនាំផ្នែករូបភាព')}</h4>
                                    <p className={tabStyles.panelDescription}>{tr('Use these quick checks to keep the overall experience expressive without making the portfolio hard to read.', 'ប្រើការត្រួតពិនិត្យរហ័សទាំងនេះ ដើម្បីរក្សាបទពិសោធន៍ឱ្យទាក់ទាញ និងងាយអាន។')}</p>
                                </div>
                                <Sparkles size={18} className={tabStyles.sectionIcon} />
                            </div>

                            <ul className={tabStyles.identityChecklist}>
                                <li>{tr('Lower density and glow if the content starts fighting the background.', 'បន្ថយភាពដិត និងពន្លឺ ប្រសិនបើខ្លឹមសារមើលពិបាកលើផ្ទៃខាងក្រោយ។')}</li>
                                <li>{tr('Keep sidebar persistence on for longer admin sessions and off for compact browsing.', 'បើក sidebar ថេរពេលធ្វើការយូរ ហើយបិទពេលចង់មើលបែបតូច។')}</li>
                                <li>{tr('Leave notifications enabled unless you are troubleshooting UI noise.', 'ទុកការជូនដំណឹងឱ្យបើក លុះត្រាតែអ្នកកំពុងដោះស្រាយបញ្ហា UI។')}</li>
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
                        <Save size={18} /> {tr('Save Visual Settings', 'រក្សាទុកការកំណត់រូបភាព')}
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default VisualsSection;
