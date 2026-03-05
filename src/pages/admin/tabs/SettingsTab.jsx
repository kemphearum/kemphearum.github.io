import React, { useState } from 'react';
import { Upload, Save } from 'lucide-react';
import styles from '../../Admin.module.scss';
import ImageProcessingService from '../../../services/ImageProcessingService';

const SettingsTab = ({ settingsData, setSettingsData, loading, saveSectionData, sidebarPersistent, setSidebarPersistent }) => {
    const [settingsFavicon, setSettingsFavicon] = useState(null);

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        let faviconUrl = settingsData.pageFaviconUrl || '';
        if (settingsFavicon) {
            faviconUrl = await ImageProcessingService.compress(settingsFavicon, { maxSizeMB: 0.05, maxWidthOrHeight: 256 });
        }
        await saveSectionData('settings', {
            ...settingsData,
            pageTitle: settingsData.pageTitle || '',
            pageFaviconUrl: faviconUrl
        });
        setSettingsFavicon(null);
    };

    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}><h3>⚙️ Settings</h3></div>
            <form onSubmit={handleSaveSettings} className={styles.form}>
                <div className={styles.formGrid}>
                    <div className={styles.inputGroup}>
                        <label>Page Title (Browser Tab)</label>
                        <input type="text" placeholder="Kem Phearum | Portfolio" value={settingsData.pageTitle || ''} onChange={(e) => setSettingsData({ ...settingsData, pageTitle: e.target.value })} />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Logo Highlight</label>
                        <input type="text" placeholder="Kem" value={settingsData.logoHighlight} onChange={(e) => setSettingsData({ ...settingsData, logoHighlight: e.target.value })} />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Logo Text</label>
                        <input type="text" placeholder="Phearum" value={settingsData.logoText} onChange={(e) => setSettingsData({ ...settingsData, logoText: e.target.value })} />
                    </div>
                </div>
                <div className={styles.inputGroup}>
                    <label>Tagline</label>
                    <input type="text" placeholder="ICT Security & IT Audit Professional" value={settingsData.tagline} onChange={(e) => setSettingsData({ ...settingsData, tagline: e.target.value })} />
                </div>
                <div className={styles.inputGroup}>
                    <label>Footer Text</label>
                    <input type="text" placeholder="© 2026 Your Name. All Rights Reserved." value={settingsData.footerText} onChange={(e) => setSettingsData({ ...settingsData, footerText: e.target.value })} />
                </div>
                <div className={styles.inputGroup}>
                    <label>Project Filters <span className={styles.hint}>(comma separated, overrides auto-detection)</span></label>
                    <input type="text" placeholder="React, Python, Firebase..." value={settingsData.projectFilters || ''} onChange={(e) => setSettingsData({ ...settingsData, projectFilters: e.target.value })} />
                </div>

                {/* Navigation Preferences */}
                <div className={styles.inputGroup}>
                    <label>Navigation Preferences</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid var(--input-border)', cursor: 'pointer' }} onClick={() => setSidebarPersistent(!sidebarPersistent)}>
                        <input
                            type="checkbox"
                            checked={sidebarPersistent}
                            onChange={() => { }}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <div>
                            <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.9rem' }}>Keep Sidebar Open on Select</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>If disabled, the sidebar will automatically collapse when you click a navigation item on large screens.</div>
                        </div>
                    </div>
                </div>

                <div className={styles.inputGroup}>
                    <label>Blog Filters <span className={styles.hint}>(comma separated, overrides auto-detection)</span></label>
                    <input type="text" placeholder="Tutorial, Tech, Security..." value={settingsData.blogFilters || ''} onChange={(e) => setSettingsData({ ...settingsData, blogFilters: e.target.value })} />
                </div>
                <div className={styles.fileInputGroup}>
                    <label>Browser Favicon <span className={styles.hint}>(leave empty to keep current)</span></label>
                    <div className={styles.fileDropzone}>
                        <input type="file" accept="image/x-icon,image/png" onChange={(e) => setSettingsFavicon(e.target.files[0])} />
                        <div className={styles.fileDropzoneContent}>
                            <Upload size={24} />
                            <span>{settingsFavicon ? settingsFavicon.name : 'Upload Favicon'}</span>
                        </div>
                    </div>
                </div>
                <div className={styles.formFooter}>
                    <button type="submit" disabled={loading} className={styles.submitBtn}>
                        {loading ? <><span className={styles.spinner} /> Saving...</> : <><Save size={18} /> Save</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SettingsTab;
