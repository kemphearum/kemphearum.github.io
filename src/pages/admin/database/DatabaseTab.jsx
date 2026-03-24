import React, { useCallback, useMemo, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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
import RestoreDialog from './components/RestoreDialog';
import ArchiveDialog from './components/ArchiveDialog';
import AuditSettingsPanel from './components/AuditSettingsPanel';
import RestoreProgress from './components/RestoreProgress';
import QuotaResilienceBanner from '../components/QuotaResilienceBanner';
import { useTranslation } from '../../../hooks/useTranslation';

// Styles

const DEFAULT_AUDIT_SETTINGS = {
    logAll: true,
    logReads: true,
    logWrites: true,
    logDeletes: true,
    logAnonymous: false
};

const DatabaseTab = ({ userRole, showToast, setActiveTab, isActionAllowed, userEmail }) => {
    const { language } = useTranslation();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
    const { loading: auditLoading, execute: executeAudit } = useAsyncAction({
        showToast,
        errorMessage: tr('Failed to update audit setting.', 'បរាជ័យក្នុងការធ្វើបច្ចុប្បន្នភាពការកំណត់សវនកម្ម។'),
        invalidateKeys: [['database', 'auditSettings']]
    });

    const { loading: backupLoading, execute: executeBackup } = useAsyncAction({
        showToast,
        successMessage: tr('Database exported successfully!', 'បាននាំចេញមូលដ្ឋានទិន្នន័យដោយជោគជ័យ!'),
        errorMessage: tr('Failed to export database.', 'បរាជ័យក្នុងការនាំចេញមូលដ្ឋានទិន្នន័យ។')
    });

    const { loading: archiveLoading, execute: executeArchive } = useAsyncAction({
        showToast: false
    });

    const { loading: restoreLoading, execute: executeRestore } = useAsyncAction({
        showToast: false
    });

    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const [archiveDays, setArchiveDays] = useState(30);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [restoreFile, setRestoreFile] = useState(null);
    const [restoreProgress, setRestoreProgress] = useState(null);
    const [quotaExceeded, setQuotaExceeded] = useState(false);
    const [healthFailures, setHealthFailures] = useState({});
    const lastHealthErrorKeyRef = useRef('');
    
    const { trackRead, trackWrite, trackDelete } = useActivity();
    const queryClient = useQueryClient();

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

                    const failureCodes = Object.values(failures).map(entry => entry?.code || '').join(' ').toLowerCase();
                    if (failureCodes.includes('resource-exhausted') || failureCodes.includes('quota')) {
                        setQuotaExceeded(true);
                    }

                    const failureKey = Object.keys(failures).sort().join('|');
                    if (lastHealthErrorKeyRef.current !== failureKey) {
                        showToast(
                            tr(`Could not load health metrics for: ${Object.keys(failures).join(', ')}`, `មិនអាចផ្ទុកម៉ែត្រសុខភាពសម្រាប់៖ ${Object.keys(failures).join(', ')}`),
                            'error'
                        );
                        lastHealthErrorKeyRef.current = failureKey;
                    }

                    return { ...defaults, ...partialCounts, lastUpdated: new Date() };
                }

                if (error?.code === 'resource-exhausted' || `${error?.message || ''}`.toLowerCase().includes('quota')) {
                    setQuotaExceeded(true);
                } else {
                    const fallbackKey = error?.code || error?.message || 'database-health-failure';
                    if (lastHealthErrorKeyRef.current !== fallbackKey) {
                        showToast(error?.message || tr('Failed to load database health.', 'មិនអាចផ្ទុកសុខភាពមូលដ្ឋានទិន្នន័យបាន។'), 'error');
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
    const canEditAudit = isActionAllowed('edit', 'database');
    const canDatabaseActions = isActionAllowed('database_actions', 'database');
    const canArchive = isActionAllowed('delete', 'database');

    const handleUpdateAuditSetting = async (key, value) => {
        if (!canEditAudit) {
            return showToast(tr('You do not have permission to perform this action.', 'អ្នកមិនមានសិទ្ធិធ្វើសកម្មភាពនេះទេ។'), "error");
        }

        await executeAudit(async () => {
            await DatabaseService.updateAuditSettings(userRole, userEmail, key, value, auditSettings, trackWrite);
        }, {
            successMessage: key === 'logAll'
                ? tr(`All audit settings ${value ? 'enabled' : 'disabled'}.`, `ការកំណត់សវនកម្មទាំងអស់ត្រូវបាន${value ? 'បើក' : 'បិទ'}។`)
                : tr(`Audit setting updated: ${key} = ${value}`, `បានធ្វើបច្ចុប្បន្នភាពការកំណត់សវនកម្ម៖ ${key} = ${value}`)
        });
    };

    const handleBackupDatabase = async () => {
        if (!canDatabaseActions) {
            return showToast(tr('You do not have permission to perform this action.', 'អ្នកមិនមានសិទ្ធិធ្វើសកម្មភាពនេះទេ។'), "error");
        }

        await executeBackup(async () => {
            await DatabaseService.backup(userRole, trackRead);
        });
    };

    const handleArchiveData = async () => {
        if (!canArchive) {
            return showToast(tr('You do not have permission to perform this action.', 'អ្នកមិនមានសិទ្ធិធ្វើសកម្មភាពនេះទេ។'), "error");
        }

        setShowArchiveConfirm(false);
        showToast(tr('Gathering data to archive...', 'កំពុងប្រមូលទិន្នន័យសម្រាប់ប័ណ្ណសារ...'), "info");

        await executeArchive(async () => {
            const { data, error } = await BaseService.safe(() => DatabaseService.archive(userRole, archiveDays, trackRead, trackDelete));
            if (error) throw new Error(error);
            if (data.deleted > 0) {
                refetchDbHealth();
            }
            return data;
        }).then(({ success, data, error }) => {
            if (success) {
                if (data.deleted === 0) {
                    showToast(tr(`No records found older than ${archiveDays} days.`, `មិនមានកំណត់ត្រាដែលចាស់ជាង ${archiveDays} ថ្ងៃទេ។`), "success");
                } else {
                    showToast(tr(`Successfully archived and deleted ${data.deleted} old records.`, `បានប័ណ្ណសារ និងលុបកំណត់ត្រាចាស់ ${data.deleted} ដោយជោគជ័យ។`), "success");
                }
            } else {
                showToast(error?.message || tr('Failed to archive data.', 'បរាជ័យក្នុងការប័ណ្ណសារទិន្នន័យ។'), "error");
            }
        });
    };

    const handleRestoreConfirm = async () => {
        if (!restoreFile) return;
        if (!canDatabaseActions) {
            return showToast(tr('You do not have permission to perform this action.', 'អ្នកមិនមានសិទ្ធិធ្វើសកម្មភាពនេះទេ។'), "error");
        }

        setShowRestoreConfirm(false);
        showToast(tr('Restoring backup, please wait...', 'កំពុងស្តារបម្រុងទុក សូមរង់ចាំ...'), 'info');

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
                reader.onerror = () => reject(new Error(tr('Failed to read file.', 'មិនអាចអានឯកសារបាន។')));
                reader.readAsText(restoreFile);
            });
        }).then(({ success, data, error }) => {
            if (success) {
                if (data.failedCollections.length > 0) {
                    showToast(
                        tr(
                            `Partially completed (${data.completedCount}/${data.totalDocs}). Issues on: ${data.failedCollections.join(', ')}`,
                            `បានបញ្ចប់ផ្នែកខ្លះ (${data.completedCount}/${data.totalDocs})។ មានបញ្ហានៅ៖ ${data.failedCollections.join(', ')}`
                        ),
                        'warning'
                    );
                } else {
                    showToast(tr(`Successfully restored ${data.completedCount} records!`, `បានស្តារកំណត់ត្រា ${data.completedCount} ដោយជោគជ័យ!`), 'success');
                }
            } else {
                showToast(error?.message || tr('Failed to restore. Invalid format?', 'បរាជ័យក្នុងការស្តារ។ ទម្រង់មិនត្រឹមត្រូវ?'), 'error');
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
                isKhmer ? 'សូមជ្រើសឯកសារ JSON backup ដែលត្រឹមត្រូវ។' : 'Please choose a valid JSON backup file.',
                'error'
            );
            return;
        }
        if (!file.size) {
            showToast(isKhmer ? 'ឯកសារដែលបានជ្រើសគ្មានទិន្នន័យ។' : 'Selected file is empty.', 'error');
            return;
        }
        if (file.size > maxSizeBytes) {
            showToast(
                isKhmer ? 'ឯកសារ backup ធំពេក។ សូមប្រើឯកសារតូចជាង 25 MB។' : 'Backup file is too large. Please use a file smaller than 25 MB.',
                'error'
            );
            return;
        }

        setRestoreFile(file);
        setShowRestoreConfirm(true);
    }, [showToast, language]);

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
                        <h3>{tr('Health Check Incomplete', 'ការត្រួតពិនិត្យសុខភាពមិនទាន់ពេញលេញ')}</h3>
                        <p>
                            {tr('Some collection counts could not be loaded:', 'មិនអាចផ្ទុកចំនួនបណ្ដុំទិន្នន័យខ្លះបាន៖')} {Object.keys(healthFailures).join(', ')}.
                        </p>
                    </div>
                </div>
            )}

            <SectionHeader
                title={tr('Database Management', 'ការគ្រប់គ្រងមូលដ្ឋានទិន្នន័យ')}
                description={tr('Track collection health, backup and restore safely, and tune audit retention.', 'តាមដានសុខភាពបណ្ដុំទិន្នន័យ បម្រុងទុក និងស្តារដោយសុវត្ថិភាព និងកែការរក្សាទុកសវនកម្ម។')}
                icon={RefreshCw}
                rightElement={
                    <Button 
                        variant="ghost" 
                        onClick={handleRefreshHealth}
                        title={tr('Refresh Health', 'ធ្វើបច្ចុប្បន្នភាពសុខភាព')}
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
                onConfirm={handleArchiveData}
                loading={archiveLoading}
            />
        </div>
    );
};

export default DatabaseTab;
