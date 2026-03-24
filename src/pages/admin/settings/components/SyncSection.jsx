import { AlertCircle, Eye, EyeOff, Flame, Github, Globe, Key, Plus, RefreshCw, Save, Terminal, Triangle, X } from 'lucide-react';
import { Button, Input } from '../../../../shared/components/ui';
import FormField from '../../components/FormField';
import tabStyles from '../SettingsTab.module.scss';

const SyncSection = ({
    settingsData,
    setSettingsData,
    githubToken,
    setGithubToken,
    showToken,
    setShowToken,
    rebuildStatus,
    handleTriggerRebuild,
    addMirror,
    removeMirror,
    mirrors,
    onSave,
    loading
}) => {
    const updateMirrorField = (index, field, value) => {
        const sourceMirrors = (Array.isArray(settingsData.mirrors) && settingsData.mirrors.length > 0)
            ? settingsData.mirrors
            : mirrors;
        const nextMirrors = [...sourceMirrors];
        nextMirrors[index] = { ...nextMirrors[index], [field]: value };
        setSettingsData({ ...settingsData, mirrors: nextMirrors });
    };

    const syncStateLabel = rebuildStatus.state === 'idle'
        ? 'Ready'
        : rebuildStatus.state === 'loading'
            ? 'Syncing'
            : rebuildStatus.state === 'requested'
                ? 'Queued'
                : rebuildStatus.state === 'success'
                    ? 'Healthy'
                    : 'Attention';

    return (
        <form onSubmit={onSave} className={tabStyles.tabContentFadeIn}>
            <div className="ui-card">
                <div className={tabStyles.surfaceHeader}>
                    <div className={tabStyles.surfaceCopy}>
                        <span className={tabStyles.surfaceEyebrow}>Site Synchronization</span>
                        <h3 className={tabStyles.surfaceHeadline}>Manage deployment targets and manual rebuild control from one cleaner sync workspace.</h3>
                        <p className={tabStyles.surfaceLead}>Mirror environments and rebuild settings are separated now, so it is easier to understand what is being deployed where and when.</p>
                    </div>
                    <div className={tabStyles.surfaceMeta}>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{mirrors.length}</span>
                            <span className={tabStyles.surfaceMetaLabel}>Mirrors</span>
                            <span className={tabStyles.surfaceMetaHint}>Deployment targets currently configured</span>
                        </div>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{githubToken.trim() ? 'Stored' : 'Missing'}</span>
                            <span className={tabStyles.surfaceMetaLabel}>GitHub Token</span>
                            <span className={tabStyles.surfaceMetaHint}>Saved locally in your browser for rebuild access</span>
                        </div>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{syncStateLabel}</span>
                            <span className={tabStyles.surfaceMetaLabel}>Rebuild Status</span>
                            <span className={tabStyles.surfaceMetaHint}>Current sync health for manual deployment requests</span>
                        </div>
                    </div>
                </div>

                <div className={tabStyles.settingsSplitGrid}>
                    <section className={tabStyles.settingsPanel}>
                        <div className={tabStyles.panelHeader}>
                            <div className={tabStyles.panelTitleGroup}>
                                <span className={tabStyles.panelEyebrow}>Mirror Environments</span>
                                <h4 className={tabStyles.panelTitle}>Manage every deployment destination</h4>
                                <p className={tabStyles.panelDescription}>Keep your live portfolio mirrors organized so you always know which URLs represent production, backup, and alternate hosting.</p>
                            </div>
                            <span className={tabStyles.panelBadge}>{mirrors.length} targets</span>
                        </div>

                        <div className={tabStyles.mirrorsGrid}>
                            {mirrors.map((mirror, index) => {
                                const lowerName = mirror.name.toLowerCase();
                                const lowerUrl = mirror.url.toLowerCase();
                                let PlatformIcon = Globe;
                                if (lowerName.includes('github') || lowerUrl.includes('github.io')) PlatformIcon = Github;
                                if (lowerName.includes('vercel') || lowerUrl.includes('vercel.app')) PlatformIcon = Triangle;
                                if (lowerName.includes('firebase') || lowerUrl.includes('web.app')) PlatformIcon = Flame;
                                if (lowerName.includes('mirror')) PlatformIcon = Terminal;

                                return (
                                    <div key={index} className={tabStyles.mirrorCard}>
                                        <div className={tabStyles.mirrorCardHeader}>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => removeMirror(index)}
                                                className={tabStyles.removeMirrorBtn}
                                                title="Remove Mirror"
                                            >
                                                <X size={16} />
                                            </Button>
                                        </div>

                                        <div className={tabStyles.mirrorContent}>
                                            <div className={tabStyles.mirrorInfo}>
                                                <div className={tabStyles.mirrorIconBox}>
                                                    <PlatformIcon size={20} />
                                                </div>
                                                <div className={tabStyles.mirrorTitleGroup}>
                                                    <h5>{mirror.name || 'Mirror Configuration'}</h5>
                                                    <span>Environment #{index + 1}</span>
                                                </div>
                                            </div>

                                            <FormField label="Mirror Name">
                                                <Input
                                                    value={mirror.name}
                                                    onChange={(e) => updateMirrorField(index, 'name', e.target.value)}
                                                    placeholder="e.g. GitHub Pages"
                                                    className={tabStyles.mirrorInput}
                                                />
                                            </FormField>

                                            <FormField label="Repository URL">
                                                <div className={tabStyles.tokenInputContainer}>
                                                    <Input
                                                        value={mirror.url}
                                                        onChange={(e) => updateMirrorField(index, 'url', e.target.value)}
                                                        placeholder="https://github.com/user/repo"
                                                        className={tabStyles.mirrorInputWithIcon}
                                                    />
                                                    <Globe size={14} className={tabStyles.inputIcon} />
                                                </div>
                                            </FormField>
                                        </div>
                                    </div>
                                );
                            })}

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={addMirror}
                                className={tabStyles.addMirrorBtn}
                            >
                                <div className={tabStyles.iconCircle}>
                                    <Plus size={24} />
                                </div>
                                <div className={tabStyles.btnText}>
                                    <strong>Add Mirror Environment</strong>
                                    <span>Configure another deployment target</span>
                                </div>
                            </Button>
                        </div>
                    </section>

                    <aside className={tabStyles.settingsPanelStack}>
                        <section className={tabStyles.settingsPanel}>
                            <div className={tabStyles.panelHeader}>
                                <div className={tabStyles.panelTitleGroup}>
                                    <span className={tabStyles.panelEyebrow}>Manual Rebuild</span>
                                    <h4 className={tabStyles.panelTitle}>GitHub Actions deployment control</h4>
                                    <p className={tabStyles.panelDescription}>Trigger a rebuild and deployment of the live site without leaving the admin panel.</p>
                                </div>
                                <span className={tabStyles.panelBadge}>{syncStateLabel}</span>
                            </div>

                            <FormField
                                label={<><Key size={14} style={{ marginRight: '6px' }} /> GitHub Personal Access Token</>}
                                hint="Used only for triggering site rebuilds. Stored locally in your browser."
                            >
                                <div className={tabStyles.tokenInputContainer}>
                                    <Input
                                        type={showToken ? 'text' : 'password'}
                                        placeholder="ghp_xxxxxxxxxxxx"
                                        value={githubToken}
                                        onChange={(e) => setGithubToken(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowToken(!showToken)}
                                        className={tabStyles.eyeButton}
                                    >
                                        {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </FormField>

                            <Button
                                type="button"
                                isLoading={rebuildStatus.state === 'loading'}
                                onClick={handleTriggerRebuild}
                                className={`${tabStyles.syncButton} ${rebuildStatus.state === 'error' ? tabStyles['syncButton--error'] : ''}`}
                            >
                                <RefreshCw size={18} />
                                <span>{rebuildStatus.state === 'loading' ? 'Syncing...' : 'Trigger Manual Rebuild'}</span>
                            </Button>

                            {rebuildStatus.state !== 'idle' && (
                                <div className={tabStyles.statusInfo}>
                                    <div>
                                        <span className={tabStyles.statusText}>
                                            Status:{' '}
                                            <strong className={rebuildStatus.state === 'success' ? tabStyles.success : (rebuildStatus.state === 'error' ? tabStyles.error : tabStyles.loading)}>
                                                {rebuildStatus.state.toUpperCase()}
                                            </strong>
                                        </span>
                                        <div className={tabStyles.timestamp}>
                                            Last Updated: {rebuildStatus.lastChecked ? new Date(rebuildStatus.lastChecked).toLocaleTimeString() : 'Never'}
                                        </div>
                                    </div>
                                    {rebuildStatus.message && <div className={tabStyles.rebuildMessage}>{rebuildStatus.message}</div>}
                                </div>
                            )}
                        </section>

                        <section className={tabStyles.settingsPanel}>
                            <div className={tabStyles.panelHeader}>
                                <div className={tabStyles.panelTitleGroup}>
                                    <span className={tabStyles.panelEyebrow}>Important Note</span>
                                    <h4 className={tabStyles.panelTitle}>No-backend rebuild flow</h4>
                                    <p className={tabStyles.panelDescription}>The rebuild action depends on your GitHub token because deployment is handled through hosted CI rather than a custom backend.</p>
                                </div>
                            </div>

                            <div className={tabStyles.warningBanner}>
                                <AlertCircle size={18} className={tabStyles.sectionIcon} />
                                <div className={tabStyles.warningText}>
                                    <strong>Note:</strong> Enter a valid GitHub token above before triggering a rebuild. This keeps the hosting flow backend-free while still allowing controlled deployments.
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>

                <div className={tabStyles.formFooter}>
                    <Button
                        type="submit"
                        isLoading={loading}
                        className={tabStyles.saveButton}
                    >
                        <Save size={18} /> Save Sync Settings
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default SyncSection;
