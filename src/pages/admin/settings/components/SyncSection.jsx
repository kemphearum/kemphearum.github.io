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
    const { t, language } = useTranslation();
    const locale = language === 'km' ? 'km-KH' : 'en-US';

    const updateMirrorField = (index, field, value) => {
        const sourceMirrors = (Array.isArray(settingsData.mirrors) && settingsData.mirrors.length > 0)
            ? settingsData.mirrors
            : mirrors;
        const nextMirrors = [...sourceMirrors];
        nextMirrors[index] = { ...nextMirrors[index], [field]: value };
        setSettingsData({ ...settingsData, mirrors: nextMirrors });
    };

    const syncStateLabel = rebuildStatus.state === 'idle'
        ? t('admin.settings.sections.sync.states.ready')
        : rebuildStatus.state === 'loading'
            ? t('admin.settings.sections.sync.states.syncing')
            : rebuildStatus.state === 'requested'
                ? t('admin.settings.sections.sync.states.queued')
                : rebuildStatus.state === 'success'
                    ? t('admin.settings.sections.sync.states.healthy')
                    : t('admin.settings.sections.sync.states.attention');

    return (
        <form onSubmit={onSave} className={tabStyles.tabContentFadeIn}>
            <div className="ui-card">
                <div className={tabStyles.surfaceHeader}>
                    <div className={tabStyles.surfaceCopy}>
                        <span className={tabStyles.surfaceEyebrow}>{t('admin.settings.sections.sync.eyebrow')}</span>
                        <h3 className={tabStyles.surfaceHeadline}>{t('admin.settings.sections.sync.title')}</h3>
                        <p className={tabStyles.surfaceLead}>{t('admin.settings.sections.sync.description')}</p>
                    </div>
                    <div className={tabStyles.surfaceMeta}>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{mirrors.length}</span>
                            <span className={tabStyles.surfaceMetaLabel}>{t('admin.settings.sections.sync.mirrors')}</span>
                            <span className={tabStyles.surfaceMetaHint}>{t('admin.settings.sections.sync.mirrorHint')}</span>
                        </div>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{githubToken.trim() ? t('admin.settings.sections.sync.tokenStored') : t('admin.settings.sections.sync.tokenMissing')}</span>
                            <span className={tabStyles.surfaceMetaLabel}>{t('admin.settings.sections.sync.githubToken')}</span>
                            <span className={tabStyles.surfaceMetaHint}>{t('admin.settings.sections.sync.tokenHint')}</span>
                        </div>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{syncStateLabel}</span>
                            <span className={tabStyles.surfaceMetaLabel}>{t('admin.settings.sections.sync.rebuildStatus')}</span>
                            <span className={tabStyles.surfaceMetaHint}>{t('admin.settings.sections.sync.syncHealth')}</span>
                        </div>
                    </div>
                </div>

                <div className={tabStyles.settingsSplitGrid}>
                    <section className={tabStyles.settingsPanel}>
                        <div className={tabStyles.panelHeader}>
                            <div className={tabStyles.panelTitleGroup}>
                                <span className={tabStyles.panelEyebrow}>{t('admin.settings.sections.sync.mirrorsSection.title')}</span>
                                <h4 className={tabStyles.panelTitle}>{t('admin.settings.sections.sync.mirrorsSection.subtitle')}</h4>
                                <p className={tabStyles.panelDescription}>{t('admin.settings.sections.sync.mirrorsSection.description')}</p>
                            </div>
                            <span className={tabStyles.panelBadge}>{mirrors.length} {t('admin.settings.sections.sync.mirrorsSection.targets')}</span>
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
                                                title={t('admin.settings.sections.sync.mirrorFields.remove')}
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
                                                    <h5>{mirror.name || t('admin.settings.sections.sync.mirrorFields.config')}</h5>
                                                    <span>{t('admin.settings.sections.sync.mirrorFields.env', { index: index + 1 })}</span>
                                                </div>
                                            </div>

                                            <FormField label={t('admin.settings.sections.sync.mirrorFields.name')}>
                                                <Input
                                                    value={mirror.name}
                                                    onChange={(e) => updateMirrorField(index, 'name', e.target.value)}
                                                    placeholder={t('admin.settings.sections.sync.mirrorFields.namePlaceholder')}
                                                    className={tabStyles.mirrorInput}
                                                />
                                            </FormField>

                                            <FormField label={t('admin.settings.sections.sync.mirrorFields.url')}>
                                                <div className={tabStyles.tokenInputContainer}>
                                                    <Input
                                                        value={mirror.url}
                                                        onChange={(e) => updateMirrorField(index, 'url', e.target.value)}
                                                        placeholder={t('admin.settings.sections.sync.mirrorFields.urlPlaceholder')}
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
                                    <strong>{t('admin.settings.sections.sync.addMirror.title')}</strong>
                                    <span>{t('admin.settings.sections.sync.addMirror.description')}</span>
                                </div>
                            </Button>
                        </div>
                    </section>

                    <aside className={tabStyles.settingsPanelStack}>
                        <section className={tabStyles.settingsPanel}>
                            <div className={tabStyles.panelHeader}>
                                <div className={tabStyles.panelTitleGroup}>
                                    <span className={tabStyles.panelEyebrow}>{t('admin.settings.sections.sync.rebuild.title')}</span>
                                    <h4 className={tabStyles.panelTitle}>{t('admin.settings.sections.sync.rebuild.subtitle')}</h4>
                                    <p className={tabStyles.panelDescription}>{t('admin.settings.sections.sync.rebuild.description')}</p>
                                </div>
                                <span className={tabStyles.panelBadge}>{syncStateLabel}</span>
                            </div>

                            <FormField
                                label={<><Key size={14} style={{ marginRight: '6px' }} /> {t('admin.settings.sections.sync.rebuild.tokenLabel')}</>}
                                hint={t('admin.settings.sections.sync.rebuild.tokenHint')}
                            >
                                <div className={tabStyles.tokenInputContainer}>
                                    <Input
                                        type={showToken ? 'text' : 'password'}
                                        placeholder={t('admin.settings.sections.sync.rebuild.tokenPlaceholder')}
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
                                <span>{rebuildStatus.state === 'loading' ? t('admin.settings.sections.sync.rebuild.btnLoading') : t('admin.settings.sections.sync.rebuild.btnDefault')}</span>
                            </Button>

                            {rebuildStatus.state !== 'idle' && (
                                <div className={tabStyles.statusInfo}>
                                    <div>
                                        <span className={tabStyles.statusText}>
                                            {t('admin.settings.sections.sync.rebuild.statusLabel')}{' '}
                                            <strong className={rebuildStatus.state === 'success' ? tabStyles.success : (rebuildStatus.state === 'error' ? tabStyles.error : tabStyles.loading)}>
                                                {rebuildStatus.state === 'idle'
                                                    ? t('admin.settings.sections.sync.states.idle')
                                                    : rebuildStatus.state === 'loading'
                                                        ? t('admin.settings.sections.sync.states.loading')
                                                        : rebuildStatus.state === 'requested'
                                                            ? t('admin.settings.sections.sync.states.requested')
                                                            : rebuildStatus.state === 'success'
                                                                ? t('admin.settings.sections.sync.states.success')
                                                                : t('admin.settings.sections.sync.states.error')}
                                            </strong>
                                        </span>
                                        <div className={tabStyles.timestamp}>
                                            {t('admin.settings.sections.sync.rebuild.lastUpdated')} {rebuildStatus.lastChecked ? new Date(rebuildStatus.lastChecked).toLocaleTimeString(locale) : t('admin.settings.sections.sync.rebuild.never')}
                                        </div>
                                    </div>
                                    {rebuildStatus.message && <div className={tabStyles.rebuildMessage}>{rebuildStatus.message}</div>}
                                </div>
                            )}
                        </section>

                        <section className={tabStyles.settingsPanel}>
                            <div className={tabStyles.panelHeader}>
                                <div className={tabStyles.panelTitleGroup}>
                                    <span className={tabStyles.panelEyebrow}>{t('admin.settings.sections.sync.note.title')}</span>
                                    <h4 className={tabStyles.panelTitle}>{t('admin.settings.sections.sync.note.subtitle')}</h4>
                                    <p className={tabStyles.panelDescription}>{t('admin.settings.sections.sync.note.description')}</p>
                                </div>
                            </div>

                            <div className={tabStyles.warningBanner}>
                                <AlertCircle size={18} className={tabStyles.sectionIcon} />
                                <div className={tabStyles.warningText}>
                                    <strong>{t('admin.settings.sections.sync.note.label')}</strong> {t('admin.settings.sections.sync.note.message')}
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
                        <Save size={18} /> {t('admin.settings.sections.sync.save')}
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default SyncSection;
