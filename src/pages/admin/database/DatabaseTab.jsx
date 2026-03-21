import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Services & Hooks
import DatabaseService from '../../../services/DatabaseService';
import { useActivity } from '../../../hooks/useActivity';
import { useAsyncAction } from '../../../hooks/useAsyncAction';

// Components
import SectionHeader from '../components/SectionHeader';
import { Button } from '../../../shared/components/ui';
import DatabaseStats from './components/DatabaseStats';
import DatabaseActions from './components/DatabaseActions';
import RestoreDialog from './components/RestoreDialog';
import ArchiveDialog from './components/ArchiveDialog';
import AuditSettingsPanel from './components/AuditSettingsPanel';
import RestoreProgress from './components/RestoreProgress';

// Styles
import styles from './DatabaseTab.module.scss';

const DatabaseTab = ({ userRole, showToast, setActiveTab, isActionAllowed }) => {
    const { loading: auditLoading, execute: executeAudit } = useAsyncAction({
        showToast,
        errorMessage: 'Failed to update audit setting.',
        invalidateKeys: [['auditSettings']]
    });

    const { loading: backupLoading, execute: executeBackup } = useAsyncAction({
        showToast,
        successMessage: "Database exported successfully!",
        errorMessage: "Failed to export database."
    });

    const { loading: archiveLoading, execute: executeArchive } = useAsyncAction({
        showToast: false
    });

    const { loading: restoreLoading, execute: executeRestore } = useAsyncAction({
        showToast: false
    });

    const isAnyLoading = auditLoading || backupLoading || archiveLoading || restoreLoading;
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const [archiveDays, setArchiveDays] = useState(30);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [restoreFile, setRestoreFile] = useState(null);
    const [restoreProgress, setRestoreProgress] = useState(null);
    
    const { trackRead, trackWrite, trackDelete } = useActivity();
    const queryClient = useQueryClient();

    // Queries
    const { 
        data: dbHealth = { posts: 0, projects: 0, experience: 0, content: 0, messages: 0, auditLogs: 0, users: 0, rolePermissions: 0, settings: 0, visits: 0, dailyUsage: 0 }, 
        isFetching: dbHealthLoading, 
        refetch: refetchDbHealth 
    } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
        queryKey: ['dbHealth'],
        queryFn: async () => {
            const counts = await DatabaseService.getHealth(trackRead);
            return { ...counts, lastUpdated: new Date() };
        }
    });

    const { data: auditSettings = { logAll: true, logReads: true, logWrites: true, logDeletes: true, logAnonymous: false } } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
        queryKey: ['auditSettings'],
        queryFn: async () => {
            const settings = await DatabaseService.getAuditSettings();
            return settings || { logAll: true, logReads: true, logWrites: true, logDeletes: true, logAnonymous: false };
        }
    });

    // Handlers
    const canEditAudit = isActionAllowed('edit', 'database');
    const canDatabaseActions = isActionAllowed('database_actions', 'database');
    const canArchive = isActionAllowed('delete', 'database');

    const handleUpdateAuditSetting = async (key, value) => {
        if (!canEditAudit) {
            return showToast("You do not have permission to perform this action.", "error");
        }

        await executeAudit(async () => {
            await DatabaseService.updateAuditSettings(userRole, key, value, auditSettings, trackWrite);
        }, {
            successMessage: key === 'logAll' ? `All audit settings ${value ? 'enabled' : 'disabled'}.` : `Audit setting updated: ${key} = ${value}`
        });
    };

    const handleBackupDatabase = async () => {
        if (!canDatabaseActions) {
            return showToast("You do not have permission to perform this action.", "error");
        }

        await executeBackup(async () => {
            await DatabaseService.backup(userRole, trackRead);
        });
    };

    const handleArchiveData = async () => {
        if (!canArchive) {
            return showToast("You do not have permission to perform this action.", "error");
        }

        setShowArchiveConfirm(false);
        showToast("Gathering data to archive...", "info");

        await executeArchive(async () => {
            const result = await DatabaseService.archive(userRole, archiveDays, trackRead, trackDelete);
            if (result.deleted > 0) {
                refetchDbHealth();
            }
            return result;
        }).then(({ success, data, error }) => {
            if (success) {
                if (data.deleted === 0) {
                    showToast(`No records found older than ${archiveDays} days.`, "success");
                } else {
                    showToast(`Successfully archived and deleted ${data.deleted} old records.`, "success");
                }
            } else {
                showToast(error?.message || "Failed to archive data.", "error");
            }
        });
    };

    const handleRestoreConfirm = async () => {
        if (!restoreFile) return;
        if (!canDatabaseActions) {
            return showToast("You do not have permission to perform this action.", "error");
        }

        setShowRestoreConfirm(false);
        showToast('Restoring backup, please wait...', 'info');

        await executeRestore(async () => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const result = await DatabaseService.restore(
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

                        queryClient.invalidateQueries();
                        refetchDbHealth();
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    } finally {
                        setRestoreFile(null);
                        setTimeout(() => setRestoreProgress(null), 3000);
                    }
                };
                reader.onerror = () => reject(new Error('Failed to read file.'));
                reader.readAsText(restoreFile);
            });
        }).then(({ success, data, error }) => {
            if (success) {
                if (data.failedCollections.length > 0) {
                    showToast(`Partially completed (${data.completedCount}/${data.totalDocs}). Issues on: ${data.failedCollections.join(', ')}`, 'warning');
                } else {
                    showToast(`Successfully restored ${data.completedCount} records!`, 'success');
                }
            } else {
                showToast(error?.message || 'Failed to restore. Invalid format?', 'error');
            }
        });
    };

    const totalDocs = Object.values(dbHealth).reduce((acc, val) => typeof val === 'number' ? acc + val : acc, 0) - (dbHealth.lastUpdated ? 0 : 0);
    // Adjusted totalDocs calculation to be safer
    const calculatedTotal = (dbHealth.posts || 0) + (dbHealth.projects || 0) + (dbHealth.experience || 0) + (dbHealth.content || 0) + (dbHealth.messages || 0) + (dbHealth.auditLogs || 0) + (dbHealth.users || 0) + (dbHealth.rolePermissions || 0) + (dbHealth.settings || 0) + (dbHealth.visits || 0) + (dbHealth.dailyUsage || 0);

    return (
        <div className={styles.container}>
            <RestoreProgress progress={restoreProgress} />

            <SectionHeader
                title="Database Management"
                description="Monitor Firebase health and manage your data backups."
                icon={RefreshCw}
                rightElement={
                    <Button 
                        variant="ghost" 
                        onClick={() => refetchDbHealth()}
                        title="Refresh Health"
                        className="ui-btn-icon-only"
                    >
                        <RefreshCw size={18} className={dbHealthLoading ? styles.spin : ''} />
                    </Button>
                }
            />

            <DatabaseStats 
                dbHealth={dbHealth}
                loading={dbHealthLoading}
                totalDocs={calculatedTotal}
                setActiveTab={setActiveTab}
            />

            <DatabaseActions 
                loading={isAnyLoading}
                onBackup={handleBackupDatabase}
                onRestoreSelect={(file) => { setRestoreFile(file); setShowRestoreConfirm(true); }}
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
