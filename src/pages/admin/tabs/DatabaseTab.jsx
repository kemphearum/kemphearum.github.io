import React, { useState } from 'react';
import { Database, RefreshCw, Download, Upload, Trash2, ShieldAlert, Shield, Server, X, FileText, Code, Mail, BarChart2, AlertTriangle, FileJson, Check, Users } from 'lucide-react';
import { useActivity } from '../../../hooks/useActivity';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import styles from '../../Admin.module.scss';
import DatabaseService from '../../../services/DatabaseService';
import BaseModal from '../components/BaseModal';
import SectionHeader from '../components/SectionHeader';
import UsageBar from '../components/UsageBar';
import StatCard from '../components/StatCard';
import FormSelect from '../components/FormSelect';

const DatabaseTab = ({ userRole, showToast, setActiveTab }) => {
    const [loading, setLoading] = useState(false);
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const [archiveDays, setArchiveDays] = useState(30);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [restoreFile, setRestoreFile] = useState(null);
    const [restoreProgress, setRestoreProgress] = useState(null); // { completed, total, percentage }
    const { trackRead, trackWrite, trackDelete } = useActivity();
    const queryClient = useQueryClient();

    const { data: dbHealth = { posts: 0, projects: 0, messages: 0, auditLogs: 0, users: 0 }, isFetching: dbHealthLoading, refetch: refetchDbHealth } = useQuery({
        queryKey: ['dbHealth'],
        queryFn: async () => {
            const counts = await DatabaseService.getHealth(trackRead);
            return { ...counts, lastUpdated: new Date() };
        }
    });

    const { data: auditSettings = { logAll: true, logReads: true, logWrites: true, logDeletes: true, logAnonymous: false } } = useQuery({
        queryKey: ['auditSettings'],
        queryFn: async () => {
            const settings = await DatabaseService.getAuditSettings();
            return settings || { logAll: true, logReads: true, logWrites: true, logDeletes: true, logAnonymous: false };
        }
    });

    const handleUpdateAuditSetting = async (key, value) => {
        try {
            await DatabaseService.updateAuditSettings(userRole, key, value, auditSettings, trackWrite);
            queryClient.invalidateQueries({ queryKey: ['auditSettings'] });
            showToast(key === 'logAll' ? `All audit settings ${value ? 'enabled' : 'disabled'}.` : `Audit setting updated: ${key} = ${value}`);
        } catch (error) {
            console.error("Error updating audit setting:", error);
            showToast(error.message || "Failed to update audit setting.", "error");
        }
    };

    const handleBackupDatabase = async () => {
        try {
            setLoading(true);
            await DatabaseService.backup(userRole, trackRead);
            showToast("Database exported successfully!", "success");
        } catch (error) {
            console.error("Error exporting:", error);
            showToast(error.message || "Failed to export database.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleArchiveData = async (daysOld = 30) => {
        try {
            setShowArchiveConfirm(false);
            setLoading(true);
            showToast("Gathering data to archive...", "success");

            const result = await DatabaseService.archive(userRole, daysOld, trackRead, trackDelete);

            if (result.deleted === 0) {
                showToast(`No records found older than ${daysOld} days.`, "success");
            } else {
                showToast(`Successfully archived and deleted ${result.deleted} old records.`, "success");
                refetchDbHealth();
            }
        } catch (error) {
            console.error("Error archiving:", error);
            showToast(error.message || "Failed to archive data.", "error");
        } finally {
            setLoading(false);
        }
    };

    const processDatabaseRestore = async (file) => {
        if (!file) return;
        setLoading(true);
        showToast('Restoring backup, please wait...', 'info');
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
                if (result.failedCollections.length > 0) {
                    showToast(`Partially completed (${result.completedCount}/${result.totalDocs}). Issues on: ${result.failedCollections.join(', ')}`, 'warning');
                } else {
                    showToast(`Successfully restored ${result.completedCount} records!`);
                }
                refetchDbHealth();
            } catch (error) {
                console.error("Import error:", error);
                showToast(error.message || 'Failed to restore. Invalid format?', 'error');
            } finally {
                setLoading(false);
                setRestoreFile(null);
                // Clear progress after a delay
                setTimeout(() => setRestoreProgress(null), 3000);
            }
        };
        reader.onerror = () => { showToast('Failed to read file.', 'error'); setLoading(false); };
        reader.readAsText(file);
    };

    const totalDocs = (dbHealth.posts || 0) + (dbHealth.projects || 0) + (dbHealth.messages || 0) + (dbHealth.auditLogs || 0) + (dbHealth.users || 0);

    return (
        <div className={styles.section} style={{ paddingBottom: '4rem' }}>
            {/* Progress Alert */}
            {restoreProgress && (
                <div className={styles.floatingProgress}>
                    <div className={styles.progressHeader}>
                        <div className={styles.progressTitle}>
                            <RefreshCw size={18} className={styles.spin} />
                            <span>Restoring Database...</span>
                        </div>
                        <span className={styles.progressPercent}>{restoreProgress.percentage}%</span>
                    </div>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${restoreProgress.percentage}%` }}></div>
                    </div>
                    <div className={styles.progressDetails}>
                        {restoreProgress.completed.toLocaleString()} / {restoreProgress.total.toLocaleString()} records processed
                    </div>
                </div>
            )}

            <SectionHeader
                title="Database Management"
                description="Monitor Firebase health and manage your data backups."
                icon={Database}
                rightElement={
                    <button onClick={() => refetchDbHealth()} className={styles.iconBtn} title="Refresh Database Health" style={{ background: 'var(--card-bg)', border: '1px solid var(--divider)', color: 'var(--text-primary)', width: '36px', height: '36px', padding: 0 }}>
                        <RefreshCw size={18} className={dbHealthLoading ? styles.spin : ''} style={{ color: 'var(--primary-color)' }} />
                    </button>
                }
            />

            {/* Database Health Section */}
            <div style={{ marginBottom: '2.5rem' }}>
                <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <BarChart2 size={18} /> Storage Health
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal', marginLeft: 'auto' }}>
                        {dbHealth.lastUpdated ? `Last checked: ${dbHealth.lastUpdated.toLocaleTimeString()}` : 'Counting...'}
                    </span>
                </h4>

                <UsageBar
                    label="Free Tier Document Usage (50k Limit Estimate)"
                    current={totalDocs}
                    total={DatabaseService.SOFT_DOC_LIMIT}
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.25rem'
                    }}
                />

                {/* Collection Counts Grid */}
                <div className={styles.analyticsGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                    <StatCard
                        icon={FileText}
                        value={dbHealthLoading ? '...' : (dbHealth.posts || 0)}
                        label="Posts"
                        color="#38bdf8"
                        onClick={() => setActiveTab('blog')}
                        description="View & Edit Content"
                    />
                    <StatCard
                        icon={Code}
                        value={dbHealthLoading ? '...' : (dbHealth.projects || 0)}
                        label="Projects"
                        color="#a78bfa"
                        onClick={() => setActiveTab('projects')}
                        description="Project Portfolio"
                    />
                    <StatCard
                        icon={Mail}
                        value={dbHealthLoading ? '...' : (dbHealth.messages || 0)}
                        label="Messages"
                        color="#34d399"
                        onClick={() => setActiveTab('messages')}
                        description="User Inquiries"
                    />
                    <StatCard
                        icon={Users}
                        value={dbHealthLoading ? '...' : (dbHealth.users || 0)}
                        label="Users"
                        color="#fb923c"
                        onClick={() => setActiveTab('users')}
                        description="Admin Access"
                    />
                </div>
            </div>

            {/* Database Actions Section */}
            <div style={{ marginBottom: '2.5rem' }}>
                <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Server size={18} /> Database Actions
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                    {/* Full Backup */}
                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <h5 style={{ margin: '0 0 0.4rem 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Download size={18} /> Full JSON Backup</h5>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Download all database collections in a single JSON file.</p>
                        </div>
                        <button onClick={handleBackupDatabase} disabled={loading} className={styles.primaryBtn} style={{ margin: 0, background: '#10b981', color: '#fff', border: 'none', alignSelf: 'flex-start' }}>
                            <Download size={16} /> Backup Database
                        </button>
                    </div>

                    {/* Data Restoration */}
                    <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <h5 style={{ margin: '0 0 0.4rem 0', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Upload size={18} /> Restore from Backup</h5>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Restore your database using a previously downloaded JSON file. <strong>Warning:</strong> May overwrite existing data.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <input type="file" id="restore-upload" hidden accept=".json" onChange={(e) => { if (e.target.files?.[0]) { setRestoreFile(e.target.files[0]); setShowRestoreConfirm(true); } }} />
                            <button onClick={() => document.getElementById('restore-upload').click()} disabled={loading} className={styles.primaryBtn} style={{ margin: 0, background: '#6366f1', color: '#fff', border: 'none' }}>
                                <Upload size={16} /> Select File
                            </button>
                        </div>
                    </div>

                    {/* Archive Cleanup */}
                    <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <h5 style={{ margin: '0 0 0.4rem 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Trash2 size={18} /> Archive Old Records</h5>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Clear messages, audit logs, and analytics older than a specified period.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <FormSelect
                                noWrapper
                                value={archiveDays}
                                onChange={(e) => setArchiveDays(Number(e.target.value))}
                                options={[
                                    { value: 30, label: 'Older than 30 Days' },
                                    { value: 90, label: 'Older than 90 Days' },
                                    { value: 180, label: 'Older than 6 Months' },
                                    { value: 365, label: 'Older than 1 Year' }
                                ]}
                                style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.85rem', width: 'auto' }}
                            />
                            <button onClick={() => setShowArchiveConfirm(true)} disabled={loading} className={styles.primaryBtn} style={{ margin: 0, background: '#ef4444', color: '#fff', border: 'none' }}>
                                <ShieldAlert size={16} /> Archive Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Audit Log Configuration */}
            <div style={{ marginTop: '2.5rem' }}>
                <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 600 }}>
                    <Shield size={20} style={{ color: 'var(--text-primary)' }} /> Audit Log Configuration
                </h4>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border, rgba(255,255,255,0.05))', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Master Toggle */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'rgba(255,255,255,0.02)', padding: '1.25rem 1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: auditSettings.logAll ? 'rgba(108, 99, 255, 0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: auditSettings.logAll ? 'var(--primary-color)' : 'var(--text-secondary)', transition: 'all 0.3s ease' }}>
                                <Shield size={22} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '0.25rem' }}>Master Audit Tracking</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Enable or disable all database activity logging globally.</div>
                            </div>
                            <button onClick={() => handleUpdateAuditSetting('logAll', !auditSettings.logAll)} style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', background: auditSettings.logAll ? '#6366f1' : 'rgba(255,255,255,0.05)', color: auditSettings.logAll ? '#fff' : 'var(--text-secondary)', border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                                {auditSettings.logAll ? 'Enabled' : 'Disabled'}
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                            {[
                                { key: 'logReads', label: 'Log Read Operations', desc: 'Track when documents are fetched.' },
                                { key: 'logWrites', label: 'Log Write Operations', desc: 'Track creates and updates.' },
                                { key: 'logDeletes', label: 'Log Delete Operations', desc: 'Track document removals.' },
                                { key: 'logAnonymous', label: 'Log Anonymous Actions', desc: 'Track public visitors.' },
                            ].map(item => (
                                <div key={`health-${item.key}-${item.label}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', background: 'rgba(255,255,255,0.015)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s', cursor: 'pointer' }} onClick={() => handleUpdateAuditSetting(item.key, !auditSettings[item.key])}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>{item.label}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '4px', border: auditSettings[item.key] ? 'none' : '1px solid var(--text-secondary)', background: auditSettings[item.key] ? '#6366f1' : 'transparent', color: '#fff', flexShrink: 0 }}>
                                        {auditSettings[item.key] && <Check size={14} strokeWidth={3} />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Archive Confirmation Modal */}
            <BaseModal
                isOpen={showArchiveConfirm}
                onClose={() => setShowArchiveConfirm(false)}
                zIndex={1300}
                maxWidth="460px"
                contentStyle={{ borderRadius: '16px', padding: 0 }}
                headerStyle={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem 1.75rem', background: 'rgba(239, 68, 68, 0.05)' }}
                headerContent={
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ef4444', margin: 0 }}>
                        <Trash2 size={22} strokeWidth={2.5} /> Confirm Archive
                    </h3>
                }
                bodyStyle={{ padding: '1.75rem', lineHeight: '1.6' }}
                footerStyle={{ padding: '1.25rem 1.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}
                footerContent={
                    <>
                        <button onClick={() => setShowArchiveConfirm(false)} className={styles.cancelBtn} style={{ padding: '0.6rem 1.25rem', margin: 0 }}>Cancel</button>
                        <button onClick={() => handleArchiveData(archiveDays)} className={styles.deleteBtn} style={{ padding: '0.6rem 1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Trash2 size={16} /> Delete Forever
                        </button>
                    </>
                }
            >
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                    You are about to permanently delete all <strong>Messages</strong>, <strong>Audit Logs</strong>, and <strong>Analytics</strong> older than <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{archiveDays} days</span>.
                </p>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', flexShrink: 0, fontWeight: 'bold', fontSize: '0.75rem' }}>1</div>
                        <div><strong>Recommended:</strong> Download full JSON Backup before proceeding.</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0, fontWeight: 'bold', fontSize: '0.75rem' }}>2</div>
                        <div><strong>Permanent:</strong> Records will be permanently removed from Firebase.</div>
                    </div>
                </div>

                <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: '600', textAlign: 'center', margin: 0 }}>Are you absolutely sure?</p>
            </BaseModal>

            {/* Restore Confirmation Modal */}
            <BaseModal
                isOpen={showRestoreConfirm}
                onClose={() => setShowRestoreConfirm(false)}
                zIndex={1300}
                maxWidth="460px"
                contentStyle={{ borderRadius: '16px', padding: 0 }}
                headerStyle={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem 1.75rem', background: 'rgba(99, 102, 241, 0.05)' }}
                headerContent={
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary-color)', margin: 0 }}>
                        <Upload size={22} strokeWidth={2.5} /> Restore Data
                    </h3>
                }
                bodyStyle={{ padding: '1.75rem' }}
                footerStyle={{ padding: '1.25rem 1.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}
                footerContent={
                    <>
                        <button onClick={() => setShowRestoreConfirm(false)} className={styles.cancelBtn} style={{ padding: '0.6rem 1.25rem', margin: 0 }}>Cancel</button>
                        <button onClick={() => { setShowRestoreConfirm(false); processDatabaseRestore(restoreFile); }} className={styles.primaryBtn} style={{ padding: '0.6rem 1.75rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Upload size={18} /> Start Full Restore
                        </button>
                    </>
                }
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem', padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', flexShrink: 0 }}>
                        <FileJson size={28} />
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{restoreFile?.name}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }}></div>
                            {(restoreFile?.size / 1024).toFixed(2)} KB • JSON Backup File
                        </div>
                    </div>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '1.25rem', textAlign: 'center' }}>
                    Existing database documents with the same IDs will be <strong>completely overwritten</strong> with the backup data.
                </p>

                <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.1)', marginBottom: '1.5rem' }}>
                    <p style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, justifyContent: 'center' }}>
                        <AlertTriangle size={18} /> Warning: This action cannot be undone.
                    </p>
                </div>

                <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center', margin: 0 }}>Are you ready to restore?</p>
            </BaseModal>
        </div>
    );
};

export default DatabaseTab;
