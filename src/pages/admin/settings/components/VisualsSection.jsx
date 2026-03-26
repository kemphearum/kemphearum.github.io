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
    const { t } = useTranslation();
    const defaultVisualSettings = {
        bgStyle: 'plexus',
        bgDensity: 50,
        bgSpeed: 50,
        bgGlowOpacity: 50,
        bgInteractive: true,
        notificationsEnabled: true,
        glassOpacity: 0.82,
        glassBlur: 12,
        glassColor: '#0b1527'
    };
    const bgStyle = settingsData.bgStyle || defaultVisualSettings.bgStyle;
    const bgDensity = settingsData.bgDensity ?? defaultVisualSettings.bgDensity;
    const bgSpeed = settingsData.bgSpeed ?? defaultVisualSettings.bgSpeed;
    const bgGlowOpacity = settingsData.bgGlowOpacity ?? defaultVisualSettings.bgGlowOpacity;
    const bgInteractive = settingsData.bgInteractive ?? defaultVisualSettings.bgInteractive;
    const notificationsEnabled = settingsData.notificationsEnabled ?? defaultVisualSettings.notificationsEnabled;

    const toggles = [
        {
            key: 'bgInteractive',
            title: t('admin.settings.sections.visuals.toggles.interactive.title'),
            description: t('admin.settings.sections.visuals.toggles.interactive.description'),
            active: bgInteractive,
            icon: MousePointer2,
            onToggle: () => setSettingsData({ ...settingsData, bgInteractive: !bgInteractive })
        },
        {
            key: 'notificationsEnabled',
            title: t('admin.settings.sections.visuals.toggles.notifications.title'),
            description: t('admin.settings.sections.visuals.toggles.notifications.description'),
            active: notificationsEnabled,
            icon: BellRing,
            onToggle: () => setSettingsData({ ...settingsData, notificationsEnabled: !notificationsEnabled })
        },
        {
            key: 'sidebarPersistent',
            title: t('admin.settings.sections.visuals.toggles.sidebar.title'),
            description: t('admin.settings.sections.visuals.toggles.sidebar.description'),
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
                        <span className={tabStyles.surfaceEyebrow}>{t('admin.settings.sections.visuals.eyebrow')}</span>
                        <h3 className={tabStyles.surfaceHeadline}>{t('admin.settings.sections.visuals.title')}</h3>
                        <p className={tabStyles.surfaceLead}>{t('admin.settings.sections.visuals.description')}</p>
                    </div>
                    <div className={tabStyles.surfaceMeta}>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{t(`admin.settings.sections.visuals.bgStyles.${bgStyle}`)}</span>
                            <span className={tabStyles.surfaceMetaLabel}>{t('admin.settings.sections.visuals.bgStyle')}</span>
                        </div>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{bgInteractive ? t('admin.settings.sections.visuals.ready') : t('admin.settings.sections.visuals.pending')}</span>
                            <span className={tabStyles.surfaceMetaLabel}>{t('admin.settings.sections.visuals.motionInput')}</span>
                        </div>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{notificationsEnabled ? t('admin.settings.sections.visuals.active') : t('admin.settings.sections.visuals.pending')}</span>
                            <span className={tabStyles.surfaceMetaLabel}>{t('admin.settings.sections.visuals.adminFeedback')}</span>
                        </div>
                    </div>
                </div>

                <div className={tabStyles.settingsSectionGrid}>
                    <div className={tabStyles.settingsPrimaryColumn}>
                        <section className={tabStyles.settingsPanel}>
                            <div className={tabStyles.panelHeader}>
                                <div className={tabStyles.panelTitleGroup}>
                                    <span className={tabStyles.panelEyebrow}>{t('admin.settings.sections.visuals.atmosphere.title')}</span>
                                    <h4 className={tabStyles.panelTitle}>{t('admin.settings.sections.visuals.atmosphere.subtitle')}</h4>
                                    <p className={tabStyles.panelDescription}>{t('admin.settings.sections.visuals.atmosphere.description')}</p>
                                </div>
                                <span className={tabStyles.panelBadge}>{t('admin.settings.sections.visuals.atmosphere.badge')}</span>
                            </div>

                            <div className={tabStyles.visualPreviewStrip}>
                                <div className={tabStyles.visualMetric}>
                                    <span>{t('admin.settings.sections.visuals.fields.density')}</span>
                                    <strong>{bgDensity}%</strong>
                                </div>
                                <div className={tabStyles.visualMetric}>
                                    <span>{t('admin.settings.sections.visuals.fields.speed')}</span>
                                    <strong>{bgSpeed}%</strong>
                                </div>
                                <div className={tabStyles.visualMetric}>
                                    <span>{t('admin.settings.sections.visuals.fields.glow')}</span>
                                    <strong>{bgGlowOpacity}%</strong>
                                </div>
                            </div>

                            <FormField label={t('admin.settings.sections.visuals.fields.variant')} hint={t('admin.settings.sections.visuals.fields.variantHint')}>
                                <FormSelect
                                    value={bgStyle}
                                    onChange={(e) => setSettingsData({ ...settingsData, bgStyle: e.target.value })}
                                    options={[
                                        { value: 'plexus', label: t('admin.settings.sections.visuals.bgStyles.plexus') },
                                        { value: 'particles', label: t('admin.settings.sections.visuals.bgStyles.particles') },
                                        { value: 'geometry', label: t('admin.settings.sections.visuals.bgStyles.geometry') },
                                        { value: 'aurora', label: t('admin.settings.sections.visuals.bgStyles.aurora') }
                                    ]}
                                />
                            </FormField>

                            <div className={tabStyles.rangeStack}>
                                <div className={tabStyles.rangeCard}>
                                    <div className={tabStyles.rangeCardHeader}>
                                        <div>
                                            <div className={tabStyles.rangeTitle}>{t('admin.settings.sections.visuals.fields.particleDensity')}</div>
                                            <div className={tabStyles.rangeHint}>{t('admin.settings.sections.visuals.fields.particleDensityHint')}</div>
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
                                            <div className={tabStyles.rangeTitle}>{t('admin.settings.sections.visuals.fields.animationSpeed')}</div>
                                            <div className={tabStyles.rangeHint}>{t('admin.settings.sections.visuals.fields.animationSpeedHint')}</div>
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
                                            <div className={tabStyles.rangeTitle}>{t('admin.settings.sections.visuals.fields.glowIntensity')}</div>
                                            <div className={tabStyles.rangeHint}>{t('admin.settings.sections.visuals.fields.glowIntensityHint')}</div>
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
                                    <span className={tabStyles.panelEyebrow}>{t('admin.settings.sections.visuals.container.title')}</span>
                                    <h4 className={tabStyles.panelTitle}>{t('admin.settings.sections.visuals.container.subtitle')}</h4>
                                    <p className={tabStyles.panelDescription}>{t('admin.settings.sections.visuals.container.description')}</p>
                                </div>
                                <span className={tabStyles.panelBadge}>{t('admin.settings.sections.visuals.container.badge')}</span>
                            </div>

                            <div className={tabStyles.rangeStack}>
                                <div className={tabStyles.rangeCard}>
                                    <div className={tabStyles.rangeCardHeader}>
                                        <div>
                                            <div className={tabStyles.rangeTitle}>{t('admin.settings.sections.visuals.fields.glassOpacity')}</div>
                                            <div className={tabStyles.rangeHint}>{t('admin.settings.sections.visuals.fields.glassOpacityHint')}</div>
                                        </div>
                                        <span className={tabStyles.rangeValue}>{Math.round((settingsData.glassOpacity ?? defaultVisualSettings.glassOpacity) * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={Math.round((settingsData.glassOpacity ?? defaultVisualSettings.glassOpacity) * 100)}
                                        onChange={(e) => setSettingsData({ ...settingsData, glassOpacity: parseFloat((e.target.value / 100).toFixed(2)) })}
                                        className="ui-range-input"
                                    />
                                </div>

                                <div className={tabStyles.rangeCard}>
                                    <div className={tabStyles.rangeCardHeader}>
                                        <div>
                                            <div className={tabStyles.rangeTitle}>{t('admin.settings.sections.visuals.fields.backdropBlur')}</div>
                                            <div className={tabStyles.rangeHint}>{t('admin.settings.sections.visuals.fields.backdropBlurHint')}</div>
                                        </div>
                                        <span className={tabStyles.rangeValue}>{settingsData.glassBlur ?? defaultVisualSettings.glassBlur}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="40"
                                        value={settingsData.glassBlur ?? defaultVisualSettings.glassBlur}
                                        onChange={(e) => setSettingsData({ ...settingsData, glassBlur: parseInt(e.target.value, 10) })}
                                        className="ui-range-input"
                                    />
                                </div>

                                <div className={tabStyles.rangeCard}>
                                    <div className={tabStyles.rangeCardHeader}>
                                        <div>
                                            <div className={tabStyles.rangeTitle}>{t('admin.settings.sections.visuals.fields.surfaceBaseColor')}</div>
                                            <div className={tabStyles.rangeHint}>{t('admin.settings.sections.visuals.fields.surfaceBaseColorHint')}</div>
                                        </div>
                                        <div className={tabStyles.colorInputWrapper}>
                                            <span className={tabStyles.colorValue}>{settingsData.glassColor || defaultVisualSettings.glassColor}</span>
                                            <input
                                                type="color"
                                                value={settingsData.glassColor || defaultVisualSettings.glassColor}
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
                                    <span className={tabStyles.panelEyebrow}>{t('admin.settings.sections.visuals.behavior.title')}</span>
                                    <h4 className={tabStyles.panelTitle}>{t('admin.settings.sections.visuals.behavior.subtitle')}</h4>
                                    <p className={tabStyles.panelDescription}>{t('admin.settings.sections.visuals.behavior.description')}</p>
                                </div>
                                <span className={tabStyles.panelBadge}>{t('admin.settings.sections.visuals.behavior.badge')}</span>
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
                                                {toggle.active ? t('admin.settings.sections.visuals.active') : t('admin.settings.sections.visuals.pending')}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        <section className={tabStyles.settingsPanel}>
                            <div className={tabStyles.panelHeader}>
                                <div className={tabStyles.panelTitleGroup}>
                                    <span className={tabStyles.panelEyebrow}>{t('admin.settings.sections.visuals.guidance.title')}</span>
                                    <h4 className={tabStyles.panelTitle}>{t('admin.settings.sections.visuals.guidance.subtitle')}</h4>
                                    <p className={tabStyles.panelDescription}>{t('admin.settings.sections.visuals.guidance.description')}</p>
                                </div>
                                <Sparkles size={18} className={tabStyles.sectionIcon} />
                            </div>

                            <ul className={tabStyles.identityChecklist}>
                                {t('admin.settings.sections.visuals.checklist', { returnObjects: true }).map((item, id) => (
                                    <li key={id}>{item}</li>
                                ))}
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
                        <Save size={18} /> {t('admin.settings.sections.visuals.save')}
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default VisualsSection;
