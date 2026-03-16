import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SettingsService from '../../../services/SettingsService';
import { Upload, Save, Type, Minus, Plus, RefreshCw, CheckCircle, AlertCircle, Key, Eye, EyeOff, Globe, ExternalLink, Trash2, PlusCircle, X, Monitor } from 'lucide-react';
import styles from '../../Admin.module.scss';
import ImageProcessingService from '../../../services/ImageProcessingService';
import axios from 'axios';

import FormSelect from '../components/FormSelect';
import ConfirmDialog from '../components/ConfirmDialog';

const getFontWeight = (key, defaultWeight) => key === 'kantumruy-pro-medium' ? 500 : defaultWeight;

const SettingsTab = ({ settingsData, setSettingsData, loading, saveSectionData, sidebarPersistent, setSidebarPersistent, showToast }) => {
    const queryClient = useQueryClient();
    const { data: metadata } = useQuery({
        queryKey: ['settings', 'metadata', 'typography'],
        queryFn: () => SettingsService.fetchTypographyMetadata(),
        staleTime: Infinity,
    });

    // Use metadata from query or fallback to defaults from service
    const typographyMetadata = metadata || SettingsService.constructor.DEFAULT_TYPOGRAPHY_METADATA;
    
    if (!typographyMetadata) {
        return <div className={styles.loadingContainer}>Loading Typography Settings...</div>;
    }

    const { fontOptions, sizeOptions, weightOptions, fontCategories, fontCSS, presets = [] } = typographyMetadata;

    const [settingsFavicon, setSettingsFavicon] = useState(null);
    const [previewBase64, setPreviewBase64] = useState('');
    const [rebuildStatus, setRebuildStatus] = useState({ 
        state: 'idle', 
        message: '',
        runId: null,
        startTime: null
    });
    
    // GitHub Token States (stored in localStorage, not Firestore)
    const [githubToken, setGithubToken] = useState('');
    const [showToken, setShowToken] = useState(false);

    // Sub-tab Navigation State
    const [activeSubTab, setActiveSubTab] = useState('identity');

    const subTabs = [
        { id: 'identity', label: 'Identity', icon: <Globe size={18} /> },
        { id: 'typography', label: 'Typography', icon: <Type size={18} /> },
        { id: 'visuals', label: 'Visuals', icon: <Eye size={18} /> },
        { id: 'sync', label: 'Site Sync', icon: <RefreshCw size={18} /> }
    ];

    // Custom Confirmation Dialog State
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        confirmText: 'Confirm',
        type: 'warning'
    });

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
                mirrors: settingsData.mirrors || [],
                fontSize: settingsData.fontSize || 'default',
                adminFontOverride: settingsData.adminFontOverride ?? true,
            };
            fontCategories.forEach(c => {
                payload[c.field] = settingsData[c.field] || 'inter';
                payload[c.sizeField] = settingsData[c.sizeField] || c.defaultSize;
                payload[c.weightField] = settingsData[c.weightField] || c.defaultWeight;
                payload[c.italicField] = settingsData[c.italicField] ?? false;
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

    // Polling logic for GitHub Actions
    useEffect(() => {
        let pollInterval;
        let timeoutId;

        const poll = async () => {
            if (!githubToken || !rebuildStatus.startTime) return;

            try {
                const GITHUB_OWNER = 'kemphearum';
                const GITHUB_REPO = 'kemphearum.github.io';
                
                // 1. Try to find the run if we don't have a runId yet
                if (!rebuildStatus.runId) {
                    const runsUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs?event=repository_dispatch&per_page=5`;
                    const response = await axios.get(runsUrl, {
                        headers: {
                            'Authorization': `Bearer ${githubToken}`,
                            'Accept': 'application/vnd.github+json'
                        }
                    });

                    const latestRun = response.data.workflow_runs.find(run => 
                        new Date(run.created_at) >= new Date(rebuildStatus.startTime - 10000) // 10s grace period
                    );

                    if (latestRun) {
                        setRebuildStatus(prev => ({ 
                            ...prev, 
                            runId: latestRun.id,
                            state: latestRun.status === 'completed' ? (latestRun.conclusion === 'success' ? 'success' : 'error') : latestRun.status,
                            message: `Workflow started: ${latestRun.name}`
                        }));
                    }
                    return;
                }

                // 2. Poll the specific run status
                const runUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs/${rebuildStatus.runId}`;
                const response = await axios.get(runUrl, {
                    headers: {
                        'Authorization': `Bearer ${githubToken}`,
                        'Accept': 'application/vnd.github+json'
                    }
                });

                const run = response.data;
                const newState = run.status === 'completed' ? (run.conclusion === 'success' ? 'success' : 'error') : run.status;
                
                setRebuildStatus(prev => ({ 
                    ...prev, 
                    state: newState,
                    message: newState === 'success' ? 'Build successful! Your site is updated.' : 
                             newState === 'error' ? `Build failed: ${run.conclusion}` : 
                             `Current Status: ${run.status.replace('_', ' ')}...`
                }));

                if (run.status === 'completed') {
                    clearInterval(pollInterval);
                    // Clear success message after 15 seconds
                    timeoutId = setTimeout(() => {
                        setRebuildStatus({ state: 'idle', message: '', runId: null, startTime: null });
                    }, 15000);
                }

            } catch (error) {
                console.error("Polling error:", error);
                // Don't stop polling on single error, just log it
            }
        };

        if (rebuildStatus.state !== 'idle' && rebuildStatus.state !== 'success' && rebuildStatus.state !== 'error') {
            poll(); // Immediate poll
            pollInterval = setInterval(poll, 5000); // Pulse every 5 seconds
        }

        return () => {
            if (pollInterval) clearInterval(pollInterval);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [rebuildStatus.state, rebuildStatus.runId, rebuildStatus.startTime, githubToken]);

    const handleTriggerRebuild = async () => {
        if (!githubToken) {
            showToast('Please enter your GitHub Personal Access Token first.', 'error');
            return;
        }

        setConfirmDialog({
            isOpen: true,
            title: 'Trigger Site Rebuild',
            message: 'This will trigger a full site rebuild and deployment. You can track the progress in real-time below.\n\nContinue?',
            confirmText: 'Rebuild Now',
            type: 'warning',
            onConfirm: async () => {
                const startTime = Date.now();
                setRebuildStatus({ 
                    state: 'loading', 
                    message: 'Initializing sync with GitHub...', 
                    runId: null, 
                    startTime 
                });
                
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
                    
                    setRebuildStatus(prev => ({ 
                        ...prev, 
                        state: 'requested', 
                        message: 'Request sent! Waiting for GitHub to start the build...' 
                    }));
                    showToast('Rebuild request sent successfully!');

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
                        message: errMsg,
                        runId: null,
                        startTime: null
                    });
                    showToast(errMsg, 'error');
                }
            }
        });
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

    const handleInitializeMetadata = async () => {
        setConfirmDialog({
            isOpen: true,
            title: 'Initialize Typography Metadata',
            message: 'This will push the default typography options (Fonts, Categories, Defaults) to your database. This is usually only needed once or when adding new fonts to the system.\n\nContinue?',
            confirmText: 'Initialize Now',
            type: 'info',
            onConfirm: async () => {
                try {
                    await SettingsService.updateTypographyMetadata(SettingsService.DEFAULT_TYPOGRAPHY_METADATA);
                    queryClient.invalidateQueries({ queryKey: ['settings', 'metadata', 'typography'] });
                    showToast('Typography metadata initialized successfully!');
                } catch (error) {
                    console.error("Failed to initialize metadata:", error);
                    showToast('Failed to initialize metadata', 'error');
                }
            }
        });
    };

    const getFont = (field) => settingsData[field] || 'inter';
    const getFontSize = (field, fallback) => settingsData[field] || fallback;
    const size = settingsData.fontSize || 'default';
    const adminOverride = settingsData.adminFontOverride ?? true;

    // Default mirrors if none exist
    const defaultMirrors = [
        { name: 'GitHub Pages', url: 'https://kemphearum.github.io/' },
        { name: 'Vercel Production', url: 'https://kemphearum.vercel.app/' },
        { name: 'Vercel Mirror', url: 'https://phearum-info.vercel.app/' },
        { name: 'Firebase Primary', url: 'https://phearum-info.web.app/' },
        { name: 'Firebase Mirror', url: 'https://kem-phearum.web.app/' }
    ];

    const addMirror = () => {
        const currentMirrors = settingsData.mirrors || [];
        setSettingsData({
            ...settingsData,
            mirrors: [...currentMirrors, { name: '', url: '' }]
        });
    };

    const removeMirror = (index) => {
        const newMirrors = settingsData.mirrors.filter((_, i) => i !== index);
        setSettingsData({ ...settingsData, mirrors: newMirrors });
    };

    const mirrors = settingsData.mirrors || defaultMirrors;

    const handleAddMirror = () => {
        const newMirrors = [...mirrors, { name: '', url: '' }];
        setSettingsData({ ...settingsData, mirrors: newMirrors });
    };

    const handleUpdateMirror = (index, field, value) => {
        const newMirrors = [...mirrors];
        newMirrors[index] = { ...newMirrors[index], [field]: value };
        setSettingsData({ ...settingsData, mirrors: newMirrors });
    };

    const handleRemoveMirror = (index) => {
        const newMirrors = mirrors.filter((_, i) => i !== index);
        setSettingsData({ ...settingsData, mirrors: newMirrors });
    };

    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%', gap: '1rem', flexWrap: 'wrap' }}>
                    
                    <nav className={styles.subTabNav}>
                        {subTabs.map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                className={`${styles.subTabBtn} ${activeSubTab === tab.id ? styles.active : ''}`}
                                onClick={() => setActiveSubTab(tab.id)}
                            >
                                {React.cloneElement(tab.icon, { size: 18, style: { flexShrink: 0 } })}
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <form onSubmit={handleSaveSettings} className={styles.form}>
                <div style={{ display: 'contents' }}>
                    {/* ─── Tab 1: Identity ─── */}
                    {/* ─── Tab 1: Identity ─── */}
                {activeSubTab === 'identity' && (
                    <div className={styles.tabContentFadeIn}>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
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
                            <div className={styles.fileDropzone} style={{ padding: '0.45rem', flex: 1, minWidth: '140px' }}>
                                <input type="file" accept="image/x-icon,image/png,image/svg+xml" onChange={(e) => setSettingsFavicon(e.target.files[0])} />
                                <div className={styles.fileDropzoneContent} style={{ flexDirection: 'row', gap: '0.5rem' }}>
                                    <Upload size={16} />
                                    <span style={{ fontSize: '0.75rem' }}>{settingsFavicon ? settingsFavicon.name : (settingsData.favicon ? 'Update Favicon' : 'Upload Icon')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
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
                </div>
        )}

        {/* ─── Tab 2: Typography ─── */}
        {activeSubTab === 'typography' && (
            <div className={styles.tabContentFadeIn}>
                <div className={styles.sectionHeader} style={{ marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--input-border)', paddingBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Typography & Appearance</h4>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--input-border)', borderRadius: '16px', padding: '1.5rem' }}>
                <div className={styles.typographyHeader}>
                    <div className={styles.typographyLabel}>
                        <Type size={20} style={{ color: 'var(--primary-color)' }} />
                        <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Site Typography</span>
                    </div>
                    
                    <div className={styles.typographyControls}>
                            <FormSelect
                                label="Base Size"
                                value={size}
                                onChange={(e) => setSettingsData({ ...settingsData, fontSize: e.target.value })}
                                options={sizeOptions}
                                containerStyle={{
                                    background: 'rgba(255,255,255,0.02)',
                                    padding: '0.75rem 1.25rem',
                                    borderRadius: '12px',
                                    border: '1px solid var(--divider)',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    minWidth: 'fit-content'
                                }}
                                style={{ marginTop: 0, width: '160px', padding: '0.55rem 0.85rem' }}
                            />
                            <div className={styles.buttonGroupMobileStack}>
                                {!metadata && (
                                    <button
                                        type="button"
                                        onClick={handleInitializeMetadata}
                                        className={styles.btnSecondary}
                                        style={{ 
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.4rem',
                                            padding: '0.5rem 1rem', 
                                            background: 'rgba(68, 99, 255, 0.1)', 
                                            borderColor: 'rgba(68, 99, 255, 0.3)', 
                                            color: 'var(--primary-color)', 
                                            fontSize: '0.75rem',
                                            flex: 1,
                                            minWidth: '140px'
                                        }}
                                        title="One-time push of typography defaults to database"
                                    >
                                        <PlusCircle size={14} />
                                        Setup Metadata
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setConfirmDialog({
                                            isOpen: true,
                                            title: 'Reset Typography',
                                            message: 'This will reset all font families, sizes, and weights to their default values (Inter). Your other settings will be preserved.\n\nContinue?',
                                            confirmText: 'Reset Defaults',
                                            type: 'warning',
                                            onConfirm: () => {
                                                const resetData = { ...settingsData };
                                                fontCategories.forEach(cat => {
                                                    resetData[cat.field] = 'inter';
                                                    resetData[cat.sizeField] = cat.defaultSize;
                                                    resetData[cat.weightField] = cat.defaultWeight;
                                                    resetData[cat.italicField] = false;
                                                });
                                                setSettingsData(resetData);
                                            }
                                        });
                                    }}
                                    className={styles.btnSecondary}
                                    style={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.4rem',
                                        padding: '0.5rem 1rem',
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        borderColor: 'var(--input-border)',
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.75rem',
                                        flex: 1,
                                        minWidth: '140px'
                                    }}
                                >
                                    <RefreshCw size={14} />
                                    Reset to Defaults
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Typography Presets */}
                    {presets.length > 0 && (
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', fontWeight: 600 }}>Quick Presets / Brand Styles</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
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
                                        style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid var(--divider)',
                                            borderRadius: '12px',
                                            padding: '1rem',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.4rem',
                                            borderLeft: '3px solid transparent'
                                        }}
                                        className={styles.presetCard}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                            e.currentTarget.style.borderLeftColor = 'var(--primary-color)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                            e.currentTarget.style.borderLeftColor = 'transparent';
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '1.1rem' }}>{preset.icon}</span>
                                            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{preset.label}</span>
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>{preset.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {fontCategories.map(cat => (
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
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '0.5rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '1.1rem' }}>{cat.icon}</span>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{cat.label}</span>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.7, whiteSpace: 'nowrap' }}>{cat.hint}</span>
                                </div>

                                {/* Font Family Select — full width */}
                                <FormSelect
                                    value={getFont(cat.field)}
                                    onChange={(e) => setSettingsData({ ...settingsData, [cat.field]: e.target.value })}
                                    options={fontOptions}
                                    noWrapper
                                    style={{ width: '100%' }}
                                />

                                {/* Weight and Italic Controls in a row */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ flex: 1.5 }}>
                                        <FormSelect
                                            value={settingsData[cat.weightField] || cat.defaultWeight}
                                            onChange={(e) => setSettingsData({ ...settingsData, [cat.weightField]: e.target.value })}
                                            options={weightOptions}
                                            noWrapper
                                            style={{ width: '100%', padding: '0.4rem' }}
                                        />
                                    </div>
                                    <div 
                                        onClick={() => setSettingsData({ ...settingsData, [cat.italicField]: !settingsData[cat.italicField] })}
                                        style={{ 
                                            flex: 1,
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            gap: '0.4rem',
                                            padding: '0.4rem 0.6rem',
                                            background: settingsData[cat.italicField] ? 'rgba(108,99,255,0.2)' : 'rgba(255,255,255,0.03)',
                                            borderRadius: '8px',
                                            border: `1px solid ${settingsData[cat.italicField] ? 'var(--primary-color)' : 'var(--divider)'}`,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            color: settingsData[cat.italicField] ? 'var(--primary-color)' : 'var(--text-secondary)',
                                            fontSize: '0.75rem',
                                            fontWeight: 500
                                        }}
                                    >
                                        <span style={{ fontStyle: 'italic', fontWeight: 'bold' }}>I</span>
                                        Italic
                                    </div>
                                </div>

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
                            <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Use Inter for Admin Panel</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Keep admin panel in Inter regardless of typography settings above. Fonts only apply to the public-facing site.</div>
                        </div>
                    </div>

                    {/* Live Preview */}
                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-secondary)', opacity: 0.6, marginBottom: '-0.25rem' }}>Live Typography Preview</div>
                        
                        {/* 1. Header Preview Card */}
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--divider)', borderRadius: '16px', overflow: 'hidden', transition: 'all 0.3s ease' }}>
                            <div style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--divider)', fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>SITE HEADER</span>
                                <span style={{ opacity: 0.5 }}>Desktop View</span>
                            </div>
                            <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{
                                    fontFamily: fontCSS[getFont('fontLogo')],
                                    fontWeight: settingsData.fontLogoWeight || 700,
                                    fontStyle: settingsData.fontLogoItalic ? 'italic' : 'normal',
                                    fontSize: getFontSize('fontLogoSize', '1.25rem'),
                                    color: 'var(--text-primary)',
                                    letterSpacing: '0.5px'
                                }}>
                                    {settingsData.logoHighlight || 'KEM'}<span style={{ color: 'var(--primary-color)' }}>{settingsData.logoText || 'PHEARUM'}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    {['Home', 'Blog'].map(item => (
                                        <span key={item} style={{
                                            fontFamily: fontCSS[getFont('fontNav')],
                                            fontWeight: settingsData.fontNavWeight || 600,
                                            fontStyle: settingsData.fontNavItalic ? 'italic' : 'normal',
                                            fontSize: getFontSize('fontNavSize', '0.75rem'),
                                            color: item === 'Home' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>{item}</span>
                                    ))}
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5, color: 'var(--text-primary)' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Content & Hero Preview Card */}
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--divider)', borderRadius: '16px', overflow: 'hidden' }}>
                            <div style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--divider)', fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)' }}>MAIN CONTENT & HERO</div>
                            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{
                                    fontFamily: fontCSS[getFont('fontDisplay')],
                                    fontWeight: settingsData.fontDisplayWeight || 800,
                                    fontStyle: settingsData.fontDisplayItalic ? 'italic' : 'normal',
                                    fontSize: `calc(${getFontSize('fontDisplaySize', '2rem')} * 1.4)`, color: 'var(--text-primary)',
                                    lineHeight: 1.1
                                }}>កឹម ភារម្យ</div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <div style={{
                                        fontFamily: fontCSS[getFont('fontHeading')],
                                        fontWeight: settingsData.fontHeadingWeight || 700,
                                        fontStyle: settingsData.fontHeadingItalic ? 'italic' : 'normal',
                                        fontSize: getFontSize('fontHeadingSize', '1.25rem'), color: 'var(--text-primary)',
                                    }}>Heading — ចំណងជើង</div>
                                    <div style={{
                                        fontFamily: fontCSS[getFont('fontSubheading')],
                                        fontWeight: settingsData.fontSubheadingWeight || 600,
                                        fontStyle: settingsData.fontSubheadingItalic ? 'italic' : 'normal',
                                        fontSize: getFontSize('fontSubheadingSize', '1rem'), color: 'var(--text-primary)',
                                        opacity: 0.9
                                    }}>Sub Heading — ចំណងជើងរង</div>
                                </div>

                                <div style={{
                                    fontFamily: fontCSS[getFont('fontBody')],
                                    fontWeight: settingsData.fontBodyWeight || 400,
                                    fontStyle: settingsData.fontBodyItalic ? 'italic' : 'normal',
                                    fontSize: getFontSize('fontBodySize', '0.9rem'), color: 'var(--text-secondary)', lineHeight: 1.7,
                                    maxWidth: '90%'
                                }}>
                                    This is a sample paragraph to preview the body text font. The <span style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>quick brown fox</span> jumps over the lazy dog.
                                    <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem', opacity: 0.8 }}>
                                        <li>High performance architecture</li>
                                        <li>Modern typography system</li>
                                    </ul>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <span style={{
                                        fontFamily: fontCSS[getFont('fontUI')],
                                        fontWeight: settingsData.fontUIWeight || 600,
                                        fontStyle: settingsData.fontUIItalic ? 'italic' : 'normal',
                                        fontSize: getFontSize('fontUISize', '0.8rem'), padding: '0.5rem 1.25rem',
                                        background: 'var(--primary-color)', borderRadius: '8px',
                                        color: 'white',
                                    }}>Primary Button</span>
                                    
                                    <span style={{
                                        fontFamily: fontCSS[getFont('fontUI')],
                                        fontWeight: 600,
                                        fontSize: `calc(${getFontSize('fontUISize', '0.7rem')} * 0.9)`,
                                        padding: '0.2rem 0.6rem',
                                        background: 'rgba(72, 199, 142, 0.1)',
                                        border: '1px solid rgba(72, 199, 142, 0.2)',
                                        borderRadius: '4px',
                                        color: '#48c78e',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>Status: Active</span>

                                    <span style={{
                                        fontFamily: fontCSS[getFont('fontUI')],
                                        fontWeight: settingsData.fontUIWeight || 500,
                                        fontStyle: settingsData.fontUIItalic ? 'italic' : 'normal',
                                        fontSize: getFontSize('fontUISize', '0.75rem'), color: 'var(--text-secondary)',
                                    }}>Secondary Action</span>
                                </div>

                                <div style={{
                                    marginTop: '0.5rem',
                                    padding: '1rem',
                                    background: 'rgba(0,0,0,0.2)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--divider)',
                                    fontFamily: fontCSS[getFont('fontMono')],
                                    fontSize: getFontSize('fontMonoSize', '0.8rem'),
                                    fontWeight: settingsData.fontMonoWeight || 400,
                                    fontStyle: settingsData.fontMonoItalic ? 'italic' : 'normal',
                                    color: '#a0a0b0',
                                    lineHeight: 1.5
                                }}>
                                    <span style={{ color: '#6C63FF' }}>function</span> <span style={{ color: '#FF6584' }}>init</span>() &#123;<br />
                                    &nbsp;&nbsp;<span style={{ color: '#48c78e' }}>// Initializing site...</span><br />
                                    &#125;
                                </div>
                            </div>
                        </div>

                        {/* 3. Footer Preview Card */}
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--divider)', borderRadius: '16px', overflow: 'hidden' }}>
                            <div style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--divider)', fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)' }}>FOOTER PREVIEW (REAL LAYOUT)</div>
                            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                    {/* Brand Section */}
                                    <div style={{ flex: 1, minWidth: '150px' }}>
                                        <div style={{
                                            fontFamily: fontCSS[getFont('fontFooterBrand')],
                                            fontSize: getFontSize('fontFooterBrandSize', '1.15rem'),
                                            fontWeight: settingsData.fontFooterBrandWeight || 700,
                                            fontStyle: settingsData.fontFooterBrandItalic ? 'italic' : 'normal',
                                            color: 'var(--text-primary)',
                                            letterSpacing: '0.5px'
                                        }}>{settingsData.logoHighlight || 'KEM'}<span style={{ color: 'var(--primary-color)' }}>{settingsData.logoText || 'PHEARUM'}</span></div>
                                        <div style={{
                                            fontFamily: fontCSS[getFont('fontFooterTagline')],
                                            fontSize: getFontSize('fontFooterTaglineSize', '0.75rem'),
                                            fontWeight: settingsData.fontFooterTaglineWeight || 400,
                                            fontStyle: settingsData.fontFooterTaglineItalic ? 'italic' : 'normal',
                                            color: 'var(--text-secondary)',
                                            marginTop: '0.2rem'
                                        }}>{settingsData.tagline || 'ICT Security & IT Audit Professional'}</div>
                                    </div>

                                    {/* Mirrors Section */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', minWidth: '150px' }}>
                                        <div style={{
                                            fontFamily: fontCSS[getFont('fontFooterTitle')],
                                            fontSize: getFontSize('fontFooterTitleSize', '0.6rem'),
                                            fontWeight: settingsData.fontFooterTitleWeight || 600,
                                            fontStyle: settingsData.fontFooterTitleItalic ? 'italic' : 'normal',
                                            color: 'var(--text-secondary)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '2px',
                                            opacity: 0.6
                                        }}>Site Mirrors</div>
                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                            <span style={{
                                                padding: '0.2rem 0.4rem',
                                                borderRadius: '4px',
                                                background: 'rgba(255, 255, 255, 0.03)',
                                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                                fontFamily: fontCSS[getFont('fontFooterLink')],
                                                fontSize: getFontSize('fontFooterLinkSize', '0.62rem'),
                                                fontWeight: settingsData.fontFooterLinkWeight || 400,
                                                fontStyle: settingsData.fontFooterLinkItalic ? 'italic' : 'normal',
                                                color: 'var(--text-secondary)'
                                            }}>Mirror Link</span>
                                        </div>
                                    </div>

                                    {/* Social Links Section */}
                                    <div style={{ flex: 1, display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', minWidth: '150px' }}>
                                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--glass-surface)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                            </svg>
                                        </div>
                                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--glass-surface)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ width: '100%', height: '1px', background: 'var(--divider)', opacity: 0.5, margin: '0.5rem 0' }}></div>

                                <div style={{
                                    fontFamily: fontCSS[getFont('fontFooterText')],
                                    fontSize: getFontSize('fontFooterTextSize', '0.68rem'),
                                    fontWeight: settingsData.fontFooterTextWeight || 400,
                                    fontStyle: settingsData.fontFooterTextItalic ? 'italic' : 'normal',
                                    color: 'var(--text-secondary)',
                                    opacity: 0.4,
                                    textAlign: 'center'
                                }}>© 2026 {settingsData.logoHighlight || 'Kem'} {settingsData.logoText || 'Phearum'}. All Rights Reserved.</div>
                            </div>
                        </div>

                        {/* 4. Admin Navigation Preview Card */}
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--divider)', borderRadius: '16px', overflow: 'hidden' }}>
                            <div style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--divider)', fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ADMIN NAVIGATION & BRANDING</div>
                            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--divider)' }}>
                                    <span style={{
                                        fontFamily: fontCSS[getFont('fontAdminBrand')],
                                        fontSize: getFontSize('fontAdminBrandSize', '1.1rem'),
                                        fontWeight: settingsData.fontAdminBrandWeight || 700,
                                        fontStyle: settingsData.fontAdminBrandItalic ? 'italic' : 'normal',
                                        color: 'var(--text-primary)'
                                    }}>Admin<span style={{ color: 'var(--primary-color)' }}>.</span></span>
                                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(108,99,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚙️</div>
                                </div>
                                <div style={{
                                    padding: '0.75rem', borderRadius: '8px', 
                                    background: 'linear-gradient(90deg, rgba(108, 99, 255, 0.1) 0%, transparent 100%)',
                                    borderLeft: '3px solid var(--primary-color)',
                                    fontFamily: fontCSS[getFont('fontAdminMenu')],
                                    fontSize: getFontSize('fontAdminMenuSize', '0.85rem'),
                                    fontWeight: settingsData.fontAdminMenuWeight || 600,
                                    fontStyle: settingsData.fontAdminMenuItalic ? 'italic' : 'normal',
                                    color: 'var(--primary-color)'
                                }}>Sidebar Active Link</div>
                            </div>
                        </div>

                        {/* 5. Admin Dashboard & Tabs Preview Card */}
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--divider)', borderRadius: '16px', overflow: 'hidden' }}>
                            <div style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--divider)', fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ADMIN DASHBOARD & STATS</div>
                            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <div style={{
                                        fontFamily: fontCSS[getFont('fontAdminTab')],
                                        fontSize: getFontSize('fontAdminTabSize', '0.65rem'),
                                        fontWeight: 600, color: 'var(--text-secondary)', opacity: 0.5, textTransform: 'uppercase'
                                    }}>Section</div>
                                    <div style={{
                                        fontFamily: fontCSS[getFont('fontAdminTab')],
                                        fontSize: getFontSize('fontAdminTabSize', '1rem'),
                                        fontWeight: settingsData.fontAdminTabWeight || 700,
                                        fontStyle: settingsData.fontAdminTabItalic ? 'italic' : 'normal',
                                        color: 'var(--text-primary)'
                                    }}>Page / Tab Title</div>
                                </div>
                                
                                {/* Stat Card Preview */}
                                <div style={{ 
                                    background: 'var(--bg-card)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--divider)',
                                    display: 'flex', flexDirection: 'column', gap: '0.2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}>
                                    <div style={{ 
                                        fontFamily: fontCSS[getFont('fontUI')], fontSize: '0.65rem', color: 'var(--text-secondary)', opacity: 0.7, letterSpacing: '0.5px'
                                    }}>TOTAL PAGE VISITS</div>
                                    <div style={{ 
                                        fontFamily: fontCSS[getFont('fontHeading')], fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' 
                                    }}>24,850</div>
                                    <div style={{ 
                                        fontFamily: fontCSS[getFont('fontUI')], fontSize: '0.7rem', color: '#48c78e', display: 'flex', alignItems: 'center', gap: '4px'
                                    }}>
                                        <span>↑ 12%</span>
                                        <span style={{ opacity: 0.6 }}>from last week</span>
                </div>
                </div>
                </div>
                </div>
                </div>
                </div>
                </div>
        )}

                {/* ─── Tab 3: Visuals ─── */}
                {activeSubTab === 'visuals' && (
                    <div className={styles.tabContentFadeIn}>
                        <div className={styles.sectionHeader} style={{ marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--input-border)', paddingBottom: '0.5rem' }}>
                            <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Visual Experience</h4>
                        </div>
                        <div className={styles.visualsGrid}>
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
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Glow Intensity ({settingsData.bgGlowOpacity ?? 50}%)</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={settingsData.bgGlowOpacity ?? 50}
                                    onChange={(e) => setSettingsData({ ...settingsData, bgGlowOpacity: parseInt(e.target.value) })}
                                    style={{ width: '100%', accentColor: 'var(--primary-color)' }}
                                />
                            </div>
                            <div className={styles.inputGroup} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={settingsData.bgInteractive ?? true}
                                        onChange={(e) => setSettingsData({ ...settingsData, bgInteractive: e.target.checked })}
                                        style={{ 
                                            width: '18px', 
                                            height: '18px', 
                                            accentColor: 'var(--primary-color)',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, letterSpacing: '0.2px' }}>
                                        Interactive Mouse Effect
                                    </span>
                                </label>
                                <p style={{ margin: '0.25rem 0 0 2rem', fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
                                    Background particles respond to mouse movement.
                                </p>
                </div>
                </div>
                </div>
                )}

                {/* ─── Tab 4: Site Sync ─── */}
                {activeSubTab === 'sync' && (
                    <div className={styles.tabContentFadeIn}>
                        {/* Site Mirrors Section */}
                        <div className={styles.sectionHeader} style={{ marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--input-border)', paddingBottom: '0.5rem' }}>
                            <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Site Synchronization</h4>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            {settingsData.mirrors.map((mirror, index) => (
                                <div key={index} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--input-border)', borderRadius: '16px', padding: '1.25rem', position: 'relative' }}>
                                    <button type='button' onClick={() => removeMirror(index)} style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', padding: '0.25rem', borderRadius: '50%', color: 'var(--error-color)', transition: 'background 0.2s', border: 'none', background: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><X size={16} /></button>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                                            <label>Mirror Name</label>
                                            <input type='text' value={mirror.name} onChange={(e) => { const newMirrors = [...settingsData.mirrors]; newMirrors[index].name = e.target.value; setSettingsData({ ...settingsData, mirrors: newMirrors }); }} placeholder='e.g. GitHub Pages' />
                                        </div>
                                        <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                                            <label>Repository URL</label>
                                            <input type='text' value={mirror.url} onChange={(e) => { const newMirrors = [...settingsData.mirrors]; newMirrors[index].url = e.target.value; setSettingsData({ ...settingsData, mirrors: newMirrors }); }} placeholder='https://github.com/user/repo' />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button type='button' onClick={addMirror} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '2rem', border: '2px dashed var(--input-border)', borderRadius: '16px', color: 'var(--text-secondary)', transition: 'all 0.2s', background: 'transparent' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary-color)'; e.currentTarget.style.color = 'var(--primary-color)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--input-border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                                <Plus size={24} />
                                <span style={{ fontWeight: 600 }}>Add Mirror Repository</span>
                            </button>
                        </div>

                        {/* Deployment & Refresh Section */}
                        <div className={styles.sectionHeader} style={{ marginTop: '2.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--input-border)', paddingBottom: '0.5rem' }}>
                            <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Deployment & Refresh (No-Backend)</h4>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--input-border)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Github Action</h4>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Trigger a manual rebuild and deployment of your site. This will push your current configuration to GitHub and trigger the configured CI/CD pipeline.</p>
                            </div>

                            {/* GitHub Integration Section */}
                            <div className={styles.sectionHeader} style={{ marginTop: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--input-border)', paddingBottom: '0.5rem' }}>
                                <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>GitHub Integration</h4>
                            </div>
                            <div className={styles.formGrid}>
                                <div className={styles.inputGroup} style={{ position: 'relative' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Key size={16} /> GitHub Personal Access Token
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            type={showToken ? 'text' : 'password'} 
                                            placeholder="ghp_xxxxxxxxxxxx" 
                                            value={githubToken} 
                                            onChange={(e) => setGithubToken(e.target.value)}
                                            style={{ paddingRight: '40px' }}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setShowToken(!showToken)}
                                            style={{ 
                                                position: 'absolute', 
                                                right: '12px', 
                                                top: '50%', 
                                                transform: 'translateY(-50%)',
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '4px'
                                            }}
                                        >
                                            {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <span className={styles.hint}>Used for triggering site rebuilds. Stored locally in your browser.</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                                <button 
                                    type='button' 
                                    disabled={rebuildStatus.state === 'loading'} 
                                    onClick={handleTriggerRebuild} 
                                    className={styles.submitBtn} 
                                    style={{ 
                                        height: '50px', 
                                        width: '100%',
                                        maxWidth: '300px',
                                        background: rebuildStatus.state === 'error' ? 'linear-gradient(135deg, #ef4444, #f87171)' : 'linear-gradient(135deg, var(--primary-color), #8b80ff)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        gap: '0.6rem', 
                                        border: 'none', 
                                        borderRadius: '12px', 
                                        color: 'white', 
                                        fontSize: '1rem', 
                                        fontWeight: '600', 
                                        cursor: rebuildStatus.state === 'loading' ? 'not-allowed' : 'pointer', 
                                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
                                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)', 
                                        opacity: rebuildStatus.state === 'loading' ? 0.7 : 1, 
                                        whiteSpace: 'nowrap',
                                        alignSelf: 'flex-start'
                                    }}
                                >
                                    {rebuildStatus.state === 'loading' ? <><RefreshCw size={18} className={styles.spinning} /><span>Syncing...</span></> : <><RefreshCw size={18} /><span>Trigger Manual Rebuild</span></>}
                                </button>

                                {rebuildStatus.state !== 'idle' && (
                                    <div style={{ padding: '0.5rem 0 1rem 0', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--divider)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Status: <strong style={{ fontWeight: 700, color: rebuildStatus.state === 'success' ? '#48c78e' : rebuildStatus.state === 'error' ? '#f14668' : 'var(--primary-color)' }}>{rebuildStatus.state.toUpperCase()}</strong></span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.7 }}>Last Updated: {rebuildStatus.lastChecked ? new Date(rebuildStatus.lastChecked).toLocaleTimeString() : 'Never'}</span>
                                        </div>
                                        {rebuildStatus.message && <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--primary-color)' }}>{rebuildStatus.message}</div>}
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: '1rem', background: 'rgba(255, 166, 0, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 166, 0, 0.1)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                <AlertCircle size={18} style={{ color: '#ffa600', flexShrink: 0, marginTop: '2px' }} />
                                <div style={{ fontSize: '0.85rem', color: 'rgba(255, 166, 0, 0.9)', lineHeight: '1.4' }}>
                                    <strong>Note:</strong> Since we are using the <strong>No-Backend</strong> version, your GitHub token must be entered above to trigger the build. This ensures 100% free hosting.
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            <div className={styles.formFooter} style={{ marginTop: '2rem' }}>
                <button type="submit" disabled={loading} className={styles.submitBtn} style={{ width: '100%', maxWidth: '400px', height: '52px' }}>
                    {loading ? <><span className={styles.spinner} /> Saving...</> : <><Save size={18} /> Save Settings </>}
                </button>
            </div>
                </div>
            </form>

        <ConfirmDialog 
            confirmDialog={confirmDialog} 
            setConfirmDialog={setConfirmDialog} 
        />
        </div>
    );
};

export default SettingsTab;
