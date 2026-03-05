import React, { useState, useEffect, useCallback } from 'react';
import { Database, RefreshCw, Download, Upload, Trash2, ShieldAlert, Shield, Server, X, FileText, Code, Mail, BarChart2, AlertTriangle, FileJson, Check } from 'lucide-react';
import { useActivity } from '../../../hooks/useActivity';
import { invalidateCache } from '../../../hooks/useFirebaseData';
import styles from '../../Admin.module.scss';
import DatabaseService from '../../../services/DatabaseService';

const DatabaseTab = ({ userRole, showToast, setActiveTab }) => {
    const [dbHealth, setDbHealth] = useState({ posts: 0, projects: 0, messages: 0, auditLogs: 0, users: 0, loading: true, lastUpdated: null });
    const [loading, setLoading] = useState(false);
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const [archiveDays, setArchiveDays] = useState(30);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [restoreFile, setRestoreFile] = useState(null);
    const [auditSettings, setAuditSettings] = useState({ logAll: true, logReads: true, logWrites: true, logDeletes: true, logAnonymous: false });
    const { trackRead, trackWrite, trackDelete } = useActivity();

    const fetchDatabaseHealth = useCallback(async () => {
        setDbHealth(prev => ({ ...prev, loading: true }));
        try {
            const counts = await DatabaseService.getHealth(trackRead);
            setDbHealth({ ...counts, loading: false, lastUpdated: new Date() });
        } catch (error) { console.error("Error fetching db health:", error); setDbHealth(prev => ({ ...prev, loading: false })); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchAuditSettings = useCallback(async () => {
        const settings = await DatabaseService.getAuditSettings();
        if (settings) setAuditSettings(settings);
    }, []);

    useEffect(() => { fetchDatabaseHealth(); fetchAuditSettings(); }, [fetchDatabaseHealth, fetchAuditSettings]);

    const handleUpdateAuditSetting = async (key, value) => {
        try {
            const newSettings = await DatabaseService.updateAuditSettings(userRole, key, value, auditSettings, trackWrite);
            setAuditSettings(prev => ({ ...prev, ...newSettings }));
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
                fetchDatabaseHealth();
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
                const result = await DatabaseService.restore(userRole, event.target.result, trackWrite);
                invalidateCache();
                if (result.failedCollections.length > 0) {
                    showToast(`Partially completed (${result.completedCount}/${result.totalDocs}). Issues on: ${result.failedCollections.join(', ')}`, 'warning');
                } else {
                    showToast(`Successfully restored ${result.completedCount} records!`);
                }
                fetchDatabaseHealth();
            } catch (error) {
                console.error("Import error:", error);
                showToast(error.message || 'Failed to restore. Invalid format?', 'error');
            } finally {
                setLoading(false);
                setRestoreFile(null);
            }
        };
        reader.onerror = () => { showToast('Failed to read file.', 'error'); setLoading(false); };
        reader.readAsText(file);
    };

    const totalDocs = (dbHealth.posts || 0) + (dbHealth.projects || 0) + (dbHealth.messages || 0) + (dbHealth.auditLogs || 0) + (dbHealth.users || 0);
    let capacityPercentage = Math.min((totalDocs / DatabaseService.SOFT_DOC_LIMIT) * 100, 100);
    let barColor = capacityPercentage > 90 ? '#ef4444' : capacityPercentage > 75 ? '#f59e0b' : '#10b981';

    return (
        <div className={styles.section} style={{ paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div className={styles.cardHeader} style={{ marginBottom: 0, display: 'block' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}><Database size={24} /> Database Management</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem', marginBottom: 0 }}>Monitor Firebase health and manage your data backups.</p>
                </div>
                <button onClick={fetchDatabaseHealth} className={styles.iconBtn} title="Refresh Database Health" style={{ background: 'var(--card-bg)', border: '1px solid var(--divider)', color: 'var(--text-primary)', width: '36px', height: '36px', padding: 0 }}>
                    <RefreshCw size={18} className={dbHealth.loading ? styles.spin : ''} style={{ color: 'var(--primary-color)' }} />
                </button>
            </div>

            {/* Database Health Section */}
            <div style={{ marginBottom: '2.5rem' }}>
                <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <BarChart2 size={18} /> Storage Health
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal', marginLeft: 'auto' }}>
                        {dbHealth.lastUpdated ? `Last checked: ${dbHealth.lastUpdated.toLocaleTimeString()}` : 'Counting...'}
                    </span>
                </h4>

                {/* Capacity Bar */}
                <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Free Tier Document Usage (50k Limit Estimate)</span>
                        <span style={{ fontWeight: 'bold', color: barColor }}>{capacityPercentage.toFixed(2)}% ({totalDocs.toLocaleString()} Docs)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${capacityPercentage}%`, height: '100%', background: barColor, transition: 'width 1s ease-out' }}></div>
                    </div>
                </div>

                {/* Collection Counts */}
                <div className={styles.detailGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                    <div className={styles.detailItem} style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.1)', cursor: 'pointer' }} onClick={() => setActiveTab('blog')}>
                        <span className={styles.detailLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FileText size={14} /> Posts</span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span className={styles.detailValue} style={{ fontSize: '1.25rem', color: '#38bdf8' }}>{dbHealth.loading ? '...' : dbHealth.posts}</span>
                            <span style={{ fontSize: '0.65rem', color: '#38bdf8', opacity: 0.7, fontWeight: 'bold' }}>Manage →</span>
                        </div>
                    </div>
                    <div className={styles.detailItem} style={{ background: 'rgba(167, 139, 250, 0.05)', border: '1px solid rgba(167, 139, 250, 0.1)', cursor: 'pointer' }} onClick={() => setActiveTab('projects')}>
                        <span className={styles.detailLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Code size={14} /> Projects</span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span className={styles.detailValue} style={{ fontSize: '1.25rem', color: '#a78bfa' }}>{dbHealth.loading ? '...' : dbHealth.projects}</span>
                            <span style={{ fontSize: '0.65rem', color: '#a78bfa', opacity: 0.7, fontWeight: 'bold' }}>Manage →</span>
                        </div>
                    </div>
                    <div className={styles.detailItem} style={{ background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.1)', cursor: 'pointer' }} onClick={() => setActiveTab('messages')}>
                        <span className={styles.detailLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Mail size={14} /> Messages</span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span className={styles.detailValue} style={{ fontSize: '1.25rem', color: '#34d399' }}>{dbHealth.loading ? '...' : dbHealth.messages}</span>
                            <span style={{ fontSize: '0.65rem', color: '#34d399', opacity: 0.7, fontWeight: 'bold' }}>View →</span>
                        </div>
                    </div>
                    <div className={styles.detailItem} style={{ background: 'rgba(251, 146, 60, 0.05)', border: '1px solid rgba(251, 146, 60, 0.1)', cursor: 'pointer' }} onClick={() => setActiveTab('audit')}>
                        <span className={styles.detailLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Shield size={14} /> Audit Logs</span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span className={styles.detailValue} style={{ fontSize: '1.25rem', color: '#fb923c' }}>{dbHealth.loading ? '...' : dbHealth.auditLogs}</span>
                            <span style={{ fontSize: '0.65rem', color: '#fb923c', opacity: 0.7, fontWeight: 'bold' }}>Review →</span>
                        </div>
                    </div>
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
                            <select value={archiveDays} onChange={(e) => setArchiveDays(Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '6px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                                <option value={30}>Older than 30 Days</option>
                                <option value={90}>Older than 90 Days</option>
                                <option value={180}>Older than 6 Months</option>
                                <option value={365}>Older than 1 Year</option>
                            </select>
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
            {showArchiveConfirm && (
                <div className={styles.modalOverlay} onClick={() => setShowArchiveConfirm(false)} style={{ zIndex: 1100 }}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', padding: 0 }}>
                        <div className={styles.modalHeader} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '1.25rem 1.5rem', background: 'rgba(239, 68, 68, 0.05)' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', margin: 0 }}><Trash2 size={20} /> Confirm Permanent Archive</h3>
                            <button onClick={() => setShowArchiveConfirm(false)} className={styles.closeBtn} style={{ position: 'absolute', top: '50%', right: '1.5rem', transform: 'translateY(-50%)' }}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>You are about to permanently delete all <strong>Messages</strong>, <strong>Audit Logs</strong>, and <strong>Analytics</strong> older than {archiveDays} days.</p>
                            <div style={{ background: 'var(--card-bg)', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}><Database size={16} style={{ color: '#38bdf8' }} /> <strong>Step 1:</strong> Download full JSON Backup</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}><Trash2 size={16} style={{ color: '#ef4444' }} /> <strong>Step 2:</strong> Permanently Delete from Database</div>
                            </div>
                            <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center' }}>Are you absolutely sure?</p>
                        </div>
                        <div className={styles.modalFooter} style={{ padding: '1.25rem 1.5rem', background: 'rgba(255, 255, 255, 0.02)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button onClick={() => setShowArchiveConfirm(false)} className={styles.cancelBtn} style={{ padding: '0.6rem 1.25rem' }}>Cancel</button>
                            <button onClick={() => handleArchiveData(archiveDays)} className={styles.deleteBtn} style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Trash2 size={16} /> Confirm & Archive</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Restore Confirmation Modal */}
            {showRestoreConfirm && (
                <div className={styles.modalOverlay} onClick={() => setShowRestoreConfirm(false)} style={{ zIndex: 1100 }}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', padding: 0 }}>
                        <div className={styles.modalHeader} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '1.25rem 1.5rem', background: 'rgba(108, 99, 255, 0.05)' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', margin: 0 }}><Database size={20} /> Confirm Database Restore</h3>
                            <button onClick={() => setShowRestoreConfirm(false)} className={styles.closeBtn} style={{ position: 'absolute', top: '50%', right: '1.5rem', transform: 'translateY(-50%)' }}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(108, 99, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}><FileJson size={24} /></div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.9rem', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{restoreFile?.name}</div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{(restoreFile?.size / 1024).toFixed(2)} KB • JSON Backup</div>
                                </div>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>This will <strong>overwrite existing documents</strong> if they share the same IDs.</p>
                            <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.1)', marginBottom: '1.5rem' }}>
                                <p style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}><AlertTriangle size={16} /> Warning: This action cannot be undone.</p>
                            </div>
                            <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center' }}>Are you ready to proceed?</p>
                        </div>
                        <div className={styles.modalFooter} style={{ padding: '1.25rem 1.5rem', background: 'rgba(255, 255, 255, 0.02)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button onClick={() => setShowRestoreConfirm(false)} className={styles.cancelBtn} style={{ padding: '0.6rem 1.25rem' }}>Cancel</button>
                            <button onClick={() => { setShowRestoreConfirm(false); processDatabaseRestore(restoreFile); }} className={styles.primaryBtn} style={{ padding: '0.6rem 1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Upload size={16} /> Start Restoration
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatabaseTab;
