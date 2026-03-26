import { useEffect, useRef, useState } from 'react';
import { Type, RefreshCw, PlusCircle, Minus, Plus, Save, Settings, Github, Triangle, Flame, Terminal, Globe } from 'lucide-react';
import { Button } from '../../../../shared/components/ui';
import FormSelect from '../../components/FormSelect';
import FormField from '../../components/FormField';
import tabStyles from '../SettingsTab.module.scss';
import { useTranslation } from '../../../../hooks/useTranslation';
import { getLocalizedField } from '../../../../utils/localization';

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
    const { language, t } = useTranslation();
    const previewContainerRef = useRef(null);
    const [isPreviewMobile, setIsPreviewMobile] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !previewContainerRef.current) return undefined;

        const updatePreviewMode = () => {
            const width = previewContainerRef.current?.getBoundingClientRect()?.width || window.innerWidth;
            setIsPreviewMobile(width <= 860);
        };

        updatePreviewMode();

        let observer;
        if (typeof ResizeObserver !== 'undefined') {
            observer = new ResizeObserver(updatePreviewMode);
            observer.observe(previewContainerRef.current);
        }

        window.addEventListener('resize', updatePreviewMode);
        return () => {
            if (observer) observer.disconnect();
            window.removeEventListener('resize', updatePreviewMode);
        };
    }, []);

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
    const footerBrandPrefix = getLocalizedField(settingsData.logoHighlight || 'KEM', language);
    const footerBrandSuffix = getLocalizedField(settingsData.logoText || 'PHEARUM', language);
    const footerTagline = getLocalizedField(settingsData.tagline || t('admin.settings.sections.identity.fields.siteTaglinePlaceholder'), language);
    const footerCopyright = `(c) 2026 ${getLocalizedField(settingsData.logoHighlight || 'KEM', language)} ${getLocalizedField(settingsData.logoText || 'PHEARUM', language)}. ${t('admin.settings.sections.typography.preview.content.allRightsReserved')}`;
    const footerMirrors = Array.isArray(settingsData.mirrors) && settingsData.mirrors.length > 0
        ? settingsData.mirrors.slice(0, 4)
        : [
            { name: 'GitHub Pages', url: 'https://kemphearum.github.io/' },
            { name: 'Vercel Mirror', url: 'https://phearum-info.vercel.app/' },
            { name: 'Firebase Primary', url: 'https://phearum-info.web.app/' },
            { name: 'Firebase Mirror', url: 'https://kem-phearum.web.app/' }
        ];

    const getPreviewMirrorIcon = (name = '', url = '') => {
        const lowerName = String(name).toLowerCase();
        const lowerUrl = String(url).toLowerCase();

        if (lowerName.includes('github') || lowerUrl.includes('github.io')) return <Github size={14} />;
        if (lowerName.includes('vercel') || lowerUrl.includes('vercel.app')) return <Triangle size={13} />;
        if (lowerName.includes('firebase') || lowerUrl.includes('web.app')) return <Flame size={14} />;
        if (lowerName.includes('mirror')) return <Terminal size={14} />;
        return <Globe size={14} />;
    };

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

    const renderFooterPreview = (variant) => {
        const isMobile = variant === 'mobile';

        return (
            <div className={`${tabStyles.livePreviewFooterCanvas} ${isMobile ? tabStyles.livePreviewFooterCanvasMobile : ''}`}>
                <div className={`${tabStyles.livePreviewFooter} ${isMobile ? tabStyles.livePreviewFooterMobile : ''}`}>
                    <div className={tabStyles.livePreviewFooterTop}>
                        <div className={tabStyles.livePreviewFooterBrand}>
                            <div className={tabStyles.livePreviewFooterBrandName} style={{
                                fontFamily: fontCSS[getFont('fontFooterBrand')],
                                fontSize: getFontSize('fontFooterBrandSize', '1.15rem'),
                                fontWeight: settingsData.fontFooterBrandWeight || 700,
                                fontStyle: settingsData.fontFooterBrandItalic ? 'italic' : 'normal'
                            }}>{footerBrandPrefix}<span>{footerBrandSuffix}</span></div>
                            <div className={tabStyles.livePreviewFooterTagline} style={{
                                fontFamily: fontCSS[getFont('fontFooterTagline')],
                                fontSize: getFontSize('fontFooterTaglineSize', '0.75rem'),
                                fontWeight: settingsData.fontFooterTaglineWeight || 400,
                                fontStyle: settingsData.fontFooterTaglineItalic ? 'italic' : 'normal'
                            }}>{footerTagline}</div>
                        </div>

                        <div className={tabStyles.livePreviewFooterMirrors}>
                            <div className={tabStyles.livePreviewFooterSectionTitle} style={{
                                fontFamily: fontCSS[getFont('fontFooterTitle')],
                                fontSize: getFontSize('fontFooterTitleSize', '0.6rem'),
                                fontWeight: settingsData.fontFooterTitleWeight || 600,
                                fontStyle: settingsData.fontFooterTitleItalic ? 'italic' : 'normal'
                            }}>{t('admin.settings.sections.typography.preview.content.siteMirrors')}</div>
                            <div className={tabStyles.livePreviewFooterMirrorLinks}>
                                {footerMirrors.map((mirror, index) => (
                                    <span
                                        key={`${mirror.name || 'mirror'}-${index}`}
                                        className={tabStyles.livePreviewFooterMirrorLink}
                                        style={{
                                            fontFamily: fontCSS[getFont('fontFooterLink')],
                                            fontSize: getFontSize('fontFooterLinkSize', '0.62rem'),
                                            fontWeight: settingsData.fontFooterLinkWeight || 400,
                                            fontStyle: settingsData.fontFooterLinkItalic ? 'italic' : 'normal'
                                        }}
                                    >
                                        <span className={tabStyles.livePreviewFooterMirrorIcon}>
                                            {getPreviewMirrorIcon(mirror.name, mirror.url)}
                                        </span>
                                        <span className={tabStyles.livePreviewFooterMirrorName}>
                                            {mirror.name || t('admin.settings.sections.typography.preview.content.mirrorLink')}
                                        </span>
                                    </span>
                                ))}
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
                    }}>{footerCopyright}</div>
                </div>
            </div>
        );
    };

    return (
        <form onSubmit={onSave} className={tabStyles.tabContentFadeIn}>
            <div className="ui-card">
                <div className={tabStyles.surfaceHeader}>
                    <div className={tabStyles.surfaceCopy}>
                        <span className={tabStyles.surfaceEyebrow}>{t('admin.settings.sections.typography.header.eyebrow')}</span>
                        <h3 className={tabStyles.surfaceHeadline}>{t('admin.settings.sections.typography.header.title')}</h3>
                        <p className={tabStyles.surfaceLead}>{t('admin.settings.sections.typography.header.description')}</p>
                    </div>
                    <div className={tabStyles.surfaceMeta}>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{fontCategories.length}</span>
                            <span className={tabStyles.surfaceMetaLabel}>{t('admin.settings.sections.typography.meta.typeRoles')}</span>
                            <span className={tabStyles.surfaceMetaHint}>{t('admin.settings.sections.typography.meta.typeRolesHint')}</span>
                        </div>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{presets.length}</span>
                            <span className={tabStyles.surfaceMetaLabel}>{t('admin.settings.sections.typography.meta.quickPresets')}</span>
                            <span className={tabStyles.surfaceMetaHint}>{t('admin.settings.sections.typography.meta.quickPresetsHint')}</span>
                        </div>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{adminOverride ? t('admin.settings.sections.typography.meta.inter') : t('admin.settings.sections.typography.meta.custom')}</span>
                            <span className={tabStyles.surfaceMetaLabel}>{t('admin.settings.sections.typography.meta.adminFontMode')}</span>
                            <span className={tabStyles.surfaceMetaHint}>{t('admin.settings.sections.typography.meta.adminFontModeHint')}</span>
                        </div>
                    </div>
                </div>

                <section className={tabStyles.settingsPanel} ref={previewContainerRef}>
                    <div className={tabStyles.typographyHeader}>
                        <div className={tabStyles.typographyOverview}>
                            <div className={tabStyles.sectionTitle}>
                                <Type size={20} className={tabStyles.sectionIcon} />
                                <span className={tabStyles.sectionTitleText}>{t('admin.settings.sections.typography.global.title')}</span>
                            </div>
                            <p className={tabStyles.surfaceLead}>{t('admin.settings.sections.typography.global.description')}</p>
                        </div>

                        <div className={tabStyles.typographyControls}>
                            <FormField label={t('admin.settings.sections.typography.global.baseSize')}>
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
                                        title={t('admin.settings.sections.typography.global.setupMetadataTitle')}
                                    >
                                        <PlusCircle size={14} />
                                        {t('admin.settings.sections.typography.global.setupMetadata')}
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={resetTypography}
                                    className={tabStyles.typographyHelperBtn}
                                >
                                    <RefreshCw size={14} />
                                    {t('admin.settings.sections.typography.global.resetDefaults')}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {presets.length > 0 && (
                        <div className={tabStyles.presetsWrapper}>
                            <div className={tabStyles.typographyLabel}>{t('admin.settings.sections.typography.roles.presets')}</div>
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
                                            <span className={tabStyles.presetIcon}>{getLocalizedField(preset.icon, language)}</span>
                                            <span className={tabStyles.presetLabel}>{getLocalizedField(preset.label, language)}</span>
                                        </div>
                                        <div className={tabStyles.presetDesc}>{getLocalizedField(preset.description, language)}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                <section className={tabStyles.settingsPanel}>
                    <div className={tabStyles.panelHeader}>
                        <div className={tabStyles.panelTitleGroup}>
                            <span className={tabStyles.panelEyebrow}>{t('admin.settings.sections.typography.roles.eyebrow')}</span>
                            <h4 className={tabStyles.panelTitle}>{t('admin.settings.sections.typography.roles.title')}</h4>
                            <p className={tabStyles.panelDescription}>{t('admin.settings.sections.typography.roles.description')}</p>
                        </div>
                        <span className={tabStyles.panelBadge}>{fontCategories.length} {t('admin.settings.sections.typography.roles.badge')}</span>
                    </div>

                    <div className={tabStyles.fontGrid}>
                        {fontCategories.map((category) => (
                            <div key={category.field} className={tabStyles.fontCard}>
                                <div className={tabStyles.fontCardHeader}>
                                    <div className={tabStyles.titleGroup}>
                                        <span>{getLocalizedField(category.icon, language)}</span>
                                        <span>{getLocalizedField(category.label, language)}</span>
                                    </div>
                                    <span className={tabStyles.hint}>{getLocalizedField(category.hint, language)}</span>
                                </div>

                                <FormField label={t('admin.settings.sections.typography.roles.fontFamily')} hint={getLocalizedField(category.hint, language)}>
                                    <FormSelect
                                        value={getFont(category.field)}
                                        onChange={(e) => setSettingsData({ ...settingsData, [category.field]: e.target.value })}
                                        options={fontOptions}
                                    />
                                </FormField>

                                <div className={tabStyles.formGrid}>
                                    <FormField label={t('admin.settings.sections.typography.roles.weight')}>
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
                                        {t('admin.settings.sections.typography.roles.italic')}
                                    </div>
                                </div>

                                <FormField label={t('admin.settings.sections.typography.roles.sizeLabel')}>
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
                                            title={t('admin.settings.sections.typography.roles.sizeTitle')}
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
                            <span className={tabStyles.panelEyebrow}>{t('admin.settings.sections.typography.preview.eyebrow')}</span>
                            <h4 className={tabStyles.panelTitle}>{t('admin.settings.sections.typography.preview.title')}</h4>
                            <p className={tabStyles.panelDescription}>{t('admin.settings.sections.typography.preview.description')}</p>
                        </div>
                        <span className={tabStyles.panelBadge}>{t('admin.settings.sections.typography.preview.badge')}</span>
                    </div>

                    <div
                        className={tabStyles.adminOverrideCard}
                        onClick={() => setSettingsData({ ...settingsData, adminFontOverride: !adminOverride })}
                    >
                        <input type="checkbox" checked={adminOverride} readOnly />
                        <div className={tabStyles.toggleContent}>
                            <div className={tabStyles.title}>{t('admin.settings.sections.typography.preview.adminOverrideTitle')}</div>
                            <div className={tabStyles.desc}>{t('admin.settings.sections.typography.preview.adminOverrideDesc')}</div>
                        </div>
                    </div>

                    <div className={tabStyles.previewSection}>
                        <div className={tabStyles.previewHeaderBlock}>
                            <div className={tabStyles.previewHeaderLabel}>{t('admin.settings.sections.typography.preview.regions.previewLabel')}</div>
                            <div className={tabStyles.previewHeaderText}>{t('admin.settings.sections.typography.preview.regions.previewDesc')}</div>
                        </div>
                    </div>

                    <div className={tabStyles.livePreviewCard}>
                        <div className={tabStyles.livePreviewTitleBar}>
                            <span>{t('admin.settings.sections.typography.preview.regions.header')}</span>
                            <span className={tabStyles.hint}>{t('admin.settings.sections.typography.preview.regions.responsive')}</span>
                        </div>
                        <div className={tabStyles.livePreviewNavShell}>
                            <div className={tabStyles.livePreviewContent}>
                                <div className={tabStyles.livePreviewLogo} style={{
                                    fontFamily: fontCSS[getFont('fontLogo')],
                                    fontWeight: settingsData.fontLogoWeight || 700,
                                    fontStyle: settingsData.fontLogoItalic ? 'italic' : 'normal',
                                    fontSize: getFontSize('fontLogoSize', '1.25rem')
                                }}>
                                    {getLocalizedField(settingsData.logoHighlight || 'KEM', language)}<span>{getLocalizedField(settingsData.logoText || 'PHEARUM', language)}</span>
                                </div>
                                <div className={tabStyles.livePreviewNav}>
                                    {!isPreviewMobile && [t('admin.settings.sections.identity.tabs.home'), t('admin.settings.sections.typography.preview.content.navBlog')].map((item) => (
                                        <span key={item} className={tabStyles.livePreviewNavItem} style={{
                                            fontFamily: fontCSS[getFont('fontNav')],
                                            fontWeight: settingsData.fontNavWeight || 600,
                                            fontStyle: settingsData.fontNavItalic ? 'italic' : 'normal',
                                            fontSize: getFontSize('fontNavSize', '0.75rem'),
                                            color: item === t('admin.settings.sections.identity.tabs.home') ? 'var(--primary-color)' : 'var(--text-secondary)'
                                        }}>{item}</span>
                                    ))}
                                    <div className={tabStyles.livePreviewLangSwitch}>
                                        <span>EN</span>
                                        <span className={tabStyles.livePreviewLangActive}>KM</span>
                                    </div>
                                    <div className={tabStyles.livePreviewThemeToggle}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                        </svg>
                                    </div>
                                </div>
                                {isPreviewMobile && (
                                    <div className={tabStyles.livePreviewHamburger}>
                                        <span />
                                        <span />
                                        <span />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={tabStyles.livePreviewHero}>
                            <div className={tabStyles.livePreviewHeroLayout}>
                                <div className={tabStyles.livePreviewHeroCopy}>
                                    <div className={tabStyles.livePreviewDisplay} style={{
                                        fontFamily: fontCSS[getFont('fontDisplay')],
                                        fontWeight: settingsData.fontDisplayWeight || 800,
                                        fontStyle: settingsData.fontDisplayItalic ? 'italic' : 'normal',
                                        fontSize: `calc(${getFontSize('fontDisplaySize', '2rem')} * 1.4)`
                                    }}>{t('admin.settings.sections.typography.preview.content.display')}</div>

                                    <div className={tabStyles.livePreviewHeaderGroup}>
                                        <div className={tabStyles.livePreviewHeading} style={{
                                            fontFamily: fontCSS[getFont('fontHeading')],
                                            fontWeight: settingsData.fontHeadingWeight || 700,
                                            fontStyle: settingsData.fontHeadingItalic ? 'italic' : 'normal',
                                            fontSize: getFontSize('fontHeadingSize', '1.25rem')
                                        }}>{t('admin.settings.sections.typography.preview.content.heading')}</div>
                                        <div className={tabStyles.livePreviewSubheading} style={{
                                            fontFamily: fontCSS[getFont('fontSubheading')],
                                            fontWeight: settingsData.fontSubheadingWeight || 600,
                                            fontStyle: settingsData.fontSubheadingItalic ? 'italic' : 'normal',
                                            fontSize: getFontSize('fontSubheadingSize', '1rem')
                                        }}>{t('admin.settings.sections.typography.preview.content.subheading')}</div>
                                    </div>

                                    <div className={tabStyles.livePreviewBodyText} style={{
                                        fontFamily: fontCSS[getFont('fontBody')],
                                        fontWeight: settingsData.fontBodyWeight || 400,
                                        fontStyle: settingsData.fontBodyItalic ? 'italic' : 'normal',
                                        fontSize: getFontSize('fontBodySize', '0.9rem')
                                    }}>
                                        {t('admin.settings.sections.typography.preview.content.bodyPrefix')}<u>{t('admin.settings.sections.typography.preview.content.bodyHighlight')}</u>{t('admin.settings.sections.typography.preview.content.bodySuffix')}
                                        <ul className={tabStyles.livePreviewList}>
                                            <li>{t('admin.settings.sections.typography.preview.content.list.0')}</li>
                                            <li>{t('admin.settings.sections.typography.preview.content.list.1')}</li>
                                        </ul>
                                    </div>

                                    <div className={tabStyles.livePreviewButtons}>
                                        <span className={tabStyles.livePreviewPrimaryBtn} style={{
                                            fontFamily: fontCSS[getFont('fontUI')],
                                            fontWeight: settingsData.fontUIWeight || 600,
                                            fontStyle: settingsData.fontUIItalic ? 'italic' : 'normal',
                                            fontSize: getFontSize('fontUISize', '0.8rem')
                                        }}>{t('admin.settings.sections.typography.preview.content.primaryBtn')}</span>

                                        <span className={tabStyles.livePreviewBadge} style={{
                                            fontFamily: fontCSS[getFont('fontUI')],
                                            fontWeight: 600,
                                            fontSize: `calc(${getFontSize('fontUISize', '0.7rem')} * 0.9)`
                                        }}>{t('admin.settings.sections.typography.preview.content.statusActive')}</span>

                                        <span className={tabStyles.livePreviewSecondaryBtn} style={{
                                            fontFamily: fontCSS[getFont('fontUI')],
                                            fontWeight: settingsData.fontUIWeight || 500,
                                            fontStyle: settingsData.fontUIItalic ? 'italic' : 'normal',
                                            fontSize: getFontSize('fontUISize', '0.75rem')
                                        }}>{t('admin.settings.sections.typography.preview.content.secondaryAction')}</span>
                                    </div>
                                </div>
                                {!isPreviewMobile && (
                                    <div className={tabStyles.livePreviewHeroAvatarWrap}>
                                        <div className={tabStyles.livePreviewHeroAvatar} />
                                    </div>
                                )}
                            </div>

                            <div className={tabStyles.livePreviewCodeBlock} style={{
                                fontFamily: fontCSS[getFont('fontMono')],
                                fontSize: getFontSize('fontMonoSize', '0.8rem'),
                                fontWeight: settingsData.fontMonoWeight || 400,
                                fontStyle: settingsData.fontMonoItalic ? 'italic' : 'normal'
                            }}>
                                <span className={tabStyles.codeKeyword}>function</span> <span className={tabStyles.codeFunction}>init</span>() &#123;<br />
                                &nbsp;&nbsp;<span className={tabStyles.codeComment}>{t('admin.settings.sections.typography.preview.content.codeComment')}</span><br />
                                &#125;
                            </div>
                        </div>
                    </div>

                    <div className={tabStyles.livePreviewCard}>
                        <div className={tabStyles.livePreviewTitleBar}>{t('admin.settings.sections.typography.preview.regions.footer')}</div>
                        <div className={tabStyles.livePreviewFooterPreviewGrid}>
                            {renderFooterPreview(isPreviewMobile ? 'mobile' : 'desktop')}
                        </div>
                    </div>

                    <div className={tabStyles.livePreviewCard}>
                        <div className={tabStyles.livePreviewTitleBar}>{t('admin.settings.sections.typography.preview.regions.admin')}</div>
                        <div className={tabStyles.livePreviewAdminShell}>
                            <div className={tabStyles.livePreviewAdminTopbar}>
                                <div className={tabStyles.livePreviewAdminTopbarLeft}>
                                    <div className={tabStyles.livePreviewHamburger}>
                                        <span />
                                        <span />
                                        <span />
                                    </div>
                                    <span className={tabStyles.livePreviewAdminBrand} style={{
                                        fontFamily: fontCSS[getFont('fontAdminBrand')],
                                        fontSize: getFontSize('fontAdminBrandSize', '1.1rem'),
                                        fontWeight: settingsData.fontAdminBrandWeight || 700,
                                        fontStyle: settingsData.fontAdminBrandItalic ? 'italic' : 'normal'
                                    }}>{t('admin.settings.sections.typography.preview.content.adminLabel')}<span>.</span></span>
                                </div>
                                <div className={tabStyles.livePreviewAdminTopbarActions}>
                                    <div className={tabStyles.livePreviewAdminSettingsIcon}><Settings size={14} /></div>
                                    <div className={tabStyles.livePreviewAdminSettingsIcon}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className={`${tabStyles.livePreviewAdminBody} ${isPreviewMobile ? tabStyles.livePreviewAdminBodyMobile : ''}`}>
                                {!isPreviewMobile && (
                                    <div className={tabStyles.livePreviewAdminSidebar}>
                                        <div className={tabStyles.livePreviewAdminSidebarItem} style={{
                                            fontFamily: fontCSS[getFont('fontAdminMenu')],
                                            fontSize: getFontSize('fontAdminMenuSize', '0.85rem'),
                                            fontWeight: settingsData.fontAdminMenuWeight || 600,
                                            fontStyle: settingsData.fontAdminMenuItalic ? 'italic' : 'normal'
                                        }}>{t('admin.settings.sections.typography.preview.content.sidebarActive')}</div>
                                        <div className={tabStyles.livePreviewAdminSidebarMuted}>{t('admin.tabs.messages')}</div>
                                        <div className={tabStyles.livePreviewAdminSidebarMuted}>{t('admin.tabs.users')}</div>
                                    </div>
                                )}
                                <div className={tabStyles.livePreviewAdminContent}>
                                    <div className={tabStyles.livePreviewAdminTabHeader}>
                                        <div className={tabStyles.livePreviewAdminTabLabel} style={{
                                            fontFamily: fontCSS[getFont('fontAdminTab')],
                                            fontSize: getFontSize('fontAdminTabSize', '0.65rem')
                                        }}>{t('admin.settings.sections.typography.preview.content.section')}</div>
                                        <div className={tabStyles.livePreviewAdminTabTitle} style={{
                                            fontFamily: fontCSS[getFont('fontAdminTab')],
                                            fontSize: getFontSize('fontAdminTabSize', '1rem'),
                                            fontWeight: settingsData.fontAdminTabWeight || 700,
                                            fontStyle: settingsData.fontAdminTabItalic ? 'italic' : 'normal'
                                        }}>{t('admin.settings.sections.typography.preview.content.pageTabTitle')}</div>
                                    </div>

                                    <div className={tabStyles.livePreviewAdminStatCard}>
                                        <div className={tabStyles.livePreviewAdminStatLabel} style={{
                                            fontFamily: fontCSS[getFont('fontUI')]
                                        }}>{t('admin.settings.sections.typography.preview.content.totalVisits')}</div>
                                        <div className={tabStyles.livePreviewAdminStatValue} style={{
                                            fontFamily: fontCSS[getFont('fontHeading')]
                                        }}>24,850</div>
                                        <div className={tabStyles.livePreviewAdminStatChange} style={{
                                            fontFamily: fontCSS[getFont('fontUI')]
                                        }}>
                                            <span>+12%</span>
                                            <span>{t('admin.settings.sections.typography.preview.content.fromLastWeek')}</span>
                                        </div>
                                    </div>
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
                        <Save size={18} /> {t('admin.settings.sections.typography.save')}
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default TypographySection;
