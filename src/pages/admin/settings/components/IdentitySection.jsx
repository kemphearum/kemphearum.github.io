import React from 'react';
import { ImagePlus, Save, Upload } from 'lucide-react';
import { Button } from '../../../../shared/components/ui';
import FormField from '../../components/FormField';
import FormInput from '../../components/FormInput';
import FormRow from '../../components/FormRow';
import tabStyles from '../SettingsTab.module.scss';
import { useTranslation } from '../../../../hooks/useTranslation';

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
    const { language } = useTranslation();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
    const hasFavicon = Boolean(settingsFavicon || settingsData.favicon || previewBase64);

    return (
        <form onSubmit={onSave} className={tabStyles.tabContentFadeIn}>
            <div className="ui-card">
                <div className={tabStyles.surfaceHeader}>
                    <div className={tabStyles.surfaceCopy}>
                        <span className={tabStyles.surfaceEyebrow}>{tr('Identity System', 'ប្រព័ន្ធអត្តសញ្ញាណ')}</span>
                        <h3 className={tabStyles.surfaceHeadline}>{tr('Shape how the portfolio is recognized in tabs, branding, and collection filters.', 'កំណត់របៀបដែល Portfolio ត្រូវបានស្គាល់នៅលើផ្ទាំង ការប្រេន និងតម្រងបញ្ជី។')}</h3>
                        <p className={tabStyles.surfaceLead}>{tr('This view keeps naming, browser assets, and taxonomy controls in one place so brand updates feel deliberate instead of scattered.', 'ផ្ទាំងនេះរួមបញ្ចូលឈ្មោះ Asset Browser និង Taxonomy នៅកន្លែងតែមួយ ដើម្បីងាយកែប្រែម៉ាក។')}</p>
                    </div>
                    <div className={tabStyles.surfaceMeta}>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{hasFavicon ? tr('Ready', 'រួចរាល់') : tr('Pending', 'កំពុងរង់ចាំ')}</span>
                            <span className={tabStyles.surfaceMetaLabel}>{tr('Favicon', 'រូបតំណាង')}</span>
                            <span className={tabStyles.surfaceMetaHint}>{tr('Upload a small icon for browser tabs', 'ផ្ទុកឡើងរូបតំណាងតូចសម្រាប់ផ្ទាំង Browser')}</span>
                        </div>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{settingsData.logoHighlight || tr('Kem', 'ខេម')} {settingsData.logoText || tr('Phearum', 'ភារុំ')}</span>
                            <span className={tabStyles.surfaceMetaLabel}>{tr('Brand Name', 'ឈ្មោះម៉ាក')}</span>
                            <span className={tabStyles.surfaceMetaHint}>{tr('Used across logo treatments and previews', 'ប្រើសម្រាប់ឡូហ្គោ និងការមើលជាមុន')}</span>
                        </div>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{[settingsData.projectFilters, settingsData.blogFilters].filter(Boolean).length}/2</span>
                            <span className={tabStyles.surfaceMetaLabel}>{tr('Filter Sets', 'សំណុំតម្រង')}</span>
                            <span className={tabStyles.surfaceMetaHint}>{tr('Quick sorting for projects and blog posts', 'តម្រៀបរហ័សសម្រាប់ Project និង Blog')}</span>
                        </div>
                    </div>
                </div>

                <div className={tabStyles.settingsSectionGrid}>
                    <div className={tabStyles.settingsPrimaryColumn}>
                        <section className={tabStyles.settingsPanel}>
                            <div className={tabStyles.panelHeader}>
                                <div className={tabStyles.panelTitleGroup}>
                                    <span className={tabStyles.panelEyebrow}>{tr('Brand Basics', 'មូលដ្ឋានម៉ាក')}</span>
                                    <h4 className={tabStyles.panelTitle}>{tr('Name, tagline, and browser copy', 'ឈ្មោះ Tagline និងអត្ថបទ Browser')}</h4>
                                    <p className={tabStyles.panelDescription}>{tr('These settings define the identity seen in the browser tab, navbar, and footer.', 'ការកំណត់ទាំងនេះកំណត់អត្តសញ្ញាណដែលបង្ហាញលើផ្ទាំង Browser Navbar និង Footer។')}</p>
                                </div>
                                <span className={tabStyles.panelBadge}>{tr('Core copy', 'អត្ថបទស្នូល')}</span>
                            </div>

                            <div className={tabStyles.formGrid}>
                                <FormField label={tr('Page Title (Browser Tab)', 'ចំណងជើងទំព័រ (ផ្ទាំង Browser)')} columns={1}>
                                    <FormInput
                                        placeholder={tr('Kem Phearum | Portfolio', 'ខេម ភារុំ | ផតហ្វូលីយ៉ូ')}
                                        value={settingsData.title || ''}
                                        onChange={(e) => setSettingsData({ ...settingsData, title: e.target.value })}
                                    />
                                </FormField>

                                <FormField label={tr('Site Tagline', 'Tagline គេហទំព័រ')} columns={1}>
                                    <FormInput
                                        placeholder={tr('ICT Security & IT Audit Professional', 'អ្នកជំនាញសន្តិសុខ ICT និងសវនកម្ម IT')}
                                        value={settingsData.tagline || ''}
                                        onChange={(e) => setSettingsData({ ...settingsData, tagline: e.target.value })}
                                    />
                                </FormField>
                            </div>

                            <FormRow>
                                <FormField label={tr('Logo Prefix', 'ផ្នែកដើមឡូហ្គោ')} columns={1}>
                                    <FormInput
                                        placeholder={tr('Kem', 'ខេម')}
                                        value={settingsData.logoHighlight || ''}
                                        onChange={(e) => setSettingsData({ ...settingsData, logoHighlight: e.target.value })}
                                    />
                                </FormField>

                                <FormField label={tr('Logo Suffix', 'ផ្នែកចុងឡូហ្គោ')} columns={1}>
                                    <FormInput
                                        placeholder={tr('Phearum', 'ភារុំ')}
                                        value={settingsData.logoText || ''}
                                        onChange={(e) => setSettingsData({ ...settingsData, logoText: e.target.value })}
                                    />
                                </FormField>
                            </FormRow>

                            <FormField label={tr('Footer Copyright Text', 'អត្ថបទរក្សាសិទ្ធិ Footer')} columns={1}>
                                    <FormInput
                                        placeholder={tr('(c) 2026 Your Name. All Rights Reserved.', '(c) 2026 ឈ្មោះរបស់អ្នក។ រក្សាសិទ្ធិគ្រប់យ៉ាង។')}
                                        value={settingsData.footerText || ''}
                                        onChange={(e) => setSettingsData({ ...settingsData, footerText: e.target.value })}
                                    />
                            </FormField>
                        </section>

                        <section className={tabStyles.settingsPanel}>
                            <div className={tabStyles.panelHeader}>
                                <div className={tabStyles.panelTitleGroup}>
                                    <span className={tabStyles.panelEyebrow}>{tr('Collection Filters', 'តម្រងបណ្ដុំ')}</span>
                                    <h4 className={tabStyles.panelTitle}>{tr('Project and blog taxonomy', 'Taxonomy សម្រាប់ Project និង Blog')}</h4>
                                    <p className={tabStyles.panelDescription}>{tr('Keep category names aligned with your published content so filtering feels intentional and predictable.', 'រក្សាឈ្មោះប្រភេទឱ្យត្រូវនឹងខ្លឹមសារដែលបានផ្សាយ ដើម្បីឱ្យការតម្រងមានភាពច្បាស់លាស់។')}</p>
                                </div>
                                <span className={tabStyles.panelBadge}>{tr('Taxonomy', 'Taxonomy')}</span>
                            </div>

                            <div className={tabStyles.identityFilterGrid}>
                                <FormField label={tr('Project Category Filters', 'តម្រងប្រភេទ Project')} hint={tr('Comma separated', 'បំបែកដោយសញ្ញាក្បៀស')} columns={1}>
                                    <FormInput
                                        placeholder={tr('React, Python, Firebase...', 'React, Python, Firebase...')}
                                        value={settingsData.projectFilters || ''}
                                        onChange={(e) => setSettingsData({ ...settingsData, projectFilters: e.target.value })}
                                    />
                                </FormField>

                                <FormField label={tr('Blog Tag Filters', 'តម្រងស្លាក Blog')} hint={tr('Comma separated', 'បំបែកដោយសញ្ញាក្បៀស')} columns={1}>
                                    <FormInput
                                        placeholder={tr('Tutorial, Tech, Security...', 'មេរៀន, បច្ចេកវិទ្យា, សន្តិសុខ...')}
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
                                    <span className={tabStyles.panelEyebrow}>{tr('Browser Asset', 'Asset Browser')}</span>
                                    <h4 className={tabStyles.panelTitle}>{tr('Favicon uploader', 'ការផ្ទុកឡើង Favicon')}</h4>
                                    <p className={tabStyles.panelDescription}>{tr('Use a high-contrast icon so the portfolio reads cleanly in tabs, bookmarks, and shortcuts.', 'ប្រើរូបតំណាងដែលមានកម្រិតផ្ទុយខ្លាំង ដើម្បីមើលឃើញច្បាស់លើផ្ទាំង Bookmark និង Shortcut។')}</p>
                                </div>
                                <span className={tabStyles.panelBadge}>16-256px</span>
                            </div>

                            <FormField label={tr('Browser Favicon', 'Favicon សម្រាប់ Browser')} columns={1}>
                                <div className={tabStyles.fileInputWrapper}>
                                    {hasFavicon && (
                                        <div className={tabStyles.faviconPreview}>
                                            {(previewBase64 || settingsData.favicon) ? (
                                                <img src={previewBase64 || settingsData.favicon} alt={tr('Favicon Preview', 'មើល Favicon ជាមុន')} />
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
                                                    {settingsFavicon ? settingsFavicon.name : (settingsData.favicon ? tr('Replace current icon', 'ជំនួសរូបតំណាងបច្ចុប្បន្ន') : tr('Upload a favicon', 'ផ្ទុកឡើង favicon'))}
                                                </span>
                                                <span className={tabStyles.fileDropzoneHint}>{tr('PNG, SVG, or ICO. Square artwork works best.', 'PNG, SVG ឬ ICO។ រូបការ៉េអាចប្រើបានល្អបំផុត។')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </FormField>
                        </section>

                        <section className={tabStyles.identityPreviewCard}>
                            <span className={tabStyles.identityPreviewEyebrow}>{tr('Identity preview', 'មើលអត្តសញ្ញាណជាមុន')}</span>
                            <div className={tabStyles.identityPreviewHeader}>
                                <div className={tabStyles.faviconPreview}>
                                    {(previewBase64 || settingsData.favicon) ? (
                                        <img src={previewBase64 || settingsData.favicon} alt={tr('Current favicon', 'Favicon បច្ចុប្បន្ន')} />
                                    ) : (
                                        <ImagePlus size={20} />
                                    )}
                                </div>
                                <div>
                                    <div className={tabStyles.identityPreviewLogo}>
                                        {settingsData.logoHighlight || tr('Kem', 'ខេម')} <span>{settingsData.logoText || tr('Phearum', 'ភារុំ')}</span>
                                    </div>
                                    <div className={tabStyles.identityPreviewTitle}>{settingsData.title || tr('Kem Phearum | Portfolio', 'Kem Phearum | ផតហ្វូលីយ៉ូ')}</div>
                                </div>
                            </div>
                            <p className={tabStyles.identityPreviewTagline}>
                                {settingsData.tagline || tr('ICT Security & IT Audit Professional', 'អ្នកជំនាញសុវត្ថិភាព ICT និងសវនកម្ម IT')}
                            </p>
                            <div className={tabStyles.identityPreviewMetaList}>
                                <div className={tabStyles.identityPreviewMeta}>
                                    <span>{tr('Footer copy', 'អត្ថបទ Footer')}</span>
                                    <strong>{settingsData.footerText || tr('(c) 2026 Your Name. All Rights Reserved.', '(c) 2026 ឈ្មោះរបស់អ្នក។ រក្សាសិទ្ធិគ្រប់យ៉ាង។')}</strong>
                                </div>
                                <div className={tabStyles.identityPreviewMeta}>
                                    <span>{tr('Filter readiness', 'ភាពរួចរាល់នៃតម្រង')}</span>
                                    <strong>
                                        {[settingsData.projectFilters, settingsData.blogFilters].filter(Boolean).length === 2
                                            ? tr('Project and blog filters are configured', 'បានកំណត់តម្រង Project និង Blog រួចរាល់')
                                            : tr('Finish both filter lists for faster content sorting', 'បំពេញបញ្ជីតម្រងទាំងពីរ ដើម្បីតម្រៀបខ្លឹមសារបានលឿន')}
                                    </strong>
                                </div>
                            </div>
                            <ul className={tabStyles.identityChecklist}>
                                <li>{tr('Keep the page title short enough to read in a browser tab.', 'រក្សាចំណងជើងទំព័រឱ្យខ្លី ដើម្បីអានងាយលើផ្ទាំង Browser។')}</li>
                                <li>{tr('Use a favicon with strong contrast and minimal detail.', 'ប្រើ favicon ដែលមានភាពផ្ទុយខ្លាំង និងមានលម្អិតតិច។')}</li>
                                <li>{tr('Match category names to the content visitors actually browse.', 'ផ្គូផ្គងឈ្មោះប្រភេទទៅនឹងខ្លឹមសារដែលភ្ញៀវចូលមើលជាក់ស្តែង។')}</li>
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
                        <Save size={18} /> {tr('Save Identity Changes', 'រក្សាទុកការផ្លាស់ប្តូរអត្តសញ្ញាណ')}
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default IdentitySection;
