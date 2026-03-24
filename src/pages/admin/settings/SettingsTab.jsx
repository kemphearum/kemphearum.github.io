import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import SettingsService from '../../../services/SettingsService';
import BaseService from '../../../services/BaseService';
import { RefreshCw, Globe, Type, Eye, Trash2, AlertCircle, Activity } from 'lucide-react';
import ImageProcessingService from '../../../services/ImageProcessingService';
import tabStyles from './SettingsTab.module.scss';
import axios from 'axios';
import { useTranslation } from '../../../hooks/useTranslation';

// Shared UI components
import { Button, Dialog, Tabs } from '@/shared/components/ui';

// Section components
import IdentitySection from './components/IdentitySection';
import TypographySection from './components/TypographySection';
import VisualsSection from './components/VisualsSection';
import SyncSection from './components/SyncSection';

const SettingsTab = ({ settingsData, setSettingsData, loading, saveSectionData, sidebarPersistent, setSidebarPersistent, showToast }) => {
    const { t, language } = useTranslation();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
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
        { id: 'identity', label: t('admin.settings.subTabs.identity.label'), description: t('admin.settings.subTabs.identity.description'), icon: Globe },
        { id: 'typography', label: t('admin.settings.subTabs.typography.label'), description: t('admin.settings.subTabs.typography.description'), icon: Type },
        { id: 'visuals', label: t('admin.settings.subTabs.visuals.label'), description: t('admin.settings.subTabs.visuals.description'), icon: Eye },
        { id: 'sync', label: t('admin.settings.subTabs.sync.label'), description: t('admin.settings.subTabs.sync.description'), icon: RefreshCw }
    ];

    // Custom Confirmation Dialog State
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        confirmText: tr('Confirm', 'បញ្ជាក់'),
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
                    message: newState === 'success' ? tr('Build successful! Your site is updated.', 'ការបង្កើតបានជោគជ័យ! គេហទំព័ររបស់អ្នកត្រូវបានធ្វើបច្ចុប្បន្នភាព។') :
                        newState === 'error' ? `${tr('Build failed', 'ការបង្កើតបរាជ័យ')}: ${run.conclusion}` :
                            `${tr('Current Status', 'ស្ថានភាពបច្ចុប្បន្ន')}: ${run.status.replace('_', ' ')}...`
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
            showToast(tr('Please enter your GitHub Personal Access Token first.', 'សូមបញ្ចូល GitHub Personal Access Token ជាមុនសិន។'), 'error');
            return;
        }

        setConfirmDialog({
            isOpen: true,
            title: tr('Trigger Site Rebuild', 'ចាប់ផ្តើមបង្កើតគេហទំព័រឡើងវិញ'),
            message: tr('This will trigger a full site rebuild and deployment. You can track the progress in real-time below.\n\nContinue?', 'វានឹងចាប់ផ្តើមបង្កើត និងដាក់ប្រើគេហទំព័រឡើងវិញទាំងស្រុង។ អ្នកអាចតាមដានវឌ្ឍនភាពបានភ្លាមៗខាងក្រោម។\n\nបន្តទេ?'),
            confirmText: tr('Rebuild Now', 'បង្កើតឡើងវិញឥឡូវនេះ'),
            type: 'warning',
            onConfirm: async () => {
                const startTime = Date.now();
                setRebuildStatus({
                    state: 'loading',
                    message: tr('Initializing sync with GitHub...', 'កំពុងចាប់ផ្ដើមសមកាលកម្មជាមួយ GitHub...'),
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
                        message: tr('Request sent! Waiting for GitHub to start the build...', 'បានផ្ញើសំណើរួច! កំពុងរង់ចាំ GitHub ចាប់ផ្តើមបង្កើត...')
                    }));
                    showToast(tr('Rebuild request sent successfully!', 'បានផ្ញើសំណើបង្កើតឡើងវិញដោយជោគជ័យ!'));
                });

                if (error) {
                    console.error("Rebuild trigger error:", error);
                    let errMsg = error;
                    // axios error handling
                    if (error.response?.status === 401 || error.response?.status === 403) {
                        errMsg = tr('Invalid or expired GitHub Token. Please check your token settings.', 'GitHub Token មិនត្រឹមត្រូវ ឬផុតកំណត់។ សូមពិនិត្យការកំណត់ token របស់អ្នក។');
                    } else if (error.response?.data?.message) {
                        errMsg = `${tr('GitHub Error', 'កំហុស GitHub')}: ${error.response.data.message}`;
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
            title: tr('Initialize Typography Metadata', 'ចាប់ផ្តើម Typography Metadata'),
            message: tr('This will push the default typography options (Fonts, Categories, Defaults) to your database. This is usually only needed once or when adding new fonts to the system.\n\nContinue?', 'វានឹងបញ្ចូលជម្រើស typography លំនាំដើម (ពុម្ពអក្សរ ប្រភេទ និងលំនាំដើម) ទៅកាន់មូលដ្ឋានទិន្នន័យ។ ជាទូទៅត្រូវធ្វើតែម្តង ឬពេលបន្ថែមពុម្ពអក្សរថ្មីទៅប្រព័ន្ធ។\n\nបន្តទេ?'),
            confirmText: tr('Initialize Now', 'ចាប់ផ្តើមឥឡូវនេះ'),
            type: 'info',
            onConfirm: async () => {
                const { error } = await BaseService.safe(async () => {
                    await SettingsService.updateTypographyMetadata(SettingsService.constructor.DEFAULT_TYPOGRAPHY_METADATA);
                    queryClient.invalidateQueries({ queryKey: ['settings', 'metadata', 'typography'] });
                    showToast(tr('Typography metadata initialized successfully!', 'បានចាប់ផ្តើម Typography metadata ដោយជោគជ័យ!'));
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
        return <div className="ui-spinnerContainer">{tr('Loading Typography Settings...', 'កំពុងផ្ទុកការកំណត់ Typography...')}</div>;
    }

    const backgroundLabelMap = {
        plexus: t('admin.settings.sectionMeta.visuals.backgroundStyles.plexus'),
        particles: t('admin.settings.sectionMeta.visuals.backgroundStyles.particles'),
        geometry: t('admin.settings.sectionMeta.visuals.backgroundStyles.geometry'),
        aurora: t('admin.settings.sectionMeta.visuals.backgroundStyles.aurora')
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
        ? t('admin.settings.syncStatus.ready')
        : rebuildStatus.state === 'loading'
            ? t('admin.settings.syncStatus.syncing')
            : rebuildStatus.state === 'requested'
                ? t('admin.settings.syncStatus.queued')
                : rebuildStatus.state === 'success'
                    ? t('admin.settings.syncStatus.healthy')
                    : t('admin.settings.syncStatus.attention');
    const tokenReady = githubToken.trim().length > 0;
    const sectionMeta = {
        identity: {
            count: `${identityFilled}/8`,
            hint: settingsData.favicon
                ? t('admin.settings.sectionMeta.identity.faviconConfigured')
                : t('admin.settings.sectionMeta.identity.addFavicon')
        },
        typography: {
            count: `${fontCategories.length} ${t('admin.settings.sectionMeta.typography.roles')}`,
            hint: metadata
                ? `${typographyCustomized} ${t('admin.settings.sectionMeta.typography.customized')}`
                : t('admin.settings.sectionMeta.typography.metadataSetupAvailable')
        },
        visuals: {
            count: backgroundLabelMap[settingsData.bgStyle || 'plexus'] || t('admin.settings.sectionMeta.visuals.backgroundStyles.plexus'),
            hint: settingsData.bgInteractive ?? true
                ? t('admin.settings.sectionMeta.visuals.interactiveOn')
                : t('admin.settings.sectionMeta.visuals.interactiveOff')
        },
        sync: {
            count: `${mirrors.length} ${t('admin.settings.sectionMeta.sync.mirrors')}`,
            hint: tokenReady
                ? t('admin.settings.sectionMeta.sync.statusForRebuilds', { status: syncStatusLabel })
                : t('admin.settings.sectionMeta.sync.tokenNeededForRebuilds')
        }
    };

    return (
        <div className={tabStyles.tabContentFadeIn}>
            <div className={tabStyles.workspaceShell}>
                <div className={tabStyles.workspaceIntro}>
                    <div className={tabStyles.workspaceCopy}>
                        <span className={tabStyles.workspaceEyebrow}>{tr('Site Operations', 'ប្រតិបត្តិការគេហទំព័រ')}</span>
                        <h2>{tr('Control the brand system, motion, and deployment behavior from one calmer workspace.', 'គ្រប់គ្រងប្រព័ន្ធម៉ាក ចលនា និងឥរិយាបថដាក់ប្រើពី workspace តែមួយដែលស្ងប់ស្ងាត់ជាងមុន។')}</h2>
                        <p>{tr('Settings now group identity, typography, visuals, and sync into clearer workstreams so you can tune the portfolio without digging through dense forms.', 'ការកំណត់ត្រូវបានបែងចែកជា identity, typography, visuals និង sync ឲ្យច្បាស់ ដើម្បីកែតម្រូវ portfolio បានងាយស្រួល។')}</p>
                    </div>
                    <div className={tabStyles.workspaceStats}>
                        <div className={tabStyles.workspaceStat}>
                            <span className={tabStyles.workspaceStatValue}>4</span>
                            <span className={tabStyles.workspaceStatLabel}>{tr('Workstreams', 'លំហូរការងារ')}</span>
                            <span className={tabStyles.workspaceStatHint}>{tr('Identity, typography, visuals, and sync', 'Identity, Typography, Visuals និង Sync')}</span>
                        </div>
                        <div className={tabStyles.workspaceStat}>
                            <span className={tabStyles.workspaceStatValue}>{fontCategories.length}</span>
                            <span className={tabStyles.workspaceStatLabel}>{tr('Type Roles', 'តួនាទីអក្សរ')}</span>
                            <span className={tabStyles.workspaceStatHint}>{tr('Live previews across public and admin UI', 'មើលជាមុនភ្លាមៗលើ UI សាធារណៈ និង Admin')}</span>
                        </div>
                        <div className={tabStyles.workspaceStat}>
                            <span className={tabStyles.workspaceStatValue}>{mirrors.length}</span>
                            <span className={tabStyles.workspaceStatLabel}>{tr('Deploy Targets', 'គោលដៅ Deploy')}</span>
                            <span className={tabStyles.workspaceStatHint}>{tokenReady ? tr('GitHub rebuild control is configured', 'បានកំណត់ការគ្រប់គ្រង rebuild របស់ GitHub') : tr('Add a token to trigger rebuilds', 'បន្ថែម token ដើម្បីចាប់ផ្តើម rebuild')}</span>
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
                        <Button variant="ghost" onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>{tr('Cancel', 'បោះបង់')}</Button>
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

