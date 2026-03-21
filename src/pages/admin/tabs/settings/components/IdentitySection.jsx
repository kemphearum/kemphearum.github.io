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
                <div className={tabStyles.sectionHeader} style={{ marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--input-border)', paddingBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Branding & Identity</h4>
                </div>
                
                <div className={tabStyles.formGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
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
                    
                    <div className={tabStyles.fileInputGroup}>
                        <label style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: '600', 
                            color: 'var(--text-secondary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            display: 'block',
                            marginBottom: '0.4rem'
                        }}>
                            Favicon <span className={tabStyles.hint}>(replaces default)</span>
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {(settingsFavicon || settingsData.favicon) && (
                                <div style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    border: '1px solid var(--input-border)',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    {(previewBase64 || settingsData.favicon) ? (
                                        <img
                                            src={previewBase64 || settingsData.favicon}
                                            alt="Favicon Preview"
                                            style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                                        />
                                    ) : null}
                                </div>
                            )}
                            <div className={tabStyles.fileDropzone} style={{ padding: '0.35rem', flex: 1, minHeight: '44px' }}>
                                <input 
                                    type="file" 
                                    accept="image/x-icon,image/png,image/svg+xml" 
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        setSettingsFavicon(file);
                                        if (!file) setPreviewBase64('');
                                    }} 
                                />
                                <div className={tabStyles.fileDropzoneContent} style={{ flexDirection: 'row', gap: '0.5rem' }}>
                                    <Upload size={14} />
                                    <span style={{ fontSize: '0.7rem' }}>
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

                <div className={tabStyles.formFooter} style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--input-border)', paddingTop: '1.5rem' }}>
                    <Button
                        type="submit"
                        isLoading={loading}
                        className={tabStyles.saveButton}
                        style={{ height: '44px', maxWidth: '240px' }}
                    >
                        <Save size={18} /> Save Identity Settings
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default IdentitySection;
