import React, { useState } from 'react';
import { ShieldAlert, Play, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { db } from '../../../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import DatabaseService from '../../../../services/DatabaseService';
import { useTranslation } from '../../../../hooks/useTranslation';

const DatabaseHealthCheck = ({ showToast }) => {
    const { t } = useTranslation();
    const tm = (key, params = {}) => t(`admin.database.${key}`, params);

    const [running, setRunning] = useState(false);
    const [results, setResults] = useState(null);

    const runHealthCheck = async () => {
        setRunning(true);
        setResults(null);
        try {
            const collectionsToCheck = DatabaseService.HEALTH_COLLECTIONS.filter(c => !['auditLogs', 'dailyUsage', 'visits', 'messages'].includes(c));
            let issues = [];
            let docsChecked = 0;
            
            for (const col of collectionsToCheck) {
                const snap = await getDocs(collection(db, col));
                const slugs = new Set();
                
                let i = 0;
                for (const doc of snap.docs) {
                    if (i++ % 50 === 0) await new Promise(r => setTimeout(r, 0)); // Throttle
                    
                    docsChecked++;
                    const data = doc.data();
                    const id = doc.id;
                    
                    // 1. Missing Required Fields
                    if (!data.title && !data.name && !data.role) {
                        issues.push({ type: 'warning', message: `Document missing primary title/name/role field`, doc: `${col}/${id}` });
                    }
                    if (data.visible === undefined && data.published === undefined && data.status === undefined) {
                        issues.push({ type: 'warning', message: `Document missing visibility/status flag`, doc: `${col}/${id}` });
                    }
                    
                    // 2. Duplicate Slugs
                    if (data.slug) {
                        if (slugs.has(data.slug)) {
                            issues.push({ type: 'error', message: `Duplicate slug "${data.slug}" found`, doc: `${col}/${id}` });
                        }
                        slugs.add(data.slug);
                    }
                    
                    // 3. Invalid Timestamps
                    const checkTimestamp = (val, fieldName) => {
                        if (val && typeof val === 'object' && val.seconds === undefined && !val.toDate) {
                             issues.push({ type: 'error', message: `Invalid timestamp format in "${fieldName}"`, doc: `${col}/${id}` });
                        } else if (val && typeof val === 'string' && isNaN(Date.parse(val))) {
                             issues.push({ type: 'warning', message: `String date cannot be parsed in "${fieldName}"`, doc: `${col}/${id}` });
                        }
                    };
                    checkTimestamp(data.updatedAt, 'updatedAt');
                }
            }

            setResults({
                docsChecked,
                issues,
                score: Math.max(0, 100 - (issues.filter(i => i.type === 'error').length * 5) - (issues.filter(i => i.type === 'warning').length * 2))
            });
            showToast(tm('toasts.healthCheckComplete'), 'success');
        } catch (err) {
            console.error(err);
            showToast(tm('toasts.healthCheckFailed'), 'error');
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="ui-actions-section">
            <div className="ui-flex-between ui-mb-medium">
                <h4 className="ui-flex-center-gap-small ui-m-0">
                    <ShieldAlert size={18} className="ui-text-accent" /> Data Integrity & Health Check
                </h4>
                <Button variant="outline" size="sm" onClick={runHealthCheck} disabled={running}>
                    {running ? <RefreshCw size={16} className="ui-spin" /> : <Play size={16} />} 
                    {running ? 'Checking...' : 'Run Diagnostics'}
                </Button>
            </div>
            
            {results && (
                <div className="ui-card ui-p-medium">
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: results.score === 100 ? 'var(--color-success)' : results.score > 80 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                            {results.score}/100
                        </div>
                        <div>
                            <div className="ui-font-bold">{tm('ui.healthScore')}</div>
                            <div className="ui-text-muted ui-text-small">Checked {results.docsChecked} documents across primary collections.</div>
                        </div>
                    </div>
                    
                    {results.issues.length === 0 ? (
                        <div className="ui-p-medium ui-bg-subtle-light ui-rounded ui-flex-center-gap-small" style={{ color: 'var(--color-success)' }}>
                            <CheckCircle size={18} /> No integrity issues found!
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                            {results.issues.map((issue, idx) => (
                                <div key={idx} className="ui-bg-subtle ui-p-small ui-rounded" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    {issue.type === 'error' ? <XCircle size={16} className="ui-text-danger" style={{ flexShrink: 0 }} /> : <AlertTriangle size={16} className="ui-text-warning" style={{ flexShrink: 0 }} />}
                                    <div style={{ flex: 1, fontSize: '0.85rem' }}>
                                        <div style={{ fontWeight: 'bold' }}>{issue.message}</div>
                                        <div className="ui-text-muted" style={{ fontFamily: 'monospace', marginTop: '2px' }}>{issue.doc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            {!results && !running && (
                <div className="ui-text-muted ui-text-small">
                    Scans collections to detect missing required fields, duplicate slugs, and invalid timestamp formats.
                </div>
            )}
        </div>
    );
};

export default DatabaseHealthCheck;
