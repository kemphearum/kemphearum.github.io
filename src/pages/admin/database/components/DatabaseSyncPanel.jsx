import React, { useCallback, useMemo } from 'react';
import { AlertCircle, Clock, Github, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { useTranslation } from '../../../../hooks/useTranslation';

const GITHUB_OWNER = 'kemphearum';
const GITHUB_REPO = 'kemphearum.github.io';

const DatabaseSyncPanel = ({
    loading = false,
    syncStatus = { state: 'idle', message: '', requestedAt: null },
    onSync,
    canSync = true
}) => {
    const { language } = useTranslation();
    const tr = useCallback((enText, kmText) => (language === 'km' ? kmText : enText), [language]);

    const syncStateLabel = useMemo(() => {
        if (syncStatus.state === 'loading') return tr('Dispatching sync...', 'កំពុងបញ្ជូនសមកាលកម្ម...');
        if (syncStatus.state === 'requested') return tr('Sync queued', 'សមកាលកម្មបានរៀបចំហើយ');
        if (syncStatus.state === 'error') return tr('Sync failed', 'សមកាលកម្មបរាជ័យ');
        return tr('Ready to sync', 'រួចរាល់សម្រាប់សមកាលកម្ម');
    }, [syncStatus.state, tr]);

    const handleSyncClick = () => {
        if (!canSync || loading) return;
        onSync?.();
    };

    const statusTone = syncStatus.state === 'error'
        ? 'ui-text-danger'
        : syncStatus.state === 'requested'
            ? 'ui-text-success'
            : syncStatus.state === 'loading'
                ? 'ui-text-accent'
                : 'ui-text-muted';

    return (
        <div className="ui-actions-section ui-sync-panel">
            <div className="ui-flex-between ui-mb-medium">
                <h4 className="ui-flex-center-gap-small ui-m-0">
                    <Github size={18} className="ui-text-accent" /> {tr('Database Sync', 'សមកាលកម្មមូលដ្ឋានទិន្នន័យ')}
                </h4>
                <span className={`ui-badge ${statusTone}`}>
                    {syncStateLabel}
                </span>
            </div>

            <div className="ui-database-card ui-primary ui-hover-bg">
                <div className="ui-flex-column ui-flex-1">
                    <h5 className="ui-flex-center-gap-small ui-mb-small">
                        <RefreshCw size={18} /> {tr('Manual GitHub Dispatch', 'បញ្ជូន GitHub ដោយដៃ')}
                    </h5>
                    <p className="ui-text-secondary ui-text-small ui-mb-medium">
                        {tr(
                            'Dispatch the backup sync workflow in GitHub Actions. The scheduled cron is disabled, so this gives you a controlled manual run.',
                            'បញ្ជូន workflow sync សំរាប់ backup ក្នុង GitHub Actions។ cron ស្វ័យប្រវត្តិត្រូវបានបិទ ដូច្នេះអ្នកអាចបើកដំណើរការដោយដៃបានគ្រប់គ្រាន់។'
                        )}
                    </p>

                    <div className="ui-flex-center-gap-small ui-text-small ui-text-muted">
                        <ShieldCheck size={16} className="ui-text-success" />
                        <span>
                            {tr(
                                'GitHub access is handled by a Firebase Function. No personal token is stored in this browser.',
                                'ការចូលប្រើ GitHub ត្រូវបានគ្រប់គ្រងដោយ Firebase Function។ មិនរក្សាទុក token ផ្ទាល់ខ្លួនក្នុង browser នេះទេ។'
                            )}
                        </span>
                    </div>

                    <div className="ui-flex-center-gap-medium ui-mt-medium">
                        <Button
                            type="button"
                            variant="primary"
                            onClick={handleSyncClick}
                            isLoading={loading}
                            disabled={!canSync || loading}
                            icon={RefreshCw}
                            title={tr('Run database sync now', 'ដំណើរការសមកាលកម្មមូលដ្ឋានទិន្នន័យឥឡូវនេះ')}
                        >
                            {tr('Run Database Sync', 'ដំណើរការសមកាលកម្មមូលដ្ឋានទិន្នន័យ')}
                        </Button>
                        <div className="ui-text-small ui-text-muted">
                            <div className="ui-flex-center-gap-small">
                                <ShieldCheck size={14} />
                                <span>{tr('Requires super admin access.', 'ត្រូវការសិទ្ធិ super admin។')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="ui-mt-medium ui-text-small">
                        <div className={statusTone} style={{ fontWeight: 600 }}>
                            {syncStatus.message || tr('No sync request sent yet.', 'មិនទាន់មានសំណើសមកាលកម្ម។')}
                        </div>
                        {syncStatus.requestedAt ? (
                            <div className="ui-text-muted ui-mt-small">
                                <Clock size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
                                {new Date(syncStatus.requestedAt).toLocaleString()}
                            </div>
                        ) : null}
                        {!canSync && (
                            <div className="ui-text-muted ui-mt-small">
                                <AlertCircle size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
                                {tr('You do not have permission to run database sync.', 'អ្នកគ្មានសិទ្ធិដំណើរការសមកាលកម្មមូលដ្ឋានទិន្នន័យ។')}
                            </div>
                        )}
                    </div>

                    <div className="ui-text-small ui-text-muted ui-mt-medium">
                        {tr(
                            `Workflow target: ${GITHUB_OWNER}/${GITHUB_REPO} (manual_database_sync).`,
                            `គោលដៅ workflow: ${GITHUB_OWNER}/${GITHUB_REPO} (manual_database_sync).`
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatabaseSyncPanel;
