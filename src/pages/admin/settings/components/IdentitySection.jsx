import React from 'react';
import { ImagePlus, Save, Upload } from 'lucide-react';
import { Button } from '../../../../shared/components/ui';
import FormField from '../../components/FormField';
import FormInput from '../../components/FormInput';
import FormRow from '../../components/FormRow';
import tabStyles from '../SettingsTab.module.scss';

const IdentitySection = ({
    settingsData,
    setSettingsData,
    settingsFavicon,
    setSettingsFavicon,
    previewBase64,
    setPreviewBase64,
    onSave,
    loading
}) => {
    const hasFavicon = Boolean(settingsFavicon || settingsData.favicon || previewBase64);

    return (
        <form onSubmit={onSave} className={tabStyles.tabContentFadeIn}>
            <div className="ui-card">
                <div className={tabStyles.surfaceHeader}>
                    <div className={tabStyles.surfaceCopy}>
                        <span className={tabStyles.surfaceEyebrow}>Identity System</span>
                        <h3 className={tabStyles.surfaceHeadline}>Shape how the portfolio is recognized in tabs, branding, and collection filters.</h3>
                        <p className={tabStyles.surfaceLead}>This view keeps naming, browser assets, and taxonomy controls in one place so brand updates feel deliberate instead of scattered.</p>
                    </div>
                    <div className={tabStyles.surfaceMeta}>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{hasFavicon ? 'Ready' : 'Pending'}</span>
                            <span className={tabStyles.surfaceMetaLabel}>Favicon</span>
                            <span className={tabStyles.surfaceMetaHint}>Upload a small icon for browser tabs</span>
                        </div>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{settingsData.logoHighlight || 'Kem'} {settingsData.logoText || 'Phearum'}</span>
                            <span className={tabStyles.surfaceMetaLabel}>Brand Name</span>
                            <span className={tabStyles.surfaceMetaHint}>Used across logo treatments and previews</span>
                        </div>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{[settingsData.projectFilters, settingsData.blogFilters].filter(Boolean).length}/2</span>
                            <span className={tabStyles.surfaceMetaLabel}>Filter Sets</span>
                            <span className={tabStyles.surfaceMetaHint}>Quick sorting for projects and blog posts</span>
                        </div>
                    </div>
                </div>

                <div className={tabStyles.settingsSectionGrid}>
                    <div className={tabStyles.settingsPrimaryColumn}>
                        <section className={tabStyles.settingsPanel}>
                            <div className={tabStyles.panelHeader}>
                                <div className={tabStyles.panelTitleGroup}>
                                    <span className={tabStyles.panelEyebrow}>Brand Basics</span>
                                    <h4 className={tabStyles.panelTitle}>Name, tagline, and browser copy</h4>
                                    <p className={tabStyles.panelDescription}>These settings define the identity seen in the browser tab, navbar, and footer.</p>
                                </div>
                                <span className={tabStyles.panelBadge}>Core copy</span>
                            </div>

                            <div className={tabStyles.formGrid}>
                                <FormField label="Page Title (Browser Tab)" columns={1}>
                                    <FormInput
                                        placeholder="Kem Phearum | Portfolio"
                                        value={settingsData.title || ''}
                                        onChange={(e) => setSettingsData({ ...settingsData, title: e.target.value })}
                                    />
                                </FormField>

                                <FormField label="Site Tagline" columns={1}>
                                    <FormInput
                                        placeholder="ICT Security & IT Audit Professional"
                                        value={settingsData.tagline || ''}
                                        onChange={(e) => setSettingsData({ ...settingsData, tagline: e.target.value })}
                                    />
                                </FormField>
                            </div>

                            <FormRow>
                                <FormField label="Logo Prefix" columns={1}>
                                    <FormInput
                                        placeholder="Kem"
                                        value={settingsData.logoHighlight || ''}
                                        onChange={(e) => setSettingsData({ ...settingsData, logoHighlight: e.target.value })}
                                    />
                                </FormField>

                                <FormField label="Logo Suffix" columns={1}>
                                    <FormInput
                                        placeholder="Phearum"
                                        value={settingsData.logoText || ''}
                                        onChange={(e) => setSettingsData({ ...settingsData, logoText: e.target.value })}
                                    />
                                </FormField>
                            </FormRow>

                            <FormField label="Footer Copyright Text" columns={1}>
                                <FormInput
                                    placeholder="(c) 2026 Your Name. All Rights Reserved."
                                    value={settingsData.footerText || ''}
                                    onChange={(e) => setSettingsData({ ...settingsData, footerText: e.target.value })}
                                />
                            </FormField>
                        </section>

                        <section className={tabStyles.settingsPanel}>
                            <div className={tabStyles.panelHeader}>
                                <div className={tabStyles.panelTitleGroup}>
                                    <span className={tabStyles.panelEyebrow}>Collection Filters</span>
                                    <h4 className={tabStyles.panelTitle}>Project and blog taxonomy</h4>
                                    <p className={tabStyles.panelDescription}>Keep category names aligned with your published content so filtering feels intentional and predictable.</p>
                                </div>
                                <span className={tabStyles.panelBadge}>Taxonomy</span>
                            </div>

                            <div className={tabStyles.identityFilterGrid}>
                                <FormField label="Project Category Filters" hint="Comma separated" columns={1}>
                                    <FormInput
                                        placeholder="React, Python, Firebase..."
                                        value={settingsData.projectFilters || ''}
                                        onChange={(e) => setSettingsData({ ...settingsData, projectFilters: e.target.value })}
                                    />
                                </FormField>

                                <FormField label="Blog Tag Filters" hint="Comma separated" columns={1}>
                                    <FormInput
                                        placeholder="Tutorial, Tech, Security..."
                                        value={settingsData.blogFilters || ''}
                                        onChange={(e) => setSettingsData({ ...settingsData, blogFilters: e.target.value })}
                                    />
                                </FormField>
                            </div>
                        </section>
                    </div>

                    <aside className={tabStyles.settingsAsideColumn}>
                        <section className={tabStyles.settingsPanel}>
                            <div className={tabStyles.panelHeader}>
                                <div className={tabStyles.panelTitleGroup}>
                                    <span className={tabStyles.panelEyebrow}>Browser Asset</span>
                                    <h4 className={tabStyles.panelTitle}>Favicon uploader</h4>
                                    <p className={tabStyles.panelDescription}>Use a high-contrast icon so the portfolio reads cleanly in tabs, bookmarks, and shortcuts.</p>
                                </div>
                                <span className={tabStyles.panelBadge}>16-256px</span>
                            </div>

                            <FormField label="Browser Favicon" columns={1}>
                                <div className={tabStyles.fileInputWrapper}>
                                    {hasFavicon && (
                                        <div className={tabStyles.faviconPreview}>
                                            {(previewBase64 || settingsData.favicon) ? (
                                                <img src={previewBase64 || settingsData.favicon} alt="Favicon Preview" />
                                            ) : null}
                                        </div>
                                    )}
                                    <div className={tabStyles.fileDropzone}>
                                        <input
                                            type="file"
                                            accept="image/x-icon,image/png,image/svg+xml"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                setSettingsFavicon(file);
                                                if (!file) setPreviewBase64('');
                                            }}
                                        />
                                        <div className={tabStyles.fileDropzoneContent}>
                                            <Upload size={16} />
                                            <div>
                                                <span className={tabStyles.fileDropzoneTitle}>
                                                    {settingsFavicon ? settingsFavicon.name : (settingsData.favicon ? 'Replace current icon' : 'Upload a favicon')}
                                                </span>
                                                <span className={tabStyles.fileDropzoneHint}>PNG, SVG, or ICO. Square artwork works best.</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </FormField>
                        </section>

                        <section className={tabStyles.identityPreviewCard}>
                            <span className={tabStyles.identityPreviewEyebrow}>Identity preview</span>
                            <div className={tabStyles.identityPreviewHeader}>
                                <div className={tabStyles.faviconPreview}>
                                    {(previewBase64 || settingsData.favicon) ? (
                                        <img src={previewBase64 || settingsData.favicon} alt="Current favicon" />
                                    ) : (
                                        <ImagePlus size={20} />
                                    )}
                                </div>
                                <div>
                                    <div className={tabStyles.identityPreviewLogo}>
                                        {settingsData.logoHighlight || 'Kem'} <span>{settingsData.logoText || 'Phearum'}</span>
                                    </div>
                                    <div className={tabStyles.identityPreviewTitle}>{settingsData.title || 'Kem Phearum | Portfolio'}</div>
                                </div>
                            </div>
                            <p className={tabStyles.identityPreviewTagline}>
                                {settingsData.tagline || 'ICT Security & IT Audit Professional'}
                            </p>
                            <div className={tabStyles.identityPreviewMetaList}>
                                <div className={tabStyles.identityPreviewMeta}>
                                    <span>Footer copy</span>
                                    <strong>{settingsData.footerText || '(c) 2026 Your Name. All Rights Reserved.'}</strong>
                                </div>
                                <div className={tabStyles.identityPreviewMeta}>
                                    <span>Filter readiness</span>
                                    <strong>
                                        {[settingsData.projectFilters, settingsData.blogFilters].filter(Boolean).length === 2
                                            ? 'Project and blog filters are configured'
                                            : 'Finish both filter lists for faster content sorting'}
                                    </strong>
                                </div>
                            </div>
                            <ul className={tabStyles.identityChecklist}>
                                <li>Keep the page title short enough to read in a browser tab.</li>
                                <li>Use a favicon with strong contrast and minimal detail.</li>
                                <li>Match category names to the content visitors actually browse.</li>
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
                        <Save size={18} /> Save Identity Changes
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default IdentitySection;
