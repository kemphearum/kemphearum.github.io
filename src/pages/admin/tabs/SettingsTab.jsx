import React, { useState, useEffect } from 'react';
import { Upload, Save, Type } from 'lucide-react';
import styles from '../../Admin.module.scss';
import ImageProcessingService from '../../../services/ImageProcessingService';

const FONT_OPTIONS = [
    { value: 'inter', label: 'Inter' },
    { value: 'kantumruy-pro', label: 'Kantumruy Pro' },
    { value: 'kantumruy-pro-medium', label: 'Kantumruy Pro Medium' },
    { value: 'battambang', label: 'Battambang' },
];

const SIZE_OPTIONS = [
    { value: 'small', label: 'Small (14px)' },
    { value: 'default', label: 'Default (16px)' },
    { value: 'large', label: 'Large (18px)' },
    { value: 'extra-large', label: 'Extra Large (20px)' },
];

const FONT_CSS = {
    'inter': "'Inter', system-ui, -apple-system, sans-serif",
    'kantumruy-pro': "'Kantumruy Pro', system-ui, sans-serif",
    'kantumruy-pro-medium': "'Kantumruy Pro', system-ui, sans-serif",
    'battambang': "'Battambang', system-ui, sans-serif",
};

const FONT_CATEGORIES = [
    { field: 'fontDisplay', label: 'Display / Hero', hint: 'Hero name, banner titles', icon: '🎯' },
    { field: 'fontHeading', label: 'Headings', hint: 'Section titles (H1, H2)', icon: '📌' },
    { field: 'fontSubheading', label: 'Sub Headings', hint: 'Card & modal titles (H3–H6)', icon: '📎' },
    { field: 'fontNav', label: 'Navigation', hint: 'Navbar, sidebar, footer links', icon: '🧭' },
    { field: 'fontBody', label: 'Body / Content', hint: 'Paragraphs, descriptions', icon: '📝' },
    { field: 'fontUI', label: 'UI / Labels', hint: 'Buttons, form labels, badges', icon: '🏷️' },
];

const getFontWeight = (key, defaultWeight) => key === 'kantumruy-pro-medium' ? 500 : defaultWeight;

const SettingsTab = ({ settingsData, setSettingsData, loading, saveSectionData, sidebarPersistent, setSidebarPersistent }) => {
    const [settingsFavicon, setSettingsFavicon] = useState(null);
    const [previewBase64, setPreviewBase64] = useState('');

    useEffect(() => {
        if (!settingsFavicon) {
            setPreviewBase64('');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setPreviewBase64(reader.result);
        reader.readAsDataURL(settingsFavicon);
    }, [settingsFavicon]);

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        try {
            let faviconUrl = settingsData.favicon || '';
            if (settingsFavicon) {
                faviconUrl = await ImageProcessingService.compress(settingsFavicon, { maxSizeMB: 0.05, maxWidthOrHeight: 256 });
            }
            const payload = {
                ...settingsData,
                title: settingsData.title || '',
                favicon: faviconUrl,
                fontSize: settingsData.fontSize || 'default',
                adminFontOverride: settingsData.adminFontOverride ?? true,
            };
            FONT_CATEGORIES.forEach(c => {
                payload[c.field] = settingsData[c.field] || 'inter';
            });
            await saveSectionData('settings', payload);
            setSettingsFavicon(null);
        } catch (error) {
            console.error("Settings handleSave error:", error);
            // Re-throw so Admin.jsx can catch and show its descriptive toast
            throw error;
        }
    };

    const getFont = (field) => settingsData[field] || 'inter';
    const size = settingsData.fontSize || 'default';
    const adminOverride = settingsData.adminFontOverride ?? true;

    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}><h3>⚙️ Settings</h3></div>
            <form onSubmit={handleSaveSettings} className={styles.form}>
                {/* ─── Group 1: Branding & Identity ─── */}
                <div className={styles.sectionHeader} style={{ marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--input-border)', paddingBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Branding & Identity</h4>
                </div>
                <div className={styles.formGrid}>
                    <div className={styles.inputGroup}>
                        <label>Page Title (Browser Tab)</label>
                        <input type="text" placeholder="Kem Phearum | Portfolio" value={settingsData.title || ''} onChange={(e) => setSettingsData({ ...settingsData, title: e.target.value })} />
                    </div>
                </div>
                <div className={styles.formGrid}>
                    <div className={styles.inputGroup}>
                        <label>Logo Highlight</label>
                        <input type="text" placeholder="Kem" value={settingsData.logoHighlight} onChange={(e) => setSettingsData({ ...settingsData, logoHighlight: e.target.value })} />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Logo Text</label>
                        <input type="text" placeholder="Phearum" value={settingsData.logoText} onChange={(e) => setSettingsData({ ...settingsData, logoText: e.target.value })} />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Tagline</label>
                        <input type="text" placeholder="ICT Security & IT Audit Professional" value={settingsData.tagline} onChange={(e) => setSettingsData({ ...settingsData, tagline: e.target.value })} />
                    </div>
                </div>

                <div className={styles.formGrid}>
                    <div className={styles.inputGroup} style={{ flex: 2 }}>
                        <label>Footer Text</label>
                        <input type="text" placeholder="© 2026 Your Name. All Rights Reserved." value={settingsData.footerText} onChange={(e) => setSettingsData({ ...settingsData, footerText: e.target.value })} />
                    </div>
                    <div className={styles.fileInputGroup} style={{ flex: 1 }}>
                        <label>Favicon <span className={styles.hint}>(replaces default)</span></label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {(settingsFavicon || settingsData.favicon) && (
                                <div style={{
                                    width: '42px',
                                    height: '42px',
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
                                            style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                                        />
                                    ) : null}
                                </div>
                            )}
                            <div className={styles.fileDropzone} style={{ padding: '0.45rem', flex: 1 }}>
                                <input type="file" accept="image/x-icon,image/png,image/svg+xml" onChange={(e) => setSettingsFavicon(e.target.files[0])} />
                                <div className={styles.fileDropzoneContent} style={{ flexDirection: 'row', gap: '0.5rem' }}>
                                    <Upload size={16} />
                                    <span style={{ fontSize: '0.75rem' }}>{settingsFavicon ? settingsFavicon.name : (settingsData.favicon ? 'Update Favicon' : 'Upload Icon')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Group 2: Content Discovery ─── */}
                <div className={styles.sectionHeader} style={{ marginTop: '2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--input-border)', paddingBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Content Configuration</h4>
                </div>
                <div className={styles.formGrid}>
                    <div className={styles.inputGroup}>
                        <label>Project Filters <span className={styles.hint}>(comma separated)</span></label>
                        <input type="text" placeholder="React, Python, Firebase..." value={settingsData.projectFilters || ''} onChange={(e) => setSettingsData({ ...settingsData, projectFilters: e.target.value })} />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Blog Filters <span className={styles.hint}>(comma separated)</span></label>
                        <input type="text" placeholder="Tutorial, Tech, Security..." value={settingsData.blogFilters || ''} onChange={(e) => setSettingsData({ ...settingsData, blogFilters: e.target.value })} />
                    </div>
                </div>

                {/* ─── Group 3: Typography & Appearance ─── */}
                <div className={styles.sectionHeader} style={{ marginTop: '2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--input-border)', paddingBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Typography & Appearance</h4>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--input-border)', borderRadius: '16px', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Type size={18} style={{ color: 'var(--primary-color)' }} />
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Site Typography</span>
                        </div>
                        <div className={styles.inputGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <label style={{ margin: 0, whiteSpace: 'nowrap', fontSize: '0.8rem' }}>Base Size</label>
                            <select
                                className={styles.standardSelect}
                                value={size}
                                onChange={(e) => setSettingsData({ ...settingsData, fontSize: e.target.value })}
                                style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                            >
                                {SIZE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Font category grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {FONT_CATEGORIES.map(cat => (
                            <div key={cat.field} className={styles.inputGroup} style={{ margin: 0 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <span>{cat.icon}</span> {cat.label}
                                </label>
                                <select
                                    className={styles.standardSelect}
                                    value={getFont(cat.field)}
                                    onChange={(e) => setSettingsData({ ...settingsData, [cat.field]: e.target.value })}
                                    style={{ fontSize: '0.85rem' }}
                                >
                                    {FONT_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <span className={styles.hint}>{cat.hint}</span>
                            </div>
                        ))}
                    </div>

                    {/* Admin Override Toggle */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.8rem',
                        background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem',
                        borderRadius: '8px', border: '1px solid var(--input-border)',
                        cursor: 'pointer', marginTop: '1rem',
                    }} onClick={() => setSettingsData({ ...settingsData, adminFontOverride: !adminOverride })}>
                        <input type="checkbox" checked={adminOverride} onChange={() => { }} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary-color)' }} />
                        <div>
                            <div style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Use Inter for Admin Panel</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Keep admin panel in Inter regardless of typography settings above. Fonts only apply to the public-facing site.</div>
                        </div>
                    </div>

                    {/* Live Preview */}
                    <div style={{
                        marginTop: '1rem', padding: '1.25rem 1.5rem',
                        background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontFamily: "'Inter', sans-serif" }}>Live Preview</div>
                        <div style={{
                            fontFamily: FONT_CSS[getFont('fontDisplay')],
                            fontWeight: getFontWeight(getFont('fontDisplay'), 700),
                            fontSize: '2rem', marginBottom: '0.25rem', color: 'var(--text-primary)',
                        }}>
                            កឹម ភារម្យ
                        </div>
                        <div style={{
                            fontFamily: FONT_CSS[getFont('fontHeading')],
                            fontWeight: getFontWeight(getFont('fontHeading'), 700),
                            fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)',
                        }}>
                            Heading — ចំណងជើង
                        </div>
                        <div style={{
                            fontFamily: FONT_CSS[getFont('fontSubheading')],
                            fontWeight: getFontWeight(getFont('fontSubheading'), 600),
                            fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-primary)',
                        }}>
                            Sub Heading — ចំណងជើងរង
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.5rem' }}>
                            <span style={{
                                fontFamily: FONT_CSS[getFont('fontNav')],
                                fontWeight: getFontWeight(getFont('fontNav'), 500),
                                fontSize: '0.85rem', color: 'var(--primary-color)',
                            }}>
                                Home &nbsp;·&nbsp; About &nbsp;·&nbsp; Projects
                            </span>
                        </div>
                        <div style={{
                            fontFamily: FONT_CSS[getFont('fontBody')],
                            fontWeight: getFontWeight(getFont('fontBody'), 400),
                            fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7,
                        }}>
                            This is a sample paragraph to preview the body text font. The quick brown fox jumps over the lazy dog.
                        </div>
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                            <span style={{
                                fontFamily: FONT_CSS[getFont('fontUI')],
                                fontWeight: getFontWeight(getFont('fontUI'), 600),
                                fontSize: '0.8rem', padding: '0.3rem 0.8rem',
                                background: 'rgba(108,99,255,0.15)', borderRadius: '6px',
                                color: 'var(--primary-color)',
                            }}>Button</span>
                            <span style={{
                                fontFamily: FONT_CSS[getFont('fontUI')],
                                fontWeight: getFontWeight(getFont('fontUI'), 500),
                                fontSize: '0.75rem', padding: '0.25rem 0.6rem',
                                background: 'rgba(255,255,255,0.05)', borderRadius: '4px',
                                color: 'var(--text-secondary)',
                            }}>Label</span>
                        </div>
                    </div>
                </div>

                {/* ─── Group 4: Visual Experience ─── */}
                <div className={styles.sectionHeader} style={{ marginTop: '2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--input-border)', paddingBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Visual Experience</h4>
                </div>
                <div className={styles.formGrid}>
                    <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                        <label>Background Style Variant</label>
                        <select
                            value={settingsData.bgStyle || 'plexus'}
                            onChange={(e) => setSettingsData({ ...settingsData, bgStyle: e.target.value })}
                            className={styles.inputField}
                        >
                            <option value="plexus">Plexus (Connected Network)</option>
                            <option value="particles">Floating Particles (No Connections)</option>
                            <option value="geometry">Floating Geometry (Squares/Triangles)</option>
                            <option value="aurora">Aurora Only (Pure Gradient, Best Performance)</option>
                        </select>
                        <span className={styles.hint}>Choose the overall visual aesthetic for the animated background.</span>
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Particle Density ({settingsData.bgDensity ?? 50}%)</label>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={settingsData.bgDensity ?? 50}
                            onChange={(e) => setSettingsData({ ...settingsData, bgDensity: parseInt(e.target.value) })}
                            style={{ width: '100%', accentColor: 'var(--primary-color)' }}
                        />
                        <span className={styles.hint}>Higher means more particles</span>
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Animation Speed ({settingsData.bgSpeed ?? 50}%)</label>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={settingsData.bgSpeed ?? 50}
                            onChange={(e) => setSettingsData({ ...settingsData, bgSpeed: parseInt(e.target.value) })}
                            style={{ width: '100%', accentColor: 'var(--primary-color)' }}
                        />
                        <span className={styles.hint}>Speed of background drift</span>
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Aurora Glow Opacity ({settingsData.bgGlowOpacity ?? 50}%)</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={settingsData.bgGlowOpacity ?? 50}
                            onChange={(e) => setSettingsData({ ...settingsData, bgGlowOpacity: parseInt(e.target.value) })}
                            style={{ width: '100%', accentColor: 'var(--primary-color)' }}
                        />
                        <span className={styles.hint}>Intensity of background gradient</span>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--input-border)', cursor: 'pointer', gridColumn: '1 / -1' }}>
                        <input type="checkbox" checked={settingsData.bgInteractive ?? true} onChange={(e) => setSettingsData({ ...settingsData, bgInteractive: e.target.checked })} />
                        <div>
                            <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.9rem' }}>Interactive Particles</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Particles will react and move away from the user's mouse cursor.</div>
                        </div>
                    </label>
                </div>

                {/* ─── Group 5: System Preferences ─── */}
                <div className={styles.sectionHeader} style={{ marginTop: '2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--input-border)', paddingBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>System Preferences</h4>
                </div>
                <div className={styles.formGrid}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--input-border)', cursor: 'pointer', gridColumn: 'span 2' }}>
                        <input type="checkbox" checked={sidebarPersistent} onChange={(e) => setSidebarPersistent(e.target.checked)} />
                        <div>
                            <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.9rem' }}>Keep Sidebar Open on Select</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>The sidebar will stay open after clicking items. Great for desktop users!</div>
                        </div>
                    </label>
                </div>

                <div className={styles.formFooter}>
                    <button type="submit" disabled={loading} className={styles.submitBtn}>
                        {loading ? <><span className={styles.spinner} /> Saving...</> : <><Save size={18} /> Save Changes</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SettingsTab;
