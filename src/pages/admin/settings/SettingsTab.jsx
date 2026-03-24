import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import SettingsService from '../../../services/SettingsService';
import BaseService from '../../../services/BaseService';
import { RefreshCw, Globe, Type, Eye, Trash2, AlertCircle, Activity } from 'lucide-react';
import ImageProcessingService from '../../../services/ImageProcessingService';
import tabStyles from './SettingsTab.module.scss';
import axios from 'axios';

// Shared UI components
import { Button, Dialog, Tabs } from '@/shared/components/ui';

// Section components
import IdentitySection from './components/IdentitySection';
import TypographySection from './components/TypographySection';
import VisualsSection from './components/VisualsSection';
import SyncSection from './components/SyncSection';

const SettingsTab = ({ settingsData, setSettingsData, loading, saveSectionData, sidebarPersistent, setSidebarPersistent, showToast }) => {
    const queryClient = useQueryClient();
    const { data: metadata } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
        queryKey: ['settings', 'metadata', 'typography'],
        queryFn: () => SettingsService.fetchTypographyMetadata(),
    });

    // Use metadata from query or fallback to defaults from service
    const typographyMetadata = metadata || SettingsService.constructor?.DEFAULT_TYPOGRAPHY_METADATA || {};

    const {
        fontCategories = [],
        fontCSS = {}
    } = typographyMetadata;

    const [settingsFavicon, setSettingsFavicon] = useState(null);
    const [previewBase64, setPreviewBase64] = useState('');
    const [rebuildStatus, setRebuildStatus] = useState({
        state: 'idle',
        message: '',
        runId: null,
        startTime: null
    });

    // GitHub Token States (stored in localStorage, not Firestore)
    const [githubToken, setGithubToken] = useState(() => {
        if (typeof window === 'undefined') return '';
        return localStorage.getItem('github_dispatch_token') || '';
    });
    const [showToken, setShowToken] = useState(false);

    // Sub-tab Navigation State
    const [activeSubTab, setActiveSubTab] = useState('identity');

    const subTabs = [
        { id: 'identity', label: 'Identity', description: 'Browser title, logo system, filters, and favicon.', icon: Globe },
        { id: 'typography', label: 'Typography', description: 'Font roles, presets, previews, and admin override.', icon: Type },
        { id: 'visuals', label: 'Visuals', description: 'Background motion, particle tuning, and interface behavior.', icon: Eye },
        { id: 'sync', label: 'Site Sync', description: 'Mirrors, GitHub token, and manual rebuild control.', icon: RefreshCw }
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
        if (!settingsFavicon) return;
        const reader = new FileReader();
        reader.onloadend = () => setPreviewBase64(reader.result);
        reader.readAsDataURL(settingsFavicon);
    }, [settingsFavicon]);

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        const { error } = await BaseService.safe(async () => {
            const normalizedGithubToken = githubToken.trim();
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
                sidebarPersistent,
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
            if (normalizedGithubToken) {
                localStorage.setItem('github_dispatch_token', normalizedGithubToken);
            } else {
                localStorage.removeItem('github_dispatch_token');
            }
        });

        if (error) {
            console.error("Settings handleSave error:", error);
            showToast(error, 'error');
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

                const { error } = await BaseService.safe(async () => {
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
                });

                if (error) {
                    console.error("Rebuild trigger error:", error);
                    let errMsg = error;
                    // axios error handling
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
                const { error } = await BaseService.safe(async () => {
                    await SettingsService.updateTypographyMetadata(SettingsService.constructor.DEFAULT_TYPOGRAPHY_METADATA);
                    queryClient.invalidateQueries({ queryKey: ['settings', 'metadata', 'typography'] });
                    showToast('Typography metadata initialized successfully!');
                });
                if (error) {
                    console.error("Failed to initialize metadata:", error);
                    showToast(error, 'error');
                }
            }
        });
    };

    // Default mirrors if none exist
    const defaultMirrors = [
        { name: 'GitHub Pages', url: 'https://kemphearum.github.io/' },
        { name: 'Vercel Production', url: 'https://kemphearum.vercel.app/' },
        { name: 'Vercel Mirror', url: 'https://phearum-info.vercel.app/' },
        { name: 'Firebase Primary', url: 'https://phearum-info.web.app/' },
        { name: 'Firebase Mirror', url: 'https://kem-phearum.web.app/' }
    ];

    const mirrors = Array.isArray(settingsData.mirrors) && settingsData.mirrors.length > 0
        ? settingsData.mirrors
        : defaultMirrors;

    const addMirror = () => {
        const currentMirrors = mirrors;
        setSettingsData({
            ...settingsData,
            mirrors: [...currentMirrors, { name: '', url: '' }]
        });
    };

    const removeMirror = (index) => {
        const newMirrors = mirrors.filter((_, i) => i !== index);
        setSettingsData({ ...settingsData, mirrors: newMirrors });
    };


    if (!typographyMetadata) {
        return <div className="ui-spinnerContainer">Loading Typography Settings...</div>;
    }

    const backgroundLabelMap = {
        plexus: 'Plexus',
        particles: 'Particles',
        geometry: 'Geometry',
        aurora: 'Aurora'
    };

    const identityFields = [
        settingsData.title,
        settingsData.tagline,
        settingsData.logoHighlight,
        settingsData.logoText,
        settingsData.footerText,
        settingsData.favicon,
        settingsData.projectFilters,
        settingsData.blogFilters
    ];
    const identityFilled = identityFields.filter(Boolean).length;
    const typographyCustomized = fontCategories.filter((category) =>
        settingsData[category.field] ||
        settingsData[category.sizeField] ||
        settingsData[category.weightField] ||
        settingsData[category.italicField]
    ).length;
    const syncStatusLabel = rebuildStatus.state === 'idle'
        ? 'Ready'
        : rebuildStatus.state === 'loading'
            ? 'Syncing'
            : rebuildStatus.state === 'requested'
                ? 'Queued'
                : rebuildStatus.state === 'success'
                    ? 'Healthy'
                    : 'Attention';
    const tokenReady = githubToken.trim().length > 0;
    const sectionMeta = {
        identity: {
            count: `${identityFilled}/8`,
            hint: settingsData.favicon ? 'Favicon configured' : 'Add a favicon'
        },
        typography: {
            count: `${fontCategories.length} roles`,
            hint: metadata ? `${typographyCustomized} customized` : 'Metadata setup available'
        },
        visuals: {
            count: backgroundLabelMap[settingsData.bgStyle || 'plexus'] || 'Plexus',
            hint: settingsData.bgInteractive ?? true ? 'Interactive motion on' : 'Interactive motion off'
        },
        sync: {
            count: `${mirrors.length} mirrors`,
            hint: tokenReady ? `${syncStatusLabel} for rebuilds` : 'Token needed for rebuilds'
        }
    };

    return (
        <div className={tabStyles.tabContentFadeIn}>
            <div className={tabStyles.workspaceShell}>
                <div className={tabStyles.workspaceIntro}>
                    <div className={tabStyles.workspaceCopy}>
                        <span className={tabStyles.workspaceEyebrow}>Site Operations</span>
                        <h2>Control the brand system, motion, and deployment behavior from one calmer workspace.</h2>
                        <p>Settings now group identity, typography, visuals, and sync into clearer workstreams so you can tune the portfolio without digging through dense forms.</p>
                    </div>
                    <div className={tabStyles.workspaceStats}>
                        <div className={tabStyles.workspaceStat}>
                            <span className={tabStyles.workspaceStatValue}>4</span>
                            <span className={tabStyles.workspaceStatLabel}>Workstreams</span>
                            <span className={tabStyles.workspaceStatHint}>Identity, typography, visuals, and sync</span>
                        </div>
                        <div className={tabStyles.workspaceStat}>
                            <span className={tabStyles.workspaceStatValue}>{fontCategories.length}</span>
                            <span className={tabStyles.workspaceStatLabel}>Type Roles</span>
                            <span className={tabStyles.workspaceStatHint}>Live previews across public and admin UI</span>
                        </div>
                        <div className={tabStyles.workspaceStat}>
                            <span className={tabStyles.workspaceStatValue}>{mirrors.length}</span>
                            <span className={tabStyles.workspaceStatLabel}>Deploy Targets</span>
                            <span className={tabStyles.workspaceStatHint}>{tokenReady ? 'GitHub rebuild control is configured' : 'Add a token to trigger rebuilds'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className={tabStyles.subTabNav}>
                <Tabs.List className={tabStyles.subtabsList}>
                    {subTabs.map((tab) => (
                        <Tabs.Trigger
                            key={tab.id}
                            value={tab.id}
                            className={tabStyles.subTabTrigger}
                        >
                            <span className={tabStyles.triggerIcon}>
                                <tab.icon size={18} />
                            </span>
                            <span className={tabStyles.triggerBody}>
                                <span className={tabStyles.triggerTitleRow}>
                                    <strong>{tab.label}</strong>
                                    <span className={tabStyles.triggerCount}>{sectionMeta[tab.id].count}</span>
                                </span>
                                <span className={tabStyles.triggerDescription}>{tab.description}</span>
                                <span className={tabStyles.triggerHint}>{sectionMeta[tab.id].hint}</span>
                            </span>
                        </Tabs.Trigger>
                    ))}
                </Tabs.List>

                <Tabs.Content value="identity" className={tabStyles.tabPanel}>
                    <IdentitySection 
                        settingsData={settingsData}
                        setSettingsData={setSettingsData}
                        settingsFavicon={settingsFavicon}
                        setSettingsFavicon={setSettingsFavicon}
                        previewBase64={previewBase64}
                        setPreviewBase64={setPreviewBase64}
                        onSave={handleSaveSettings}
                        loading={loading}
                    />
                </Tabs.Content>

                <Tabs.Content value="typography" className={tabStyles.tabPanel}>
                    <TypographySection 
                        settingsData={settingsData}
                        setSettingsData={setSettingsData}
                        metadata={!!metadata}
                        typographyMetadata={typographyMetadata}
                        handleInitializeMetadata={handleInitializeMetadata}
                        handleSizeAdjust={handleSizeAdjust}
                        fontCSS={fontCSS}
                        onSave={handleSaveSettings}
                        loading={loading}
                    />
                </Tabs.Content>

                <Tabs.Content value="visuals" className={tabStyles.tabPanel}>
                    <VisualsSection 
                        settingsData={settingsData}
                        setSettingsData={setSettingsData}
                        sidebarPersistent={sidebarPersistent}
                        setSidebarPersistent={setSidebarPersistent}
                        onSave={handleSaveSettings}
                        loading={loading}
                    />
                </Tabs.Content>

                <Tabs.Content value="sync" className={tabStyles.tabPanel}>
                    <SyncSection 
                        settingsData={settingsData}
                        setSettingsData={setSettingsData}
                        githubToken={githubToken}
                        setGithubToken={setGithubToken}
                        showToken={showToken}
                        setShowToken={setShowToken}
                        rebuildStatus={rebuildStatus}
                        handleTriggerRebuild={handleTriggerRebuild}
                        addMirror={addMirror}
                        removeMirror={removeMirror}
                        mirrors={mirrors}
                        onSave={handleSaveSettings}
                        loading={loading}
                    />
                </Tabs.Content>
            </Tabs>

            <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>
                <Dialog.Content maxWidth="440px">
                    <Dialog.Header>
                        <Dialog.Title className={`${tabStyles.dialogTitle} ${confirmDialog.type === 'danger' ? tabStyles['dialogTitle--danger'] : (confirmDialog.type === 'warning' ? tabStyles['dialogTitle--warning'] : tabStyles['dialogTitle--info'])}`}>
                            {confirmDialog.type === 'danger' ? <Trash2 size={20} /> : (confirmDialog.type === 'warning' ? <AlertCircle size={20} /> : <Activity size={20} />)} {confirmDialog.title}
                        </Dialog.Title>
                        <Dialog.Close />
                    </Dialog.Header>
                    <Dialog.Body className={tabStyles.dialogBody}>
                        {confirmDialog.message}
                    </Dialog.Body>
                    <Dialog.Footer>
                        <Button variant="ghost" onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>Cancel</Button>
                        <Button 
                            variant={confirmDialog.type === 'danger' ? 'danger' : 'primary'}
                            onClick={() => { confirmDialog.onConfirm?.(); setConfirmDialog(prev => ({ ...prev, isOpen: false })); }}
                        >
                            {confirmDialog.confirmText}
                        </Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog>
        </div>
    );
};

export default SettingsTab;

