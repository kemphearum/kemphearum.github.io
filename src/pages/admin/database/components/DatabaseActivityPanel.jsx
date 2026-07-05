import React, { useState, useEffect } from 'react';
import { Activity, Shield } from 'lucide-react';
import { db } from '../../../../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

const DatabaseActivityPanel = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(15));
                const snap = await getDocs(q);
                const fetched = [];
                snap.forEach(doc => fetched.push({ id: doc.id, ...doc.data() }));
                setLogs(fetched);
            } catch (err) {
                console.error('Failed to fetch audit logs', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    return (
        <div className="ui-actions-section">
            <div className="ui-flex-between ui-mb-medium">
                <h4 className="ui-flex-center-gap-small ui-m-0">
                    <Shield size={18} className="ui-text-accent" /> Database Activity (Audit Logs)
                </h4>
            </div>
            
            <div className="ui-card ui-p-medium">
                {loading ? (
                    <div className="ui-text-center ui-text-muted">{tm('ui.loadingActivity')}</div>
                ) : logs.length === 0 ? (
                    <div className="ui-text-center ui-text-muted">{tm('ui.noRecentActivity')}</div>
                ) : (
                    <div className="ui-table-container">
                        <table className="ui-table">
                            <thead>
                                <tr>
                                    <th>{tm('ui.time')}</th>
                                    <th>{tm('ui.action')}</th>
                                    <th>{tm('ui.user')}</th>
                                    <th>{tm('ui.details')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => {
                                    const date = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp || log.createdAt);
                                    return (
                                        <tr key={log.id}>
                                            <td style={{ whiteSpace: 'nowrap' }}>
                                                {date ? date.toLocaleString() : 'Unknown'}
                                            </td>
                                            <td className="ui-font-bold">{log.action}</td>
                                            <td>{log.email || log.user || 'System'}</td>
                                            <td className="ui-text-muted">
                                                {JSON.stringify(log.details || {})}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DatabaseActivityPanel;
