import React from 'react';
import { Upload, Save } from 'lucide-react';
import { Input, Button } from '../../../../../shared/components/ui';
import FormRow from '../../../components/FormRow';
import styles from '../../../../Admin.module.scss';
import tabStyles from '../../SettingsTab.module.scss';

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
                    <FormRow label="Page Title (Browser Tab)" columns={1}>
                        <Input 
                            placeholder="Kem Phearum | Portfolio" 
                            value={settingsData.title || ''} 
                            onChange={(e) => setSettingsData({ ...settingsData, title: e.target.value })} 
                        />
                    </FormRow>

                    <FormRow label="Site Tagline" columns={1}>
                        <Input 
                            placeholder="ICT Security & IT Audit Professional" 
                            value={settingsData.tagline || ''} 
                            onChange={(e) => setSettingsData({ ...settingsData, tagline: e.target.value })} 
                        />
                    </FormRow>

                    <FormRow label="Logo Prefix" columns={1}>
                        <Input 
                            placeholder="Kem" 
                            value={settingsData.logoHighlight || ''} 
                            onChange={(e) => setSettingsData({ ...settingsData, logoHighlight: e.target.value })} 
                        />
                    </FormRow>

                    <FormRow label="Logo Suffix" columns={1}>
                        <Input 
                            placeholder="Phearum" 
                            value={settingsData.logoText || ''} 
                            onChange={(e) => setSettingsData({ ...settingsData, logoText: e.target.value })} 
                        />
                    </FormRow>

                    <FormRow label="Footer Text" columns={1}>
                        <Input 
                            placeholder="© 2026 Your Name. All Rights Reserved." 
                            value={settingsData.footerText || ''} 
                            onChange={(e) => setSettingsData({ ...settingsData, footerText: e.target.value })} 
                        />
                    </FormRow>
                    
                    <div className={tabStyles.inputGroup}>
                        <label>
                            Favicon <span className={tabStyles.hint}>(replaces default)</span>
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
                                        {settingsFavicon ? settingsFavicon.name : (settingsData.favicon ? 'Update' : 'Upload Icon')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <FormRow label="Project Filters" hint="(comma separated)" columns={1}>
                        <Input 
                            placeholder="React, Python, Firebase..." 
                            value={settingsData.projectFilters || ''} 
                            onChange={(e) => setSettingsData({ ...settingsData, projectFilters: e.target.value })} 
                        />
                    </FormRow>

                    <FormRow label="Blog Filters" hint="(comma separated)" columns={1}>
                        <Input 
                            placeholder="Tutorial, Tech, Security..." 
                            value={settingsData.blogFilters || ''} 
                            onChange={(e) => setSettingsData({ ...settingsData, blogFilters: e.target.value })} 
                        />
                    </FormRow>
                </div>

                <div className={tabStyles.formFooter}>
                    <Button
                        type="submit"
                        isLoading={loading}
                        className={tabStyles.saveButton}
                    >
                        <Save size={18} /> Save Identity Settings
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default IdentitySection;
