import React, { useCallback, useMemo, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// Services & Hooks
import DatabaseService from '../../../services/DatabaseService';
import BaseService from '../../../services/BaseService';
import { useActivity } from '../../../hooks/useActivity';
import { useAsyncAction } from '../../../hooks/useAsyncAction';

// Components
import SectionHeader from '../components/SectionHeader';
import { Button } from '@/shared/components/ui';
import DatabaseStats from './components/DatabaseStats';
import DatabaseActions from './components/DatabaseActions';
import DatabaseSyncPanel from './components/DatabaseSyncPanel';
import DatabaseAdvancedPanel from './components/DatabaseAdvancedPanel';
import RestoreDialog from './components/RestoreDialog';
import ArchiveDialog from './components/ArchiveDialog';
import AuditSettingsPanel from './components/AuditSettingsPanel';
import RestoreProgress from './components/RestoreProgress';
import QuotaResilienceBanner from '../components/QuotaResilienceBanner';
import { useTranslation } from '../../../hooks/useTranslation';
import { ACTIONS, MODULES } from '../../../utils/permissions';

// Styles

const DEFAULT_AUDIT_SETTINGS = {
    logAll: true,
    logReads: true,
    logWrites: true,
    logDeletes: true,
    logAnonymous: false
};

const DatabaseTab = ({ userRole, showToast, setActiveTab, isActionAllowed, userEmail }) => {
    const { language, t } = useTranslation();
    const tm = useCallback((key, params = {}) => t(`admin.database.${key}`, params), [t]);
    const quotaMessage = t('admin.common.quotaBanner.message');
    const { loading: auditLoading, execute: executeAudit } = useAsyncAction({
        showToast,
        errorMessage: tm('toasts.auditUpdateFailed'),
        invalidateKeys: [['database', 'auditSettings']]
    });

    const { loading: backupLoading, execute: executeBackup } = useAsyncAction({
        showToast,
        successMessage: tm('toasts.exportSuccess'),
        errorMessage: tm('toasts.exportFailed')
    });

    const { loading: archiveLoading, execute: executeArchive } = useAsyncAction({
        showToast: false
    });

    const { loading: restoreLoading, execute: executeRestore } = useAsyncAction({
        showToast: false
    });

    const { loading: syncLoading, execute: executeDatabaseSync } = useAsyncAction({
        showToast: false
    });

    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const [archiveDays, setArchiveDays] = useState(30);
    const [archiveTargets, setArchiveTargets] = useState({
        messages: true,
        authLogs: true,
        systemLogs: true,
        activityFeed: true,
        draftContent: true,
        dailyUsage: true,
        visits: true,
    });
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [restoreFile, setRestoreFile] = useState(null);
    const [restoreProgress, setRestoreProgress] = useState(null);
    const [quotaExceeded, setQuotaExceeded] = useState(false);
    const [healthFailures, setHealthFailures] = useState({});
    const [syncStatus, setSyncStatus] = useState({ state: 'idle', message: '', requestedAt: null });
    const lastHealthErrorKeyRef = useRef('');
    
    const { trackRead, trackWrite, trackDelete } = useActivity();
    const queryClient = useQueryClient();
    const isQuotaError = useCallback((error) => (
        error === 'QUOTA_EXCEEDED' || DatabaseService.isQuotaExceededError(error)
    ), []);

    const flagQuotaExceeded = useCallback(() => {
        setQuotaExceeded(true);
    }, []);

    const handleQuotaFailure = useCallback((error) => {
        if (!isQuotaError(error)) return false;
        flagQuotaExceeded();
        showToast(quotaMessage, 'warning');
        return true;
    }, [flagQuotaExceeded, isQuotaError, quotaMessage, showToast]);

    // Queries
    const healthKeys = useMemo(() => DatabaseService.HEALTH_COLLECTIONS, []);
    const defaults = useMemo(() => Object.fromEntries(healthKeys.map((key) => [key, 0])), [healthKeys]);
    const { data: dbHealth = { ...defaults }, isLoading: dbHealthLoading, isFetching: dbHealthFetching, refetch: refetchDbHealth } = useQuery({
        queryKey: ['database', 'health'],
        queryFn: async () => {
            setQuotaExceeded(false);
            setHealthFailures({});

            try {
                const data = await DatabaseService.getHealth(trackRead);
                lastHealthErrorKeyRef.current = '';
                return { ...defaults, ...data, lastUpdated: new Date() };
            } catch (error) {
                if (error?.code === 'DATABASE_HEALTH_PARTIAL_FAILURE') {
                    const failures = error?.failures || {};
                    const partialCounts = error?.partialCounts || {};
                    setHealthFailures(failures);

                    if (error?.quotaExceeded || Object.values(failures).some((entry) => isQuotaError(entry))) {
                        flagQuotaExceeded();
                        showToast(quotaMessage, 'warning');
                    }

                    const failureKey = Object.keys(failures).sort().join('|');
                    if (lastHealthErrorKeyRef.current !== failureKey) {
                        showToast(
                            tm('toasts.healthMetricsLoadFailedFor', { collections: Object.keys(failures).join(', ') }),
                            'error'
                        );
                    lastHealthErrorKeyRef.current = failureKey;
                    }

                    return { ...defaults, ...partialCounts, lastUpdated: new Date() };
                }

                if (isQuotaError(error)) {
                    flagQuotaExceeded();
                    showToast(quotaMessage, 'warning');
                } else {
                    const fallbackKey = error?.code || error?.message || 'database-health-failure';
                    if (lastHealthErrorKeyRef.current !== fallbackKey) {
                        showToast(error?.message || tm('toasts.loadHealthFailed'), 'error');
                        lastHealthErrorKeyRef.current = fallbackKey;
                    }
                }

                return { ...defaults, lastUpdated: new Date() };
            }
        },
        refetchInterval: 300000,
        refetchOnWindowFocus: false
    });

    const { data: auditSettings = DEFAULT_AUDIT_SETTINGS } = useQuery({
        queryKey: ['database', 'auditSettings'],
        queryFn: async () => {
            const result = await BaseService.safe(() => DatabaseService.getAuditSettings());
            if (result.error) {
                showToast(result.error, 'error');
                return DEFAULT_AUDIT_SETTINGS;
            }
            return { ...DEFAULT_AUDIT_SETTINGS, ...result.data };
        },
        refetchOnWindowFocus: false
    });

    // Handlers
    const canEditAudit = isActionAllowed(ACTIONS.EDIT, MODULES.DATABASE);
    const canDatabaseActions = isActionAllowed(ACTIONS.DATABASE_ACTIONS, MODULES.DATABASE);
    const canArchive = isActionAllowed(ACTIONS.DELETE, MODULES.DATABASE);
    const canSyncDatabase = canDatabaseActions;

    const handleTriggerDatabaseSync = useCallback(async (githubToken) => {
        const token = String(githubToken || '').trim();
        const tr = (enText, kmText) => (language === 'km' ? kmText : enText);

        if (!token) {
            showToast(tr('A GitHub token is required to run database sync.', 'ត្រូវការតូខិន GitHub ដើម្បីដំណើរការសមកាលកម្មមូលដ្ឋានទិន្នន័យ។'), 'error');
            return;
        }

        const confirmed = window.confirm(
            tr(
                'Run the database sync now? This will dispatch the GitHub Actions workflow manually.',
                'ដំណើរការសមកាលកម្មមូលដ្ឋានទិន្នន័យឥឡូវនេះទេ? វានឹងបញ្ជូន GitHub Actions workflow ដោយដៃ។'
            )
        );

        if (!confirmed) return;

        setSyncStatus({
            state: 'loading',
            message: tr('Dispatching database sync...', 'កំពុងបញ្ជូនសមកាលកម្មមូលដ្ឋានទិន្នន័យ...'),
            requestedAt: null
        });

        const result = await executeDatabaseSync(async () => {
            await axios.post(
                'https://api.github.com/repos/kemphearum/kemphearum.github.io/dispatches',
                {
                    event_type: 'manual_database_sync',
                    client_payload: {
                        source: 'database-tab',
                        requestedBy: userEmail || 'unknown'
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/vnd.github+json',
                        'X-GitHub-Api-Version': '2022-11-28'
                    }
                }
            );

            return true;
        });

        if (result.success) {
            const trSuccess = (enText, kmText) => (language === 'km' ? kmText : enText);
            setSyncStatus({
                state: 'requested',
                message: trSuccess('Database sync request sent to GitHub Actions.', 'សំណើសមកាលកម្មមូលដ្ឋានទិន្នន័យបានបញ្ជូនទៅ GitHub Actions ហើយ។'),
                requestedAt: Date.now()
            });
            showToast(trSuccess('Database sync request sent.', 'សំណើសមកាលកម្មមូលដ្ឋានទិន្នន័យបានបញ្ជូនហើយ។'), 'success');
            return;
        }

        const error = result.error;
        let errorMessage = tr(
            'Failed to dispatch database sync.',
            'បរាជ័យក្នុងការបញ្ជូនសមកាលកម្មមូលដ្ឋានទិន្នន័យ។'
        );

        if (error?.response?.status === 401 || error?.response?.status === 403) {
            errorMessage = tr(
                'Invalid GitHub token. Please paste a token with repository access.',
                'Token GitHub មិនត្រឹមត្រូវ។ សូមបិទភ្ជាប់ token ដែលមានសិទ្ធិ repository។'
            );
        } else if (error?.response?.data?.message) {
            errorMessage = `${tr('GitHub error:', 'កំហុស GitHub៖')} ${error.response.data.message}`;
        } else if (error?.message) {
            errorMessage = error.message;
        }

        setSyncStatus({
            state: 'error',
            message: errorMessage,
            requestedAt: null
        });
        showToast(errorMessage, 'error');
    }, [executeDatabaseSync, language, showToast, userEmail]);

    const handleUpdateAuditSetting = async (key, value) => {
        if (!canEditAudit) {
            return showToast(tm('toasts.noPermission'), "error");
        }

        await executeAudit(async () => {
            await DatabaseService.updateAuditSettings(userRole, userEmail, key, value, auditSettings, trackWrite);
        }, {
            successMessage: key === 'logAll'
                ? tm('toasts.allAuditSettingsStatus', { status: value ? tm('common.enabled') : tm('common.disabled') })
                : tm('toasts.auditSettingUpdated', { key, value })
        });
    };

    const handleBackupDatabase = async () => {
        if (!canDatabaseActions) {
            return showToast(tm('toasts.noPermission'), "error");
        }

        await executeBackup(async () => {
            const result = await BaseService.safe(() => DatabaseService.backup(userRole, trackRead));
            if (result.error) {
                if (handleQuotaFailure(result.error)) {
                    throw new Error(quotaMessage);
                }
                throw new Error(result.error);
            }
        });
    };

    const handleArchiveData = async () => {
        if (!canArchive) {
            return showToast(tm('toasts.noPermission'), "error");
        }

        setShowArchiveConfirm(false);
        showToast(tm('toasts.gatheringArchive'), "info");

        await executeArchive(async () => {
            const { data, error } = await BaseService.safe(() => DatabaseService.archive(userRole, archiveDays, archiveTargets, trackRead, trackDelete));
            if (error) {
                if (handleQuotaFailure(error)) {
                    throw new Error(quotaMessage);
                }
                throw new Error(error);
            }
            if (data.deleted > 0) {
                refetchDbHealth();
            }
            return data;
        }).then(({ success, data, error }) => {
            if (success) {
                if (data.deleted === 0) {
                    showToast(tm('toasts.noOldRecords', { days: archiveDays }), "success");
                } else {
                    showToast(tm('toasts.archiveDeleteSuccess', { count: data.deleted }), "success");
                }
            } else {
                showToast(error?.message || tm('toasts.archiveFailed'), "error");
            }
        });
    };

    const handleRestoreConfirm = async () => {
        if (!restoreFile) return;
        if (!canDatabaseActions) {
            return showToast(tm('toasts.noPermission'), "error");
        }

        setShowRestoreConfirm(false);
        showToast(tm('toasts.restoringBackup'), 'info');

        await executeRestore(async () => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const { data, error } = await BaseService.safe(async () => {
                        return await DatabaseService.restore(
                            userRole,
                            event.target.result,
                            trackWrite,
                            (completed, total) => {
                                setRestoreProgress({
                                    completed,
                                    total,
                                    percentage: Math.round((completed / total) * 100)
                                });
                            }
                        );
                    });

                    if (error) {
                        if (handleQuotaFailure(error)) {
                            setRestoreFile(null);
                            setTimeout(() => setRestoreProgress(null), 3000);
                            reject(new Error(quotaMessage));
                            return;
                        }
                        setRestoreFile(null);
                        setTimeout(() => setRestoreProgress(null), 3000);
                        reject(new Error(error));
                        return;
                    }

                    queryClient.invalidateQueries();
                    refetchDbHealth();
                    setRestoreFile(null);
                    setTimeout(() => setRestoreProgress(null), 3000);
                    resolve(data);
                };
                reader.onerror = () => reject(new Error(tm('toasts.readFileFailed')));
                reader.readAsText(restoreFile);
            });
        }).then(({ success, data, error }) => {
            if (success) {
                if (data.failedCollections.length > 0) {
                    showToast(
                        tm('toasts.partialRestore', { completed: data.completedCount, total: data.totalDocs, collections: data.failedCollections.join(', ') }),
                        'warning'
                    );
                } else {
                    showToast(tm('toasts.restoreSuccess', { count: data.completedCount }), 'success');
                }
            } else {
                showToast(error?.message || tm('toasts.restoreFailedInvalidFormat'), 'error');
            }
        });
    };

        const handleRestoreSelect = useCallback((file) => {
        if (!file) return;

        const name = String(file.name || '').toLowerCase();
        const mime = String(file.type || '').toLowerCase();
        const isJsonFile = name.endsWith('.json') || mime.includes('json');
        const maxSizeBytes = 25 * 1024 * 1024;
        const isKhmer = language === 'km';

        if (!isJsonFile) {
            showToast(
                isKhmer ? tm('validation.invalidJsonBackup') : tm('validation.invalidJsonBackup'),
                'error'
            );
            return;
        }
        if (!file.size) {
            showToast(tm('validation.selectedFileEmpty'), 'error');
            return;
        }
        if (file.size > maxSizeBytes) {
            showToast(
                isKhmer ? tm('validation.backupFileTooLarge') : tm('validation.backupFileTooLarge'),
                'error'
            );
            return;
        }

        setRestoreFile(file);
        setShowRestoreConfirm(true);
    }, [showToast, language, tm]);

    const actionLoadingState = useMemo(() => ({
        any: backupLoading || archiveLoading || restoreLoading,
        backup: backupLoading,
        restore: restoreLoading,
        archive: archiveLoading
    }), [backupLoading, archiveLoading, restoreLoading]);

    const handleRefreshHealth = useCallback(() => {
        refetchDbHealth();
    }, [refetchDbHealth]);

    // Adjusted totalDocs calculation to be safer
    const calculatedTotal = healthKeys.reduce((sum, key) => sum + (Number(dbHealth[key]) || 0), 0);

    return (
        <div className="admin-tab-container">
            <RestoreProgress progress={restoreProgress} />

            {quotaExceeded && (
                <QuotaResilienceBanner onRefresh={() => refetchDbHealth()} />
            )}

            {Object.keys(healthFailures).length > 0 && (
                <div className="ui-quota-banner" role="alert">
                    <div className="ui-quota-banner-content">
                        <h3>{tm('warnings.healthCheckIncomplete')}</h3>
                        <p>
                            {tm('warnings.someCountsNotLoaded')} {Object.keys(healthFailures).join(', ')}.
                        </p>
                    </div>
                </div>
            )}

            <SectionHeader
                title={tm('header.title')}
                description={tm('header.description')}
                icon={RefreshCw}
                rightElement={
                    <Button 
                        variant="ghost" 
                        onClick={handleRefreshHealth}
                        title={tm('header.refreshHealth')}
                        className="ui-btn-icon-only"
                    >
                        <RefreshCw size={18} className={dbHealthFetching ? "ui-spin" : ''} />
                    </Button>
                }
            />

            <DatabaseStats 
                dbHealth={dbHealth}
                healthFailures={healthFailures}
                loading={dbHealthLoading}
                isFetching={dbHealthFetching}
                totalDocs={calculatedTotal}
                setActiveTab={setActiveTab}
            />

            <DatabaseActions 
                loading={actionLoadingState}
                onBackup={handleBackupDatabase}
                onRestoreSelect={handleRestoreSelect}
                archiveDays={archiveDays}
                onArchiveDaysChange={setArchiveDays}
                onArchiveClick={() => setShowArchiveConfirm(true)}
                canBackup={canDatabaseActions}
                canArchive={canArchive}
            />

            <DatabaseSyncPanel
                loading={syncLoading}
                syncStatus={syncStatus}
                onSync={handleTriggerDatabaseSync}
                canSync={canSyncDatabase}
            />

            <DatabaseAdvancedPanel showToast={showToast} />

            <AuditSettingsPanel 
                auditSettings={auditSettings}
                onUpdateSetting={handleUpdateAuditSetting}
                canEdit={canEditAudit}
                loading={auditLoading}
            />

            {/* Dialogs */}
            <RestoreDialog 
                open={showRestoreConfirm}
                onOpenChange={setShowRestoreConfirm}
                restoreFile={restoreFile}
                onConfirm={handleRestoreConfirm}
                loading={restoreLoading}
            />

            <ArchiveDialog 
                open={showArchiveConfirm}
                onOpenChange={setShowArchiveConfirm}
                archiveDays={archiveDays}
                archiveTargets={archiveTargets}
                onArchiveTargetsChange={setArchiveTargets}
                onConfirm={handleArchiveData}
                loading={archiveLoading}
            />
        </div>
    );
};

export default DatabaseTab;
