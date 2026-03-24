import React from 'react';
import { Upload, Save } from 'lucide-react';
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
    return (
        <form onSubmit={onSave} className={tabStyles.tabContentFadeIn}>
            <div className="ui-card">
                <div className={tabStyles.sectionHeader}>
                    <h4>Branding & Identity</h4>
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
                            placeholder="© 2026 Your Name. All Rights Reserved." 
                            value={settingsData.footerText || ''} 
                            onChange={(e) => setSettingsData({ ...settingsData, footerText: e.target.value })} 
                        />
                    </FormField>
                    
                    <div className={tabStyles.inputGroup}>
                        <label className="ui-label">
                            Browser Favicon <span className={tabStyles.hint}>(replaces default icon)</span>
                        </label>
                        <div className={tabStyles.fileInputWrapper}>
                            {(settingsFavicon || settingsData.favicon) && (
                                <div className={tabStyles.faviconPreview}>
                                    {(previewBase64 || settingsData.favicon) ? (
                                        <img
                                            src={previewBase64 || settingsData.favicon}
                                            alt="Favicon Preview"
                                        />
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
                                    <Upload size={14} />
                                    <span>
                                        {settingsFavicon ? settingsFavicon.name : (settingsData.favicon ? 'Update Icon' : 'Upload Icon')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <FormRow>
                        <FormField label="Project Category Filters" hint="(comma separated)" columns={1}>
                            <FormInput 
                                placeholder="React, Python, Firebase..." 
                                value={settingsData.projectFilters || ''} 
                                onChange={(e) => setSettingsData({ ...settingsData, projectFilters: e.target.value })} 
                            />
                        </FormField>

                        <FormField label="Blog Tag Filters" hint="(comma separated)" columns={1}>
                            <FormInput 
                                placeholder="Tutorial, Tech, Security..." 
                                value={settingsData.blogFilters || ''} 
                                onChange={(e) => setSettingsData({ ...settingsData, blogFilters: e.target.value })} 
                            />
                        </FormField>
                    </FormRow>
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
