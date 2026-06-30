import React, { useMemo } from 'react';
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
    const { t } = useTranslation();

    const syncStateLabel = useMemo(() => {
        if (syncStatus.state === 'loading') return t('ui.dispatchingSync');
        if (syncStatus.state === 'requested') return t('ui.syncQueued');
        if (syncStatus.state === 'error') return t('ui.syncFailed');
        return t('ui.readyToSync');
    }, [syncStatus.state, t]);

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
                    <Github size={18} className="ui-text-accent" /> {t('ui.databaseSync')}
                </h4>
                <span className={`ui-badge ${statusTone}`}>
                    {syncStateLabel}
                </span>
            </div>

            <div className="ui-database-card ui-primary ui-hover-bg">
                <div className="ui-flex-column ui-flex-1">
                    <h5 className="ui-flex-center-gap-small ui-mb-small">
                        <RefreshCw size={18} /> {t('ui.manualGitHubDispatch')}
                    </h5>
                    <p className="ui-text-secondary ui-text-small ui-mb-medium">
                        {t('ui.dispatchTheBackupSyncWork')}
                    </p>

                    <div className="ui-flex-center-gap-small ui-text-small ui-text-muted">
                        <ShieldCheck size={16} className="ui-text-success" />
                        <span>
                            {t('ui.gitHubAccessIsHandledByAF')}
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
                            title={t('ui.runDatabaseSyncNow')}
                        >
                            {t('ui.runDatabaseSync')}
                        </Button>
                        <div className="ui-text-small ui-text-muted">
                            <div className="ui-flex-center-gap-small">
                                <ShieldCheck size={14} />
                                <span>{t('ui.requiresSuperAdminAccess')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="ui-mt-medium ui-text-small">
                        <div className={statusTone} style={{ fontWeight: 600 }}>
                            {syncStatus.message || t('ui.noSyncRequestSentYet')}
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
                                {t('ui.youDoNotHavePermissionToR')}
                            </div>
                        )}
                    </div>

                    <div className="ui-text-small ui-text-muted ui-mt-medium">
                        {t('ui.workflowTargetGITHUBOWNER')}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatabaseSyncPanel;
