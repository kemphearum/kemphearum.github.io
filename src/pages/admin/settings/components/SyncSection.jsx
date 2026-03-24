import { AlertCircle, Eye, EyeOff, Flame, Github, Globe, Key, Plus, RefreshCw, Save, Terminal, Triangle, X } from 'lucide-react';
import { Button, Input } from '../../../../shared/components/ui';
import FormField from '../../components/FormField';
import tabStyles from '../SettingsTab.module.scss';
import { useTranslation } from '../../../../hooks/useTranslation';

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
    const { language } = useTranslation();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
    const updateMirrorField = (index, field, value) => {
        const sourceMirrors = (Array.isArray(settingsData.mirrors) && settingsData.mirrors.length > 0)
            ? settingsData.mirrors
            : mirrors;
        const nextMirrors = [...sourceMirrors];
        nextMirrors[index] = { ...nextMirrors[index], [field]: value };
        setSettingsData({ ...settingsData, mirrors: nextMirrors });
    };

    const syncStateLabel = rebuildStatus.state === 'idle'
        ? tr('Ready', 'រួចរាល់')
        : rebuildStatus.state === 'loading'
            ? tr('Syncing', 'កំពុងធ្វើសមកាលកម្ម')
            : rebuildStatus.state === 'requested'
                ? tr('Queued', 'កំពុងរង់ចាំ')
                : rebuildStatus.state === 'success'
                    ? tr('Healthy', 'ប្រក្រតី')
                    : tr('Attention', 'ត្រូវពិនិត្យ');

    return (
        <form onSubmit={onSave} className={tabStyles.tabContentFadeIn}>
            <div className="ui-card">
                <div className={tabStyles.surfaceHeader}>
                    <div className={tabStyles.surfaceCopy}>
                        <span className={tabStyles.surfaceEyebrow}>{tr('Site Synchronization', 'ការធ្វើសមកាលកម្មគេហទំព័រ')}</span>
                        <h3 className={tabStyles.surfaceHeadline}>{tr('Manage deployment targets and manual rebuild control from one cleaner sync workspace.', 'គ្រប់គ្រងគោលដៅ Deploy និងការបង្កើតឡើងវិញដោយដៃ ពី workspace សមកាលកម្មតែមួយ។')}</h3>
                        <p className={tabStyles.surfaceLead}>{tr('Mirror environments and rebuild settings are separated now, so it is easier to understand what is being deployed where and when.', 'បរិស្ថាន Mirror និងការកំណត់ rebuild ត្រូវបានបំបែកច្បាស់ ដើម្បីងាយយល់ថាកំពុង deploy ទៅណា និងពេលណា។')}</p>
                    </div>
                    <div className={tabStyles.surfaceMeta}>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{mirrors.length}</span>
                            <span className={tabStyles.surfaceMetaLabel}>{tr('Mirrors', 'Mirror')}</span>
                            <span className={tabStyles.surfaceMetaHint}>{tr('Deployment targets currently configured', 'គោលដៅ Deploy ដែលបានកំណត់')}</span>
                        </div>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{githubToken.trim() ? tr('Stored', 'បានរក្សាទុក') : tr('Missing', 'បាត់')}</span>
                            <span className={tabStyles.surfaceMetaLabel}>{tr('GitHub Token', 'GitHub Token')}</span>
                            <span className={tabStyles.surfaceMetaHint}>{tr('Saved locally in your browser for rebuild access', 'រក្សាទុកក្នុង Browser សម្រាប់ rebuild')}</span>
                        </div>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{syncStateLabel}</span>
                            <span className={tabStyles.surfaceMetaLabel}>{tr('Rebuild Status', 'ស្ថានភាព Rebuild')}</span>
                            <span className={tabStyles.surfaceMetaHint}>{tr('Current sync health for manual deployment requests', 'ស្ថានភាពសមកាលកម្មបច្ចុប្បន្នសម្រាប់សំណើ Deploy ដោយដៃ')}</span>
                        </div>
                    </div>
                </div>

                <div className={tabStyles.settingsSplitGrid}>
                    <section className={tabStyles.settingsPanel}>
                        <div className={tabStyles.panelHeader}>
                                <div className={tabStyles.panelTitleGroup}>
                                    <span className={tabStyles.panelEyebrow}>{tr('Mirror Environments', 'បរិស្ថាន Mirror')}</span>
                                    <h4 className={tabStyles.panelTitle}>{tr('Manage every deployment destination', 'គ្រប់គ្រងគោលដៅ Deploy ទាំងអស់')}</h4>
                                    <p className={tabStyles.panelDescription}>{tr('Keep your live portfolio mirrors organized so you always know which URLs represent production, backup, and alternate hosting.', 'រៀបចំ Mirror របស់ Portfolio ឱ្យមានរបៀប ដើម្បីដឹងថា URL មួយណាជា production បម្រុង និង host ជំនួស។')}</p>
                                </div>
                            <span className={tabStyles.panelBadge}>{mirrors.length} {tr('targets', 'គោលដៅ')}</span>
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
                                                title={tr('Remove Mirror', 'លុប Mirror')}
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
                                                    <h5>{mirror.name || tr('Mirror Configuration', 'ការកំណត់ Mirror')}</h5>
                                                    <span>{tr(`Environment #${index + 1}`, `បរិស្ថាន #${index + 1}`)}</span>
                                                </div>
                                            </div>

                                            <FormField label={tr('Mirror Name', 'ឈ្មោះ Mirror')}>
                                                <Input
                                                    value={mirror.name}
                                                    onChange={(e) => updateMirrorField(index, 'name', e.target.value)}
                                                    placeholder={tr('e.g. GitHub Pages', 'ឧ. GitHub Pages')}
                                                    className={tabStyles.mirrorInput}
                                                />
                                            </FormField>

                                            <FormField label={tr('Repository URL', 'URL Repository')}>
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
                                    <strong>{tr('Add Mirror Environment', 'បន្ថែមបរិស្ថាន Mirror')}</strong>
                                    <span>{tr('Configure another deployment target', 'កំណត់គោលដៅ Deploy ថ្មី')}</span>
                                </div>
                            </Button>
                        </div>
                    </section>

                    <aside className={tabStyles.settingsPanelStack}>
                        <section className={tabStyles.settingsPanel}>
                            <div className={tabStyles.panelHeader}>
                                <div className={tabStyles.panelTitleGroup}>
                                    <span className={tabStyles.panelEyebrow}>{tr('Manual Rebuild', 'Rebuild ដោយដៃ')}</span>
                                    <h4 className={tabStyles.panelTitle}>{tr('GitHub Actions deployment control', 'ការគ្រប់គ្រង Deploy តាម GitHub Actions')}</h4>
                                    <p className={tabStyles.panelDescription}>{tr('Trigger a rebuild and deployment of the live site without leaving the admin panel.', 'ចាប់ផ្តើម rebuild និង deploy គេហទំព័រផ្ទាល់ ដោយមិនចាកចេញពីផ្ទាំង Admin។')}</p>
                                </div>
                                <span className={tabStyles.panelBadge}>{syncStateLabel}</span>
                            </div>

                            <FormField
                                label={<><Key size={14} style={{ marginRight: '6px' }} /> {tr('GitHub Personal Access Token', 'GitHub Personal Access Token')}</>}
                                hint={tr('Used only for triggering site rebuilds. Stored locally in your browser.', 'ប្រើសម្រាប់ចាប់ផ្តើម rebuild ប៉ុណ្ណោះ។ រក្សាទុកក្នុង Browser របស់អ្នក។')}
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
                                <span>{rebuildStatus.state === 'loading' ? tr('Syncing...', 'កំពុងធ្វើសមកាលកម្ម...') : tr('Trigger Manual Rebuild', 'ចាប់ផ្តើម Rebuild ដោយដៃ')}</span>
                            </Button>

                            {rebuildStatus.state !== 'idle' && (
                                <div className={tabStyles.statusInfo}>
                                    <div>
                                        <span className={tabStyles.statusText}>
                                            {tr('Status:', 'ស្ថានភាព:')}{' '}
                                            <strong className={rebuildStatus.state === 'success' ? tabStyles.success : (rebuildStatus.state === 'error' ? tabStyles.error : tabStyles.loading)}>
                                                {rebuildStatus.state.toUpperCase()}
                                            </strong>
                                        </span>
                                        <div className={tabStyles.timestamp}>
                                            {tr('Last Updated:', 'បានធ្វើបច្ចុប្បន្នភាពចុងក្រោយ:')} {rebuildStatus.lastChecked ? new Date(rebuildStatus.lastChecked).toLocaleTimeString() : tr('Never', 'មិនដែល')}
                                        </div>
                                    </div>
                                    {rebuildStatus.message && <div className={tabStyles.rebuildMessage}>{rebuildStatus.message}</div>}
                                </div>
                            )}
                        </section>

                        <section className={tabStyles.settingsPanel}>
                            <div className={tabStyles.panelHeader}>
                                <div className={tabStyles.panelTitleGroup}>
                                    <span className={tabStyles.panelEyebrow}>{tr('Important Note', 'កំណត់ចំណាំសំខាន់')}</span>
                                    <h4 className={tabStyles.panelTitle}>{tr('No-backend rebuild flow', 'ដំណើរការ rebuild ដោយគ្មាន backend')}</h4>
                                    <p className={tabStyles.panelDescription}>{tr('The rebuild action depends on your GitHub token because deployment is handled through hosted CI rather than a custom backend.', 'សកម្មភាព rebuild ពឹងផ្អែកលើ GitHub token របស់អ្នក ព្រោះ Deploy ត្រូវបានគ្រប់គ្រងតាម hosted CI មិនមែន backend ផ្ទាល់ខ្លួន។')}</p>
                                </div>
                            </div>

                            <div className={tabStyles.warningBanner}>
                                <AlertCircle size={18} className={tabStyles.sectionIcon} />
                                <div className={tabStyles.warningText}>
                                    <strong>{tr('Note:', 'ចំណាំ:')}</strong> {tr('Enter a valid GitHub token above before triggering a rebuild. This keeps the hosting flow backend-free while still allowing controlled deployments.', 'សូមបញ្ចូល GitHub token ត្រឹមត្រូវខាងលើ មុនចាប់ផ្តើម rebuild។ វាអនុញ្ញាតឱ្យ Deploy ត្រូវបានគ្រប់គ្រង ដោយមិនត្រូវការ backend។')}
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
                        <Save size={18} /> {tr('Save Sync Settings', 'រក្សាទុកការកំណត់សមកាលកម្ម')}
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default SyncSection;
