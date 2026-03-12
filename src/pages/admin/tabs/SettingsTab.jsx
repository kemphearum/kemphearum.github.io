import React, { useState, useEffect } from 'react';
import { Upload, Save, Type, Minus, Plus, RefreshCw, CheckCircle, AlertCircle, Key, Eye, EyeOff } from 'lucide-react';
import styles from '../../Admin.module.scss';
import ImageProcessingService from '../../../services/ImageProcessingService';
import axios from 'axios';

import FormSelect from '../components/FormSelect';

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
    { field: 'fontDisplay', sizeField: 'fontDisplaySize', label: 'Display / Hero', hint: 'Hero name, banner titles', icon: '🎯', defaultSize: '2rem' },
    { field: 'fontHeading', sizeField: 'fontHeadingSize', label: 'Headings', hint: 'Section titles (H1, H2)', icon: '📌', defaultSize: '1.25rem' },
    { field: 'fontSubheading', sizeField: 'fontSubheadingSize', label: 'Sub Headings', hint: 'Card & modal titles (H3–H6)', icon: '📎', defaultSize: '1rem' },
    { field: 'fontNav', sizeField: 'fontNavSize', label: 'Navigation', hint: 'Navbar, sidebar, footer links', icon: '🧭', defaultSize: '0.85rem' },
    { field: 'fontBody', sizeField: 'fontBodySize', label: 'Body / Content', hint: 'Paragraphs, descriptions', icon: '📝', defaultSize: '0.9rem' },
    { field: 'fontUI', sizeField: 'fontUISize', label: 'UI / Labels', hint: 'Buttons, form labels, badges', icon: '🏷️', defaultSize: '0.8rem' },
];

const getFontWeight = (key, defaultWeight) => key === 'kantumruy-pro-medium' ? 500 : defaultWeight;

const SettingsTab = ({ settingsData, setSettingsData, loading, saveSectionData, sidebarPersistent, setSidebarPersistent }) => {
    const [settingsFavicon, setSettingsFavicon] = useState(null);
    const [previewBase64, setPreviewBase64] = useState('');
    const [rebuildStatus, setRebuildStatus] = useState({ state: 'idle', message: '' });
    
    // GitHub Token States (stored in localStorage, not Firestore)
    const [githubToken, setGithubToken] = useState('');
    const [showToken, setShowToken] = useState(false);

    useEffect(() => {
        // Load token from localStorage on mount
        const savedToken = localStorage.getItem('github_dispatch_token');
        if (savedToken) setGithubToken(savedToken);

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
                payload[c.sizeField] = settingsData[c.sizeField] || c.defaultSize;
            });
            await saveSectionData('settings', payload);
            setSettingsFavicon(null);

            // Save token separately to localStorage
            if (githubToken) {
                localStorage.setItem('github_dispatch_token', githubToken);
            }
        } catch (error) {
            console.error("Settings handleSave error:", error);
            throw error;
        }
    };

    const handleTriggerRebuild = async () => {
        if (!githubToken) {
            alert('Please enter your GitHub Personal Access Token first.');
            return;
        }

        if (!window.confirm('This will trigger a full site rebuild and deployment using your browser. New blog posts and projects will be pre-rendered. Continue?')) {
            return;
        }

        setRebuildStatus({ state: 'loading', message: 'Connecting to GitHub API...' });
        
        try {
            const GITHUB_OWNER = 'kemphearum';
            const GITHUB_REPO = 'kemphearum.github.io';
            const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/dispatches`;

            await axios.post(
                url,
                { event_type: 'manual_rebuild' },
                {
                    headers: {
                        'Authorization': `Bearer ${githubToken}`,
                        'Accept': 'application/vnd.github+json',
                        'X-GitHub-Api-Version': '2022-11-28'
                    }
                }
            );
            
            setRebuildStatus({ 
                state: 'success', 
                message: 'Successfully triggered rebuild! Deployment typically takes ~2 minutes.' 
            });

            // Reset status after 10 seconds
            setTimeout(() => setRebuildStatus({ state: 'idle', message: '' }), 10000);
        } catch (error) {
            console.error("Rebuild trigger error:", error);
            let errMsg = 'Failed to trigger rebuild.';
            
            if (error.response?.status === 401 || error.response?.status === 403) {
                errMsg = 'Invalid or expired GitHub Token. Please check your token settings.';
            } else if (error.response?.data?.message) {
                errMsg = `GitHub Error: ${error.response.data.message}`;
            }

            setRebuildStatus({ 
                state: 'error', 
                message: errMsg
            });
        }
    };

    const handleSizeAdjust = (field, currentSize, increment = true) => {
        // Parse current value (e.g. "1.2rem" -> 1.2)
        const match = String(currentSize || '1rem').match(/^(\d+\.?\d*)(.*)$/);
        if (!match) return;

        const val = parseFloat(match[1]);
        const unit = match[2] || 'rem';
        const step = unit === 'rem' ? 0.05 : 1;
        const newVal = increment ? val + step : Math.max(0, val - step);

        // Format to fixed decimals if rem to avoid floating point issues (e.g. 1.250000001)
        const formattedVal = unit === 'rem' ? newVal.toFixed(2).replace(/\.?0+$/, '') : Math.round(newVal);

        setSettingsData({ ...settingsData, [field]: `${formattedVal}${unit}` });
    };

    const getFont = (field) => settingsData[field] || 'inter';
    const getFontSize = (field, fallback) => settingsData[field] || fallback;
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
                        <FormSelect
                            label="Base Size"
                            value={size}
                            onChange={(e) => setSettingsData({ ...settingsData, fontSize: e.target.value })}
                            options={SIZE_OPTIONS}
                            containerStyle={{
                                background: 'rgba(255,255,255,0.02)',
                                padding: '0.75rem 1.25rem',
                                borderRadius: '12px',
                                border: '1px solid var(--divider)',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: '1rem'
                            }}
                            style={{ marginTop: 0, width: '180px', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {FONT_CATEGORIES.map(cat => (
                            <div key={cat.field} style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid var(--input-border)',
                                borderRadius: '12px',
                                padding: '1.25rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem',
                                transition: 'border-color 0.2s ease',
                            }}>
                                {/* Category Header */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '1.15rem' }}>{cat.icon}</span>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{cat.label}</span>
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.7 }}>{cat.hint}</span>
                                </div>

                                {/* Font Family Select — full width */}
                                <FormSelect
                                    value={getFont(cat.field)}
                                    onChange={(e) => setSettingsData({ ...settingsData, [cat.field]: e.target.value })}
                                    options={FONT_OPTIONS}
                                    noWrapper
                                    style={{ width: '100%' }}
                                />

                                {/* Size Stepper */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', minWidth: '28px' }}>Size</span>
                                    <div className={styles.sizeStepper} style={{ flex: 1 }}>
                                        <button type="button" onClick={() => handleSizeAdjust(cat.sizeField, settingsData[cat.sizeField] || cat.defaultSize, false)}>
                                            <Minus size={14} />
                                        </button>
                                        <input
                                            type="text"
                                            placeholder={cat.defaultSize}
                                            value={settingsData[cat.sizeField] || ''}
                                            onChange={(e) => setSettingsData({ ...settingsData, [cat.sizeField]: e.target.value })}
                                            title="Font Size (e.g. 1.2rem, 18px)"
                                        />
                                        <button type="button" onClick={() => handleSizeAdjust(cat.sizeField, settingsData[cat.sizeField] || cat.defaultSize, true)}>
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
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
                            fontSize: getFontSize('fontDisplaySize', '2rem'), marginBottom: '0.25rem', color: 'var(--text-primary)',
                        }}>
                            កឹម ភារម្យ
                        </div>
                        <div style={{
                            fontFamily: FONT_CSS[getFont('fontHeading')],
                            fontWeight: getFontWeight(getFont('fontHeading'), 700),
                            fontSize: getFontSize('fontHeadingSize', '1.25rem'), marginBottom: '0.5rem', color: 'var(--text-primary)',
                        }}>
                            Heading — ចំណងជើង
                        </div>
                        <div style={{
                            fontFamily: FONT_CSS[getFont('fontSubheading')],
                            fontWeight: getFontWeight(getFont('fontSubheading'), 600),
                            fontSize: getFontSize('fontSubheadingSize', '1rem'), marginBottom: '0.5rem', color: 'var(--text-primary)',
                        }}>
                            Sub Heading — ចំណងជើងរង
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.5rem' }}>
                            <span style={{
                                fontFamily: FONT_CSS[getFont('fontNav')],
                                fontWeight: getFontWeight(getFont('fontNav'), 500),
                                fontSize: getFontSize('fontNavSize', '0.85rem'), color: 'var(--primary-color)',
                            }}>
                                Home &nbsp;·&nbsp; About &nbsp;·&nbsp; Projects
                            </span>
                        </div>
                        <div style={{
                            fontFamily: FONT_CSS[getFont('fontBody')],
                            fontWeight: getFontWeight(getFont('fontBody'), 400),
                            fontSize: getFontSize('fontBodySize', '0.9rem'), color: 'var(--text-secondary)', lineHeight: 1.7,
                        }}>
                            This is a sample paragraph to preview the body text font. The quick brown fox jumps over the lazy dog.
                        </div>
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                            <span style={{
                                fontFamily: FONT_CSS[getFont('fontUI')],
                                fontWeight: getFontWeight(getFont('fontUI'), 600),
                                fontSize: getFontSize('fontUISize', '0.8rem'), padding: '0.3rem 0.8rem',
                                background: 'rgba(108,99,255,0.15)', borderRadius: '6px',
                                color: 'var(--primary-color)',
                            }}>Button</span>
                            <span style={{
                                fontFamily: FONT_CSS[getFont('fontUI')],
                                fontWeight: getFontWeight(getFont('fontUI'), 500),
                                fontSize: getFontSize('fontUISize', '0.75rem'), padding: '0.25rem 0.6rem',
                                background: 'rgba(255,255,255,0.05)', borderRadius: '4px',
                                color: 'var(--text-secondary)',
                            }}>Label</span>
                        </div>
                    </div>
                </div>

                {/* Visual Experience Section */}
                <div className={styles.sectionHeader} style={{ marginTop: '2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--input-border)', paddingBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Visual Experience</h4>
                </div>
                <div className={styles.formGrid}>
                    <FormSelect
                        label="Background Style Variant"
                        value={settingsData.bgStyle || 'plexus'}
                        onChange={(e) => setSettingsData({ ...settingsData, bgStyle: e.target.value })}
                        options={[
                            { value: 'plexus', label: '🕸️ Plexus (Connected Lines)' },
                            { value: 'particles', label: '✨ Dust Particles' },
                            { value: 'geometry', label: '📐 Floating Geometry' },
                            { value: 'aurora', label: '🌈 Aurora Borealis' }
                        ]}
                        fullWidth
                    />
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
                    </div>
                </div>

                {/* Deployment & Refresh Section */}
                <div className={styles.sectionHeader} style={{ marginTop: '2.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--input-border)', paddingBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Deployment & Refresh (No-Backend)</h4>
                </div>
                <div style={{ 
                    background: 'rgba(255,255,255,0.02)', 
                    border: '1px solid var(--input-border)', 
                    borderRadius: '16px', 
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                        <div style={{ 
                            background: 'rgba(108,99,255,0.1)', 
                            padding: '0.75rem', 
                            borderRadius: '12px',
                            color: 'var(--primary-color)' 
                        }}>
                            <RefreshCw size={24} className={rebuildStatus.state === 'loading' ? styles.spinning : ''} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h5 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', color: 'var(--text-primary)' }}>Site Snapshot Sync</h5>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                Trigger a full site rebuild directly from your browser. This ensures all your latest 
                                <strong> Blog Posts</strong> and <strong>Projects</strong> are pre-rendered into 
                                static HTML for speed and SEO.
                            </p>
                        </div>
                    </div>

                    {/* GitHub Token Input Layer */}
                    <div style={{ 
                        background: 'rgba(255,255,255,0.03)', 
                        padding: '1.25rem', 
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Key size={16} style={{ color: 'var(--primary-color)' }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>GitHub Access Token</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>Stored only in your browser</span>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <input 
                                type={showToken ? "text" : "password"}
                                value={githubToken}
                                onChange={(e) => setGithubToken(e.target.value)}
                                placeholder="ghp_..."
                                style={{ 
                                    width: '100%', 
                                    paddingRight: '40px',
                                    fontFamily: 'monospace',
                                    fontSize: '0.85rem',
                                    background: 'rgba(0,0,0,0.2)'
                                }}
                            />
                            <button 
                                type="button"
                                onClick={() => setShowToken(!showToken)}
                                style={{ 
                                    position: 'absolute', 
                                    right: '10px', 
                                    top: '50%', 
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    padding: '5px',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer'
                                }}
                            >
                                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button 
                        type="button" 
                        disabled={rebuildStatus.state === 'loading'}
                        onClick={handleTriggerRebuild}
                        className={styles.submitBtn}
                        style={{ 
                            width: '100%', 
                            padding: '1rem', 
                            background: rebuildStatus.state === 'error' ? 'var(--error-color)' : 'var(--primary-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem'
                        }}
                    >
                        {rebuildStatus.state === 'loading' ? (
                            <>Connecting to GitHub API...</>
                        ) : (
                            <><RefreshCw size={18} /> Rebuild & Refresh Site</>
                        )}
                    </button>

                    {rebuildStatus.state !== 'idle' && (
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.75rem', 
                            padding: '0.75rem 1rem', 
                            borderRadius: '10px',
                            background: rebuildStatus.state === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                            border: `1px solid ${rebuildStatus.state === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                            color: rebuildStatus.state === 'success' ? '#4ade80' : '#f87171',
                            fontSize: '0.85rem'
                        }}>
                            {rebuildStatus.state === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                            {rebuildStatus.message}
                        </div>
                    )}
                    
                    <div style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-secondary)', 
                        padding: '0.75rem', 
                        background: 'rgba(255,255,255,0.02)', 
                        borderRadius: '8px',
                        borderLeft: '3px solid var(--primary-color)'
                    }}>
                        <strong>Note:</strong> Since we are using the <strong>No-Backend</strong> version, your GitHub 
                        token must be entered above to trigger the build. This ensures 100% free hosting.
                    </div>
                </div>

                <div className={styles.formFooter} style={{ marginTop: '2rem' }}>
                    <button type="submit" disabled={loading} className={styles.submitBtn}>
                        {loading ? <><span className={styles.spinner} /> Saving...</> : <><Save size={18} /> Save Settings </>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SettingsTab;
