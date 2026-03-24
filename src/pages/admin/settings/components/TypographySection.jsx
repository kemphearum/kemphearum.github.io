import { Type, RefreshCw, PlusCircle, Minus, Plus, Save } from 'lucide-react';
import { Button, Input } from '../../../../shared/components/ui';
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

    return (
        <form onSubmit={onSave} className={tabStyles.tabContentFadeIn}>
            <div className="ui-card">
                <div className={tabStyles.sectionHeader}>
                    <h4>Typography & Appearance</h4>
                </div>
                <div className={tabStyles.typographyHeader}>
                    <div className={tabStyles.sectionTitle}>
                        <Type size={20} className={tabStyles.sectionIcon} />
                        <span className={tabStyles.sectionTitleText}>Site Typography</span>
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
                                onClick={() => {
                                    const resetData = { ...settingsData };
                                    fontCategories.forEach(cat => {
                                        resetData[cat.field] = 'inter';
                                        resetData[cat.sizeField] = cat.defaultSize;
                                        resetData[cat.weightField] = cat.defaultWeight;
                                        resetData[cat.italicField] = false;
                                    });
                                    setSettingsData(resetData);
                                }}
                                className={tabStyles.typographyHelperBtn}
                            >
                                <RefreshCw size={14} />
                                Reset to Defaults
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Typography Presets */}
                {presets.length > 0 && (
                    <div className={tabStyles.presetsWrapper}>
                        <div className={tabStyles.typographyLabel}>Quick Presets / Brand Styles</div>
                        <div className={tabStyles.presetsGrid}>
                            {presets.map(preset => (
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

                <div className={tabStyles.fontGrid}>
                    {fontCategories.map(cat => (
                        <div key={cat.field} className={tabStyles.fontCard}>
                            <div className={tabStyles.fontCardHeader}>
                                <div className={tabStyles.titleGroup}>
                                    <span>{cat.icon}</span>
                                    <span>{cat.label}</span>
                                </div>
                                <span className={tabStyles.hint}>{cat.hint}</span>
                            </div>

                            <FormField label="Font Family" hint={cat.hint}>
                                <FormSelect
                                    value={getFont(cat.field)}
                                    onChange={(e) => setSettingsData({ ...settingsData, [cat.field]: e.target.value })}
                                    options={fontOptions}
                                />
                            </FormField>

                            <div className={tabStyles.inputGroup}>
                                <div className={tabStyles.mirrorInfo} style={{ border: 'none' }}>
                                    <div style={{ flex: 1.5 }}>
                                        <FormField label="Weight">
                                            <FormSelect
                                                value={settingsData[cat.weightField] || cat.defaultWeight}
                                                onChange={(e) => setSettingsData({ ...settingsData, [cat.weightField]: e.target.value })}
                                                options={weightOptions}
                                            />
                                        </FormField>
                                    </div>
                                    <div
                                        onClick={() => setSettingsData({ ...settingsData, [cat.italicField]: !settingsData[cat.italicField] })}
                                        className={`${tabStyles.italicToggle} ${settingsData[cat.italicField] ? tabStyles.active : ''}`}
                                        style={{ marginTop: '1.5rem' }}
                                    >
                                        <span className={tabStyles.italicIcon}>I</span>
                                        Italic
                                    </div>
                                </div>
                            </div>

                            <FormField label="Size (e.g. 1.2rem)">
                                <div className={tabStyles.sizeStepper}>
                                    <Button type="button" size="sm" variant="ghost" onClick={() => handleSizeAdjust(cat.sizeField, settingsData[cat.sizeField] || cat.defaultSize, false)}>
                                        <Minus size={14} />
                                    </Button>
                                    <input
                                        type="text"
                                        placeholder={cat.defaultSize}
                                        value={settingsData[cat.sizeField] || ''}
                                        onChange={(e) => setSettingsData({ ...settingsData, [cat.sizeField]: e.target.value })}
                                        title="Font Size (e.g. 1.2rem, 18px)"
                                        className={tabStyles.stepperInput}
                                    />
                                    <Button type="button" size="sm" variant="ghost" onClick={() => handleSizeAdjust(cat.sizeField, settingsData[cat.sizeField] || cat.defaultSize, true)}>
                                        <Plus size={14} />
                                    </Button>
                                </div>
                            </FormField>
                        </div>
                    ))}
                </div>

                {/* Admin Override Toggle */}
                <div className={tabStyles.adminOverrideCard} onClick={() => setSettingsData({ ...settingsData, adminFontOverride: !adminOverride })}>
                    <input type="checkbox" checked={adminOverride} readOnly />
                    <div className={tabStyles.toggleContent}>
                        <div className={tabStyles.title}>Use Inter for Admin Panel</div>
                        <div className={tabStyles.desc}>Keep admin panel in Inter regardless of typography settings above. Fonts only apply to the public-facing site.</div>
                    </div>
                </div>

                <div className={tabStyles.previewSection}>
                    <div className={tabStyles.previewHeaderLabel}>Live Typography Preview</div>
                </div>

                {/* 1. Header Preview Card */}
                <div className={tabStyles.livePreviewCard}>
                    <div className={tabStyles.livePreviewTitleBar}>
                        <span>SITE HEADER</span>
                        <span className={tabStyles.hint}>Responsive Preview</span>
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
                            {['Home', 'Blog'].map(item => (
                                <span key={item} className={tabStyles.livePreviewNavItem} style={{
                                    fontFamily: fontCSS[getFont('fontNav')],
                                    fontWeight: settingsData.fontNavWeight || 600,
                                    fontStyle: settingsData.fontNavItalic ? 'italic' : 'normal',
                                    fontSize: getFontSize('fontNavSize', '0.75rem'),
                                    color: item === 'Home' ? 'var(--primary-color)' : 'var(--text-secondary)'
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

                {/* 2. Content & Hero Preview Card */}
                <div className={tabStyles.livePreviewCard}>
                    <div className={tabStyles.livePreviewTitleBar}>MAIN CONTENT & HERO</div>
                    <div className={tabStyles.livePreviewHero}>
                        <div className={tabStyles.livePreviewDisplay} style={{
                            fontFamily: fontCSS[getFont('fontDisplay')],
                            fontWeight: settingsData.fontDisplayWeight || 800,
                            fontStyle: settingsData.fontDisplayItalic ? 'italic' : 'normal',
                            fontSize: `calc(${getFontSize('fontDisplaySize', '2rem')} * 1.4)`
                        }}>áž€áž¹áž˜ áž—áž¶ážšáž˜áŸ’áž™</div>

                        <div className={tabStyles.livePreviewHeaderGroup}>
                            <div className={tabStyles.livePreviewHeading} style={{
                                fontFamily: fontCSS[getFont('fontHeading')],
                                fontWeight: settingsData.fontHeadingWeight || 700,
                                fontStyle: settingsData.fontHeadingItalic ? 'italic' : 'normal',
                                fontSize: getFontSize('fontHeadingSize', '1.25rem')
                            }}>Heading â€” áž…áŸ†ážŽáž„áž‡áž¾áž„</div>
                            <div className={tabStyles.livePreviewSubheading} style={{
                                fontFamily: fontCSS[getFont('fontSubheading')],
                                fontWeight: settingsData.fontSubheadingWeight || 600,
                                fontStyle: settingsData.fontSubheadingItalic ? 'italic' : 'normal',
                                fontSize: getFontSize('fontSubheadingSize', '1rem')
                            }}>Sub Heading â€” áž…áŸ†ážŽáž„áž‡áž¾áž„ážšáž„</div>
                        </div>

                        <div className={tabStyles.livePreviewBodyText} style={{
                            fontFamily: fontCSS[getFont('fontBody')],
                            fontWeight: settingsData.fontBodyWeight || 400,
                            fontStyle: settingsData.fontBodyItalic ? 'italic' : 'normal',
                            fontSize: getFontSize('fontBodySize', '0.9rem')
                        }}>
                            This is a sample paragraph to preview the body text font. The <u>quick brown fox</u> jumps over the lazy dog.
                            <ul className={tabStyles.livePreviewList}>
                                <li>High performance architecture</li>
                                <li>Modern typography system</li>
                            </ul>
                        </div>

                        <div className={tabStyles.livePreviewButtons}>
                            <span className={tabStyles.livePreviewPrimaryBtn} style={{
                                fontFamily: fontCSS[getFont('fontUI')],
                                fontWeight: settingsData.fontUIWeight || 600,
                                fontStyle: settingsData.fontUIItalic ? 'italic' : 'normal',
                                fontSize: getFontSize('fontUISize', '0.8rem')
                            }}>Primary Button</span>

                            <span className={tabStyles.livePreviewBadge} style={{
                                fontFamily: fontCSS[getFont('fontUI')],
                                fontWeight: 600,
                                fontSize: `calc(${getFontSize('fontUISize', '0.7rem')} * 0.9)`
                            }}>Status: Active</span>

                            <span className={tabStyles.livePreviewSecondaryBtn} style={{
                                fontFamily: fontCSS[getFont('fontUI')],
                                fontWeight: settingsData.fontUIWeight || 500,
                                fontStyle: settingsData.fontUIItalic ? 'italic' : 'normal',
                                fontSize: getFontSize('fontUISize', '0.75rem')
                            }}>Secondary Action</span>
                        </div>

                        <div className={tabStyles.livePreviewCodeBlock} style={{
                            fontFamily: fontCSS[getFont('fontMono')],
                            fontSize: getFontSize('fontMonoSize', '0.8rem'),
                            fontWeight: settingsData.fontMonoWeight || 400,
                            fontStyle: settingsData.fontMonoItalic ? 'italic' : 'normal'
                        }}>
                            <span className={tabStyles.codeKeyword}>function</span> <span className={tabStyles.codeFunction}>init</span>() &#123;<br />
                            &nbsp;&nbsp;<span className={tabStyles.codeComment}>// Initializing site...</span><br />
                            &#125;
                        </div>
                    </div>
                </div>

                {/* 3. Footer Preview Card */}
                <div className={tabStyles.livePreviewCard}>
                    <div className={tabStyles.livePreviewTitleBar}>FOOTER PREVIEW (REAL LAYOUT)</div>
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
                                }}>{settingsData.tagline || 'ICT Security & IT Audit Professional'}</div>
                            </div>

                            <div className={tabStyles.livePreviewFooterMirrors}>
                                <div className={tabStyles.livePreviewFooterSectionTitle} style={{
                                    fontFamily: fontCSS[getFont('fontFooterTitle')],
                                    fontSize: getFontSize('fontFooterTitleSize', '0.6rem'),
                                    fontWeight: settingsData.fontFooterTitleWeight || 600,
                                    fontStyle: settingsData.fontFooterTitleItalic ? 'italic' : 'normal'
                                }}>Site Mirrors</div>
                                <div className={tabStyles.livePreviewFooterMirrorLinks}>
                                    <span className={tabStyles.livePreviewFooterMirrorLink} style={{
                                        fontFamily: fontCSS[getFont('fontFooterLink')],
                                        fontSize: getFontSize('fontFooterLinkSize', '0.62rem'),
                                        fontWeight: settingsData.fontFooterLinkWeight || 400,
                                        fontStyle: settingsData.fontFooterLinkItalic ? 'italic' : 'normal'
                                    }}>Mirror Link</span>
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
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
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
                        }}>Â© 2026 {settingsData.logoHighlight || 'Kem'} {settingsData.logoText || 'Phearum'}. All Rights Reserved.</div>
                    </div>
                </div>

                {/* 4. Admin Navigation Preview Card */}
                <div className={tabStyles.livePreviewCard}>
                    <div className={tabStyles.livePreviewTitleBar}>ADMIN NAVIGATION & BRANDING</div>
                    <div className={tabStyles.livePreviewAdminNav}>
                        <div className={tabStyles.livePreviewAdminHeader}>
                            <span className={tabStyles.livePreviewAdminBrand} style={{
                                fontFamily: fontCSS[getFont('fontAdminBrand')],
                                fontSize: getFontSize('fontAdminBrandSize', '1.1rem'),
                                fontWeight: settingsData.fontAdminBrandWeight || 700,
                                fontStyle: settingsData.fontAdminBrandItalic ? 'italic' : 'normal'
                            }}>Admin<span>.</span></span>
                            <div className={tabStyles.livePreviewAdminSettingsIcon}>âš™ï¸</div>
                        </div>
                        <div className={tabStyles.livePreviewAdminSidebarItem} style={{
                            fontFamily: fontCSS[getFont('fontAdminMenu')],
                            fontSize: getFontSize('fontAdminMenuSize', '0.85rem'),
                            fontWeight: settingsData.fontAdminMenuWeight || 600,
                            fontStyle: settingsData.fontAdminMenuItalic ? 'italic' : 'normal'
                        }}>Sidebar Active Link</div>
                    </div>
                </div>

                {/* 5. Admin Dashboard & Stats Preview Card */}
                <div className={tabStyles.livePreviewCard}>
                    <div className={tabStyles.livePreviewTitleBar}>ADMIN DASHBOARD & STATS</div>
                    <div className={tabStyles.livePreviewAdminContent}>
                        <div className={tabStyles.livePreviewAdminTabHeader}>
                            <div className={tabStyles.livePreviewAdminTabLabel} style={{
                                fontFamily: fontCSS[getFont('fontAdminTab')],
                                fontSize: getFontSize('fontAdminTabSize', '0.65rem')
                            }}>Section</div>
                            <div className={tabStyles.livePreviewAdminTabTitle} style={{
                                fontFamily: fontCSS[getFont('fontAdminTab')],
                                fontSize: getFontSize('fontAdminTabSize', '1rem'),
                                fontWeight: settingsData.fontAdminTabWeight || 700,
                                fontStyle: settingsData.fontAdminTabItalic ? 'italic' : 'normal'
                            }}>Page / Tab Title</div>
                        </div>

                        <div className={tabStyles.livePreviewAdminStatCard}>
                            <div className={tabStyles.livePreviewAdminStatLabel} style={{
                                fontFamily: fontCSS[getFont('fontUI')]
                            }}>TOTAL PAGE VISITS</div>
                            <div className={tabStyles.livePreviewAdminStatValue} style={{
                                fontFamily: fontCSS[getFont('fontHeading')]
                            }}>24,850</div>
                            <div className={tabStyles.livePreviewAdminStatChange} style={{
                                fontFamily: fontCSS[getFont('fontUI')]
                            }}>
                                <span className={tabStyles.livePreviewStatTrend}>â†‘ 12%</span>
                                <span className={tabStyles.livePreviewStatPeriod}>from last week</span>
                            </div>
                        </div>
                    </div>
                </div>

            <div className={tabStyles.formFooter}>
                <Button
                    type="submit"
                    isLoading={loading}
                    className={tabStyles.saveButton}
                >
                    <Save size={18} /> Save Typography Settings
                </Button>
            </div>
            </div>
        </form>
    );
};

export default TypographySection;
