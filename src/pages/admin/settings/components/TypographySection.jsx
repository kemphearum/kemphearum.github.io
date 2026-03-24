import { Type, RefreshCw, PlusCircle, Minus, Plus, Save } from 'lucide-react';
import { Button } from '../../../../shared/components/ui';
import FormSelect from '../../components/FormSelect';
import FormField from '../../components/FormField';
import tabStyles from '../SettingsTab.module.scss';

const TypographySection = ({
    settingsData,
    setSettingsData,
    metadata,
    typographyMetadata,
    handleInitializeMetadata,
    handleSizeAdjust,
    fontCSS,
    onSave,
    loading
}) => {
    const {
        fontOptions = [],
        sizeOptions = [],
        weightOptions = [],
        fontCategories = [],
        presets = []
    } = typographyMetadata || {};

    const size = settingsData?.fontSize || 'default';
    const adminOverride = settingsData?.adminFontOverride ?? true;

    const getFont = (field) => settingsData[field] || 'inter';
    const getFontSize = (field, fallback) => settingsData[field] || fallback;

    const resetTypography = () => {
        const resetData = { ...settingsData };
        fontCategories.forEach((category) => {
            resetData[category.field] = 'inter';
            resetData[category.sizeField] = category.defaultSize;
            resetData[category.weightField] = category.defaultWeight;
            resetData[category.italicField] = false;
        });
        setSettingsData(resetData);
    };

    return (
        <form onSubmit={onSave} className={tabStyles.tabContentFadeIn}>
            <div className="ui-card">
                <div className={tabStyles.surfaceHeader}>
                    <div className={tabStyles.surfaceCopy}>
                        <span className={tabStyles.surfaceEyebrow}>Typography System</span>
                        <h3 className={tabStyles.surfaceHeadline}>Tune the public-facing type hierarchy while keeping the admin workspace readable.</h3>
                        <p className={tabStyles.surfaceLead}>Presets, base sizing, and role-level controls now sit next to live previews so decisions feel faster and more confident.</p>
                    </div>
                    <div className={tabStyles.surfaceMeta}>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{fontCategories.length}</span>
                            <span className={tabStyles.surfaceMetaLabel}>Type Roles</span>
                            <span className={tabStyles.surfaceMetaHint}>Logo, nav, body, footer, and admin surfaces</span>
                        </div>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{presets.length}</span>
                            <span className={tabStyles.surfaceMetaLabel}>Quick Presets</span>
                            <span className={tabStyles.surfaceMetaHint}>Apply a brand direction in one click</span>
                        </div>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{adminOverride ? 'Inter' : 'Custom'}</span>
                            <span className={tabStyles.surfaceMetaLabel}>Admin Font Mode</span>
                            <span className={tabStyles.surfaceMetaHint}>Keep dashboard text stable while styling the public site</span>
                        </div>
                    </div>
                </div>

                <section className={tabStyles.settingsPanel}>
                    <div className={tabStyles.typographyHeader}>
                        <div className={tabStyles.typographyOverview}>
                            <div className={tabStyles.sectionTitle}>
                                <Type size={20} className={tabStyles.sectionIcon} />
                                <span className={tabStyles.sectionTitleText}>Global typography controls</span>
                            </div>
                            <p className={tabStyles.surfaceLead}>Set the base scale, initialize metadata if needed, and reset the whole system when you want a clean starting point.</p>
                        </div>

                        <div className={tabStyles.typographyControls}>
                            <FormField label="Base Size">
                                <FormSelect
                                    value={size}
                                    onChange={(e) => setSettingsData({ ...settingsData, fontSize: e.target.value })}
                                    options={sizeOptions}
                                    className={tabStyles.baseSizeSelect}
                                />
                            </FormField>
                            <div className={tabStyles.buttonGroupMobileStack}>
                                {!metadata && (
                                    <Button
                                        type="button"
                                        onClick={handleInitializeMetadata}
                                        variant="secondary"
                                        className={tabStyles.typographyHelperBtn}
                                        title="One-time push of typography defaults to database"
                                    >
                                        <PlusCircle size={14} />
                                        Setup Metadata
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={resetTypography}
                                    className={tabStyles.typographyHelperBtn}
                                >
                                    <RefreshCw size={14} />
                                    Reset to Defaults
                                </Button>
                            </div>
                        </div>
                    </div>

                    {presets.length > 0 && (
                        <div className={tabStyles.presetsWrapper}>
                            <div className={tabStyles.typographyLabel}>Quick presets</div>
                            <div className={tabStyles.presetsGrid}>
                                {presets.map((preset) => (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => {
                                            setSettingsData({
                                                ...settingsData,
                                                ...preset.config
                                            });
                                        }}
                                        className={tabStyles.presetCard}
                                    >
                                        <div className={tabStyles.presetHeader}>
                                            <span className={tabStyles.presetIcon}>{preset.icon}</span>
                                            <span className={tabStyles.presetLabel}>{preset.label}</span>
                                        </div>
                                        <div className={tabStyles.presetDesc}>{preset.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                <section className={tabStyles.settingsPanel}>
                    <div className={tabStyles.panelHeader}>
                        <div className={tabStyles.panelTitleGroup}>
                            <span className={tabStyles.panelEyebrow}>Role Controls</span>
                            <h4 className={tabStyles.panelTitle}>Fine-tune every text role</h4>
                            <p className={tabStyles.panelDescription}>Each role can choose its own family, weight, italic state, and size while keeping the overall system organized.</p>
                        </div>
                        <span className={tabStyles.panelBadge}>{fontCategories.length} roles</span>
                    </div>

                    <div className={tabStyles.fontGrid}>
                        {fontCategories.map((category) => (
                            <div key={category.field} className={tabStyles.fontCard}>
                                <div className={tabStyles.fontCardHeader}>
                                    <div className={tabStyles.titleGroup}>
                                        <span>{category.icon}</span>
                                        <span>{category.label}</span>
                                    </div>
                                    <span className={tabStyles.hint}>{category.hint}</span>
                                </div>

                                <FormField label="Font Family" hint={category.hint}>
                                    <FormSelect
                                        value={getFont(category.field)}
                                        onChange={(e) => setSettingsData({ ...settingsData, [category.field]: e.target.value })}
                                        options={fontOptions}
                                    />
                                </FormField>

                                <div className={tabStyles.formGrid}>
                                    <FormField label="Weight">
                                        <FormSelect
                                            value={settingsData[category.weightField] || category.defaultWeight}
                                            onChange={(e) => setSettingsData({ ...settingsData, [category.weightField]: e.target.value })}
                                            options={weightOptions}
                                        />
                                    </FormField>

                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setSettingsData({ ...settingsData, [category.italicField]: !settingsData[category.italicField] })}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                setSettingsData({ ...settingsData, [category.italicField]: !settingsData[category.italicField] });
                                            }
                                        }}
                                        className={`${tabStyles.italicToggle} ${settingsData[category.italicField] ? tabStyles.active : ''}`}
                                    >
                                        <span className={tabStyles.italicIcon}>I</span>
                                        Italic
                                    </div>
                                </div>

                                <FormField label="Size (e.g. 1.2rem)">
                                    <div className={tabStyles.sizeStepper}>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleSizeAdjust(category.sizeField, settingsData[category.sizeField] || category.defaultSize, false)}
                                        >
                                            <Minus size={14} />
                                        </Button>
                                        <input
                                            type="text"
                                            placeholder={category.defaultSize}
                                            value={settingsData[category.sizeField] || ''}
                                            onChange={(e) => setSettingsData({ ...settingsData, [category.sizeField]: e.target.value })}
                                            title="Font Size (e.g. 1.2rem, 18px)"
                                            className={tabStyles.stepperInput}
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleSizeAdjust(category.sizeField, settingsData[category.sizeField] || category.defaultSize, true)}
                                        >
                                            <Plus size={14} />
                                        </Button>
                                    </div>
                                </FormField>
                            </div>
                        ))}
                    </div>
                </section>
