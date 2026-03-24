import { Type, RefreshCw, PlusCircle, Minus, Plus, Save } from 'lucide-react';
import { Button } from '../../../../shared/components/ui';
import FormSelect from '../../components/FormSelect';
import FormField from '../../components/FormField';
import tabStyles from '../SettingsTab.module.scss';
import { useTranslation } from '../../../../hooks/useTranslation';

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
    const { language } = useTranslation();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);

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
                        <span className={tabStyles.surfaceEyebrow}>{tr('Typography System', 'ប្រព័ន្ធអក្សរ')}</span>
                        <h3 className={tabStyles.surfaceHeadline}>{tr('Tune the public-facing type hierarchy while keeping the admin workspace readable.', 'កែតម្រូវលំដាប់អក្សរសម្រាប់សាធារណៈ ខណៈរក្សាផ្ទាំងគ្រប់គ្រងឱ្យអានងាយ។')}</h3>
                        <p className={tabStyles.surfaceLead}>{tr('Presets, base sizing, and role-level controls now sit next to live previews so decisions feel faster and more confident.', 'Preset ទំហំមូលដ្ឋាន និងការគ្រប់គ្រងតាមតួនាទី ត្រូវបានរៀបជាមួយការមើលជាមុនផ្ទាល់។')}</p>
                    </div>
                    <div className={tabStyles.surfaceMeta}>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{fontCategories.length}</span>
                            <span className={tabStyles.surfaceMetaLabel}>{tr('Type Roles', 'តួនាទីអក្សរ')}</span>
                            <span className={tabStyles.surfaceMetaHint}>{tr('Logo, nav, body, footer, and admin surfaces', 'ឡូហ្គោ ម៉ឺនុយ ខ្លឹមសារ Footer និងផ្ទាំង Admin')}</span>
                        </div>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{presets.length}</span>
                            <span className={tabStyles.surfaceMetaLabel}>{tr('Quick Presets', 'Preset រហ័ស')}</span>
                            <span className={tabStyles.surfaceMetaHint}>{tr('Apply a brand direction in one click', 'អនុវត្តទិសដៅម៉ាកដោយចុចម្តង')}</span>
                        </div>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{adminOverride ? tr('Inter', 'Inter') : tr('Custom', 'ផ្ទាល់ខ្លួន')}</span>
                            <span className={tabStyles.surfaceMetaLabel}>{tr('Admin Font Mode', 'របៀបអក្សរ Admin')}</span>
                            <span className={tabStyles.surfaceMetaHint}>{tr('Keep dashboard text stable while styling the public site', 'រក្សាអក្សរផ្ទាំងគ្រប់គ្រងឱ្យថេរ ខណៈកែរចនាសាធារណៈ')}</span>
                        </div>
                    </div>
                </div>

                <section className={tabStyles.settingsPanel}>
                    <div className={tabStyles.typographyHeader}>
                        <div className={tabStyles.typographyOverview}>
                            <div className={tabStyles.sectionTitle}>
                                <Type size={20} className={tabStyles.sectionIcon} />
                                <span className={tabStyles.sectionTitleText}>{tr('Global typography controls', 'ការគ្រប់គ្រងអក្សរទូទាំងប្រព័ន្ធ')}</span>
                            </div>
                            <p className={tabStyles.surfaceLead}>{tr('Set the base scale, initialize metadata if needed, and reset the whole system when you want a clean starting point.', 'កំណត់មាត្រដ្ឋានមូលដ្ឋាន ចាប់ផ្តើមមេតាដាតា និងកំណត់ឡើងវិញនៅពេលចង់ចាប់ផ្តើមស្អាត។')}</p>
                        </div>

                        <div className={tabStyles.typographyControls}>
                            <FormField label={tr('Base Size', 'ទំហំមូលដ្ឋាន')}>
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
                                        title={tr('One-time push of typography defaults to database', 'បញ្ចូលតម្លៃលំនាំដើម Typography ទៅមូលដ្ឋានទិន្នន័យម្តង')}
                                    >
                                        <PlusCircle size={14} />
                                        {tr('Setup Metadata', 'កំណត់ Metadata')}
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={resetTypography}
                                    className={tabStyles.typographyHelperBtn}
                                >
                                    <RefreshCw size={14} />
                                    {tr('Reset to Defaults', 'កំណត់ឡើងវិញទៅលំនាំដើម')}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {presets.length > 0 && (
                        <div className={tabStyles.presetsWrapper}>
                            <div className={tabStyles.typographyLabel}>{tr('Quick presets', 'Preset រហ័ស')}</div>
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
                            <span className={tabStyles.panelEyebrow}>{tr('Role Controls', 'ការគ្រប់គ្រងតួនាទី')}</span>
                            <h4 className={tabStyles.panelTitle}>{tr('Fine-tune every text role', 'កែតម្រូវតួនាទីអក្សរនីមួយៗ')}</h4>
                            <p className={tabStyles.panelDescription}>{tr('Each role can choose its own family, weight, italic state, and size while keeping the overall system organized.', 'តួនាទីនីមួយៗអាចជ្រើសពុម្ពអក្សរ ទម្ងន់ Italic និងទំហំដោយរក្សាប្រព័ន្ធឱ្យរៀបរយ។')}</p>
                        </div>
                        <span className={tabStyles.panelBadge}>{fontCategories.length} {tr('roles', 'តួនាទី')}</span>
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

                                <FormField label={tr('Font Family', 'គ្រួសារអក្សរ')} hint={category.hint}>
                                    <FormSelect
                                        value={getFont(category.field)}
                                        onChange={(e) => setSettingsData({ ...settingsData, [category.field]: e.target.value })}
                                        options={fontOptions}
                                    />
                                </FormField>

                                <div className={tabStyles.formGrid}>
                                    <FormField label={tr('Weight', 'ទម្ងន់')}>
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
                                        {tr('Italic', 'ទ្រេត')}
                                    </div>
                                </div>

                                <FormField label={tr('Size (e.g. 1.2rem)', 'ទំហំ (ឧ. 1.2rem)')}>
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
                                            title={tr('Font Size (e.g. 1.2rem, 18px)', 'ទំហំអក្សរ (ឧ. 1.2rem, 18px)')}
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

                <section className={tabStyles.settingsPanel}>
                    <div className={tabStyles.panelHeader}>
                        <div className={tabStyles.panelTitleGroup}>
                            <span className={tabStyles.panelEyebrow}>{tr('Preview Studio', 'កន្លែងមើលជាមុន')}</span>
                            <h4 className={tabStyles.panelTitle}>{tr('Validate typography before saving', 'ពិនិត្យ Typography មុនរក្សាទុក')}</h4>
                            <p className={tabStyles.panelDescription}>{tr('Preview how the type system behaves across navigation, content, footer, and admin surfaces.', 'មើលមុនពីរបៀបដែលប្រព័ន្ធអក្សរបង្ហាញលើម៉ឺនុយ ខ្លឹមសារ Footer និង Admin។')}</p>
                        </div>
                        <span className={tabStyles.panelBadge}>{tr('Live render', 'បង្ហាញផ្ទាល់')}</span>
                    </div>

                    <div
                        className={tabStyles.adminOverrideCard}
                        onClick={() => setSettingsData({ ...settingsData, adminFontOverride: !adminOverride })}
                    >
                        <input type="checkbox" checked={adminOverride} readOnly />
                        <div className={tabStyles.toggleContent}>
                            <div className={tabStyles.title}>{tr('Use Inter for the admin panel', 'ប្រើ Inter សម្រាប់ផ្ទាំង Admin')}</div>
                            <div className={tabStyles.desc}>{tr('Keep dashboard text in Inter regardless of the public typography choices above.', 'រក្សាអក្សរផ្ទាំងគ្រប់គ្រងជា Inter មិនថាជម្រើសសាធារណៈយ៉ាងណាក៏ដោយ។')}</div>
                        </div>
                    </div>

                    <div className={tabStyles.previewSection}>
                        <div className={tabStyles.previewHeaderBlock}>
                            <div className={tabStyles.previewHeaderLabel}>{tr('Live Typography Preview', 'មើល Typography ផ្ទាល់')}</div>
                            <div className={tabStyles.previewHeaderText}>{tr('These previews mirror your real site regions so hierarchy issues are easier to catch before publishing.', 'ការមើលមុននេះស្រដៀងតំបន់ពិតនៃគេហទំព័រ ដើម្បីងាយរកបញ្ហាលំដាប់អក្សរមុនផ្សាយ។')}</div>
                        </div>
                    </div>

                    <div className={tabStyles.livePreviewCard}>
                        <div className={tabStyles.livePreviewTitleBar}>
                            <span>{tr('SITE HEADER', 'ក្បាលគេហទំព័រ')}</span>
                            <span className={tabStyles.hint}>{tr('Responsive preview', 'មើលជាមុនតាមទំហំអេក្រង់')}</span>
                        </div>
                        <div className={tabStyles.livePreviewContent}>
                            <div className={tabStyles.livePreviewLogo} style={{
                                fontFamily: fontCSS[getFont('fontLogo')],
                                fontWeight: settingsData.fontLogoWeight || 700,
                                fontStyle: settingsData.fontLogoItalic ? 'italic' : 'normal',
                                fontSize: getFontSize('fontLogoSize', '1.25rem')
                            }}>
                                {settingsData.logoHighlight || 'KEM'}<span>{settingsData.logoText || 'PHEARUM'}</span>
                            </div>
                            <div className={tabStyles.livePreviewNav}>
                                {[tr('Home', 'ទំព័រដើម'), tr('Blog', 'ប្លុក')].map((item) => (
                                    <span key={item} className={tabStyles.livePreviewNavItem} style={{
                                        fontFamily: fontCSS[getFont('fontNav')],
                                        fontWeight: settingsData.fontNavWeight || 600,
                                        fontStyle: settingsData.fontNavItalic ? 'italic' : 'normal',
                                        fontSize: getFontSize('fontNavSize', '0.75rem'),
                                        color: item === tr('Home', 'ទំព័រដើម') ? 'var(--primary-color)' : 'var(--text-secondary)'
                                    }}>{item}</span>
                                ))}
                                <div className={tabStyles.livePreviewThemeToggle}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={tabStyles.livePreviewCard}>
                        <div className={tabStyles.livePreviewTitleBar}>{tr('MAIN CONTENT & HERO', 'ខ្លឹមសារចម្បង និង Hero')}</div>
                        <div className={tabStyles.livePreviewHero}>
                            <div className={tabStyles.livePreviewDisplay} style={{
                                fontFamily: fontCSS[getFont('fontDisplay')],
                                fontWeight: settingsData.fontDisplayWeight || 800,
                                fontStyle: settingsData.fontDisplayItalic ? 'italic' : 'normal',
                                fontSize: `calc(${getFontSize('fontDisplaySize', '2rem')} * 1.4)`
                            }}>{tr('Display Preview', 'មើលអក្សរបង្ហាញ')}</div>

                            <div className={tabStyles.livePreviewHeaderGroup}>
                                <div className={tabStyles.livePreviewHeading} style={{
                                    fontFamily: fontCSS[getFont('fontHeading')],
                                    fontWeight: settingsData.fontHeadingWeight || 700,
                                    fontStyle: settingsData.fontHeadingItalic ? 'italic' : 'normal',
                                    fontSize: getFontSize('fontHeadingSize', '1.25rem')
                                }}>{tr('Heading - Sample Text', 'ចំណងជើង - អត្ថបទគំរូ')}</div>
                                <div className={tabStyles.livePreviewSubheading} style={{
                                    fontFamily: fontCSS[getFont('fontSubheading')],
                                    fontWeight: settingsData.fontSubheadingWeight || 600,
                                    fontStyle: settingsData.fontSubheadingItalic ? 'italic' : 'normal',
                                    fontSize: getFontSize('fontSubheadingSize', '1rem')
                                }}>{tr('Subheading - Sample Text', 'ចំណងជើងរង - អត្ថបទគំរូ')}</div>
                            </div>

                            <div className={tabStyles.livePreviewBodyText} style={{
                                fontFamily: fontCSS[getFont('fontBody')],
                                fontWeight: settingsData.fontBodyWeight || 400,
                                fontStyle: settingsData.fontBodyItalic ? 'italic' : 'normal',
                                fontSize: getFontSize('fontBodySize', '0.9rem')
                            }}>
                                {tr('This is a sample paragraph to preview the body text font. The ', 'នេះជាកថាខណ្ឌគំរូសម្រាប់មើលជាមុនអក្សរខ្លឹមសារ។ ')}<u>{tr('quick brown fox', 'អក្សរគំរូ')}</u>{tr(' jumps over the lazy dog.', '')}
                                <ul className={tabStyles.livePreviewList}>
                                    <li>{tr('High performance architecture', 'ស្ថាបត្យកម្មប្រសិទ្ធភាពខ្ពស់')}</li>
                                    <li>{tr('Modern typography system', 'ប្រព័ន្ធអក្សរសម័យទំនើប')}</li>
                                </ul>
                            </div>

                            <div className={tabStyles.livePreviewButtons}>
                                <span className={tabStyles.livePreviewPrimaryBtn} style={{
                                    fontFamily: fontCSS[getFont('fontUI')],
                                    fontWeight: settingsData.fontUIWeight || 600,
                                    fontStyle: settingsData.fontUIItalic ? 'italic' : 'normal',
                                    fontSize: getFontSize('fontUISize', '0.8rem')
                                }}>{tr('Primary Button', 'ប៊ូតុងចម្បង')}</span>

                                <span className={tabStyles.livePreviewBadge} style={{
                                    fontFamily: fontCSS[getFont('fontUI')],
                                    fontWeight: 600,
                                    fontSize: `calc(${getFontSize('fontUISize', '0.7rem')} * 0.9)`
                                }}>{tr('Status: Active', 'ស្ថានភាព៖ សកម្ម')}</span>

                                <span className={tabStyles.livePreviewSecondaryBtn} style={{
                                    fontFamily: fontCSS[getFont('fontUI')],
                                    fontWeight: settingsData.fontUIWeight || 500,
                                    fontStyle: settingsData.fontUIItalic ? 'italic' : 'normal',
                                    fontSize: getFontSize('fontUISize', '0.75rem')
                                }}>{tr('Secondary Action', 'សកម្មភាពរង')}</span>
                            </div>

                            <div className={tabStyles.livePreviewCodeBlock} style={{
                                fontFamily: fontCSS[getFont('fontMono')],
                                fontSize: getFontSize('fontMonoSize', '0.8rem'),
                                fontWeight: settingsData.fontMonoWeight || 400,
                                fontStyle: settingsData.fontMonoItalic ? 'italic' : 'normal'
                            }}>
                                <span className={tabStyles.codeKeyword}>function</span> <span className={tabStyles.codeFunction}>init</span>() &#123;<br />
                                &nbsp;&nbsp;<span className={tabStyles.codeComment}>{tr('// Initializing site...', '// កំពុងចាប់ផ្តើមគេហទំព័រ...')}</span><br />
                                &#125;
                            </div>
                        </div>
                    </div>

                    <div className={tabStyles.livePreviewCard}>
                        <div className={tabStyles.livePreviewTitleBar}>{tr('FOOTER PREVIEW', 'មើល Footer ជាមុន')}</div>
                        <div className={tabStyles.livePreviewFooter}>
                            <div className={tabStyles.livePreviewFooterTop}>
                                <div className={tabStyles.livePreviewFooterBrand}>
                                    <div className={tabStyles.livePreviewFooterBrandName} style={{
                                        fontFamily: fontCSS[getFont('fontFooterBrand')],
                                        fontSize: getFontSize('fontFooterBrandSize', '1.15rem'),
                                        fontWeight: settingsData.fontFooterBrandWeight || 700,
                                        fontStyle: settingsData.fontFooterBrandItalic ? 'italic' : 'normal'
                                    }}>{settingsData.logoHighlight || 'KEM'}<span>{settingsData.logoText || 'PHEARUM'}</span></div>
                                    <div className={tabStyles.livePreviewFooterTagline} style={{
                                        fontFamily: fontCSS[getFont('fontFooterTagline')],
                                        fontSize: getFontSize('fontFooterTaglineSize', '0.75rem'),
                                        fontWeight: settingsData.fontFooterTaglineWeight || 400,
                                        fontStyle: settingsData.fontFooterTaglineItalic ? 'italic' : 'normal'
                                    }}>{settingsData.tagline || tr('ICT Security & IT Audit Professional', 'អ្នកជំនាញសុវត្ថិភាព ICT និងសវនកម្ម IT')}</div>
                                </div>

                                <div className={tabStyles.livePreviewFooterMirrors}>
                                    <div className={tabStyles.livePreviewFooterSectionTitle} style={{
                                        fontFamily: fontCSS[getFont('fontFooterTitle')],
                                        fontSize: getFontSize('fontFooterTitleSize', '0.6rem'),
                                        fontWeight: settingsData.fontFooterTitleWeight || 600,
                                        fontStyle: settingsData.fontFooterTitleItalic ? 'italic' : 'normal'
                                    }}>{tr('Site Mirrors', 'គេហទំព័រស្រដៀង')}</div>
                                    <div className={tabStyles.livePreviewFooterMirrorLinks}>
                                        <span className={tabStyles.livePreviewFooterMirrorLink} style={{
                                            fontFamily: fontCSS[getFont('fontFooterLink')],
                                            fontSize: getFontSize('fontFooterLinkSize', '0.62rem'),
                                            fontWeight: settingsData.fontFooterLinkWeight || 400,
                                            fontStyle: settingsData.fontFooterLinkItalic ? 'italic' : 'normal'
                                        }}>{tr('Mirror Link', 'តំណភ្ជាប់ Mirror')}</span>
                                    </div>
                                </div>

                                <div className={tabStyles.livePreviewFooterSocials}>
                                    <div className={tabStyles.livePreviewFooterSocialIcon}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                        </svg>
                                    </div>
                                    <div className={tabStyles.livePreviewFooterSocialIcon}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className={tabStyles.livePreviewFooterDivider}></div>

                            <div className={tabStyles.livePreviewFooterCopyright} style={{
                                fontFamily: fontCSS[getFont('fontFooterText')],
                                fontSize: getFontSize('fontFooterTextSize', '0.68rem'),
                                fontWeight: settingsData.fontFooterTextWeight || 400,
                                fontStyle: settingsData.fontFooterTextItalic ? 'italic' : 'normal'
                            }}>(c) 2026 {settingsData.logoHighlight || 'Kem'} {settingsData.logoText || 'Phearum'}. {tr('All Rights Reserved.', 'រក្សាសិទ្ធិគ្រប់យ៉ាង។')}</div>
                        </div>
                    </div>

                    <div className={tabStyles.livePreviewCard}>
                        <div className={tabStyles.livePreviewTitleBar}>{tr('ADMIN SURFACES', 'ផ្ទៃបង្ហាញ Admin')}</div>
                        <div className={tabStyles.livePreviewAdminNav}>
                            <div className={tabStyles.livePreviewAdminHeader}>
                                <span className={tabStyles.livePreviewAdminBrand} style={{
                                    fontFamily: fontCSS[getFont('fontAdminBrand')],
                                    fontSize: getFontSize('fontAdminBrandSize', '1.1rem'),
                                    fontWeight: settingsData.fontAdminBrandWeight || 700,
                                    fontStyle: settingsData.fontAdminBrandItalic ? 'italic' : 'normal'
                                }}>{tr('Admin', 'Admin')}<span>.</span></span>
                                <div className={tabStyles.livePreviewAdminSettingsIcon}>{tr('Settings', 'ការកំណត់')}</div>
                            </div>
                            <div className={tabStyles.livePreviewAdminSidebarItem} style={{
                                fontFamily: fontCSS[getFont('fontAdminMenu')],
                                fontSize: getFontSize('fontAdminMenuSize', '0.85rem'),
                                fontWeight: settingsData.fontAdminMenuWeight || 600,
                                fontStyle: settingsData.fontAdminMenuItalic ? 'italic' : 'normal'
                            }}>{tr('Sidebar Active Link', 'តំណ Sidebar សកម្ម')}</div>
                        </div>
                        <div className={tabStyles.livePreviewAdminContent}>
                            <div className={tabStyles.livePreviewAdminTabHeader}>
                                <div className={tabStyles.livePreviewAdminTabLabel} style={{
                                    fontFamily: fontCSS[getFont('fontAdminTab')],
                                    fontSize: getFontSize('fontAdminTabSize', '0.65rem')
                                }}>{tr('Section', 'ផ្នែក')}</div>
                                <div className={tabStyles.livePreviewAdminTabTitle} style={{
                                    fontFamily: fontCSS[getFont('fontAdminTab')],
                                    fontSize: getFontSize('fontAdminTabSize', '1rem'),
                                    fontWeight: settingsData.fontAdminTabWeight || 700,
                                    fontStyle: settingsData.fontAdminTabItalic ? 'italic' : 'normal'
                                }}>{tr('Page / Tab Title', 'ចំណងជើងទំព័រ / ផ្ទាំង')}</div>
                            </div>

                            <div className={tabStyles.livePreviewAdminStatCard}>
                                <div className={tabStyles.livePreviewAdminStatLabel} style={{
                                    fontFamily: fontCSS[getFont('fontUI')]
                                }}>{tr('TOTAL PAGE VISITS', 'ចំនួនចូលមើលទំព័រសរុប')}</div>
                                <div className={tabStyles.livePreviewAdminStatValue} style={{
                                    fontFamily: fontCSS[getFont('fontHeading')]
                                }}>24,850</div>
                                <div className={tabStyles.livePreviewAdminStatChange} style={{
                                    fontFamily: fontCSS[getFont('fontUI')]
                                }}>
                                    <span>+12%</span>
                                    <span>{tr('from last week', 'ពីសប្តាហ៍មុន')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className={tabStyles.formFooter}>
                    <Button
                        type="submit"
                        isLoading={loading}
                        className={tabStyles.saveButton}
                    >
                        <Save size={18} /> {tr('Save Typography Settings', 'រក្សាទុកការកំណត់ Typography')}
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default TypographySection;
