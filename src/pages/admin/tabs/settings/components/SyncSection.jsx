import { Globe, Github, Triangle, Flame, Terminal, X, Key, EyeOff, Eye, RefreshCw, AlertCircle, Plus, Save } from 'lucide-react';
import { Button, Input } from '../../../../../shared/components/ui';
import FormRow from '../../../components/FormRow';
import styles from '../../../../Admin.module.scss';
import tabStyles from '../../SettingsTab.module.scss';

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
    return (
        <form onSubmit={onSave} className={tabStyles.tabContentFadeIn}>
            <div className="ui-card">
                {/* Site Mirrors Section */}
                <div className={tabStyles.sectionHeader} style={{ marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--input-border)', paddingBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Site Synchronization</h4>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
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
                                <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', display: 'flex', gap: '0.5rem' }}>
                                    <Button
                                        type='button'
                                        variant="ghost"
                                        onClick={() => removeMirror(index)}
                                        style={{ padding: '0.5rem', borderRadius: '10px', color: 'rgba(239, 68, 68, 0.6)' }}
                                        title="Remove Mirror"
                                    >
                                        <X size={16} />
                                    </Button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(var(--primary-color-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                                            <PlatformIcon size={20} />
                                        </div>
                                        <div>
                                            <h5 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600 }}>Mirror Configuration</h5>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.6 }}>#{index + 1} Environment</span>
                                        </div>
                                    </div>

                                    <div className={tabStyles.inputGroup} style={{ marginBottom: 0 }}>
                                        <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem', display: 'block', opacity: 0.8 }}>Mirror Name</label>
                                        <Input
                                            value={mirror.name}
                                            onChange={(e) => { 
                                                const newMirrors = [...settingsData.mirrors]; 
                                                newMirrors[index].name = e.target.value; 
                                                setSettingsData({ ...settingsData, mirrors: newMirrors }); 
                                            }}
                                            placeholder='e.g. GitHub Pages'
                                            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px' }}
                                        />
                                    </div>
                                    <div className={tabStyles.inputGroup} style={{ marginBottom: 0 }}>
                                        <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem', display: 'block', opacity: 0.8 }}>Repository URL</label>
                                        <div style={{ position: 'relative' }}>
                                            <Input
                                                value={mirror.url}
                                                onChange={(e) => { 
                                                    const newMirrors = [...settingsData.mirrors]; 
                                                    newMirrors[index].url = e.target.value; 
                                                    setSettingsData({ ...settingsData, mirrors: newMirrors }); 
                                                }}
                                                placeholder='https://github.com/user/repo'
                                                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', paddingLeft: '38px' }}
                                            />
                                            <Globe size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.5, zIndex: 1 }} />
                                        </div>
                                    </div>
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
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--input-border)' }}>
                            <Plus size={24} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <span style={{ fontWeight: 600, display: 'block', fontSize: '1rem' }}>Add Mirror Environment</span>
                            <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Configure another deployment target</span>
                        </div>
                    </Button>
                </div>

                {/* Deployment & Refresh Section */}
                <div className={tabStyles.sectionHeader} style={{ marginTop: '2.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--input-border)', paddingBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Deployment & Refresh (No-Backend)</h4>
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
                        <div className={tabStyles.inputGroup} style={{ position: 'relative' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Key size={16} /> GitHub Personal Access Token
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Input
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
                                        padding: '4px',
                                        zIndex: 1
                                    }}
                                >
                                    {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <span className={tabStyles.hint}>Used for triggering site rebuilds. Stored locally in your browser.</span>
                        </div>
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

                <div className={tabStyles.formFooter} style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
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
