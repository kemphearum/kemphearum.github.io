import { Globe, Github, Triangle, Flame, Terminal, X, Key, EyeOff, Eye, RefreshCw, AlertCircle, Plus, Save } from 'lucide-react';
import { Button, Input } from '../../../../shared/components/ui';
import FormField from '../../components/FormField';
import FormRow from '../../components/FormRow';
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

    return (
        <form onSubmit={onSave} className={tabStyles.tabContentFadeIn}>
            <div className="ui-card">
                {/* Site Mirrors Section */}
                <div className={tabStyles.sectionHeader}>
                    <h4>Site Synchronization</h4>
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
                                        type='button'
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
                                            <h5>Mirror Configuration</h5>
                                            <span>#{index + 1} Environment</span>
                                        </div>
                                    </div>

                                    <FormField label="Mirror Name">
                                        <Input
                                            value={mirror.name}
                                            onChange={(e) => updateMirrorField(index, 'name', e.target.value)}
                                            placeholder='e.g. GitHub Pages'
                                            className={tabStyles.mirrorInput}
                                        />
                                    </FormField>
                                    <FormField label="Repository URL">
                                        <div className={tabStyles.tokenInputContainer}>
                                            <Input
                                                value={mirror.url}
                                                onChange={(e) => updateMirrorField(index, 'url', e.target.value)}
                                                placeholder='https://github.com/user/repo'
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
                        type='button'
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

                {/* Deployment & Refresh Section */}
                <div className={tabStyles.sectionHeader}>
                    <h4>Deployment & Refresh (No-Backend)</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Github Action</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Trigger a manual rebuild and deployment of your site. This will push your current configuration to GitHub and trigger the configured CI/CD pipeline.</p>
                    </div>

                    {/* GitHub Integration Section */}
                    <div className={tabStyles.sectionHeader} style={{ marginTop: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--input-border)', paddingBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>GitHub Integration</h4>
                    </div>
                    <div className={tabStyles.formGrid}>
                        <FormField 
                            label={<><Key size={14} style={{ marginRight: '6px' }} /> GitHub Personal Access Token</>}
                            hint="Used for triggering site rebuilds. Stored locally in your browser."
                        >
                            <div className={tabStyles.tokenInputContainer}>
                                <Input
                                    type={showToken ? 'text' : 'password'}
                                    placeholder="ghp_xxxxxxxxxxxx"
                                    value={githubToken}
                                    onChange={(e) => setGithubToken(e.target.value)}
                                    className={tabStyles.tokenInput}
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
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                        <Button
                            type='button'
                            isLoading={rebuildStatus.state === 'loading'}
                            onClick={handleTriggerRebuild}
                            className={`${tabStyles.syncButton} ${rebuildStatus.state === 'error' ? tabStyles['syncButton--error'] : ''}`}
                        >
                            <RefreshCw size={18} />
                            <span>{rebuildStatus.state === 'loading' ? 'Syncing...' : 'Trigger Manual Rebuild'}</span>
                        </Button>

                        {rebuildStatus.state !== 'idle' && (
                            <div className={tabStyles.statusInfo}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <span className={tabStyles.statusText}>Status: <strong className={rebuildStatus.state === 'success' ? tabStyles.success : (rebuildStatus.state === 'error' ? tabStyles.error : tabStyles.loading)}>{rebuildStatus.state.toUpperCase()}</strong></span>
                                    <span className={tabStyles.timestamp}>Last Updated: {rebuildStatus.lastChecked ? new Date(rebuildStatus.lastChecked).toLocaleTimeString() : 'Never'}</span>
                                </div>
                                {rebuildStatus.message && <div className={tabStyles.rebuildMessage}>{rebuildStatus.message}</div>}
                            </div>
                        )}
                    </div>

                    <div className={tabStyles.warningBanner}>
                        <AlertCircle size={18} className={tabStyles.sectionIcon} />
                        <div className={tabStyles.warningText}>
                            <strong>Note:</strong> Since we are using the <strong>No-Backend</strong> version, your GitHub token must be entered above to trigger the build. This ensures 100% free hosting.
                        </div>
                    </div>
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
