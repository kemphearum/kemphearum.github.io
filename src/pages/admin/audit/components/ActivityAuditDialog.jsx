import React, { useState } from 'react';
import { Eye, Edit3, Trash2, Clock, User, Hash, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogClose
} from '../../../../shared/components/ui/dialog/Dialog';
import styles from '../AuditLogsTab.module.scss';

const ActivityAuditDialog = ({ type, logs, loading, open, onOpenChange }) => {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getHeaderInfo = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    switch (type) {
      case 'read':
        return {
          title: 'Reads Audit History',
          description: `Activity reports for ${dateStr}`,
          icon: Eye,
          color: '#38bdf8'
        };
      case 'write':
        return {
          title: 'Writes Audit History',
          description: `Activity reports for ${dateStr}`,
          icon: Edit3,
          color: '#a78bfa'
        };
      case 'delete':
        return {
          title: 'Deletes Audit History',
          description: `Activity reports for ${dateStr}`,
          icon: Trash2,
          color: '#fb923c'
        };
      default:
        return {
          title: 'Activity History',
          description: `Activity reports for ${dateStr}`,
          icon: Hash,
          color: 'var(--primary-color)'
        };
    }
  };

  const highlightJSON = (data) => {
    if (!data || Object.keys(data).length === 0) {
      return <div className={styles.payloadEmpty}>No metadata recorded for this event.</div>;
    }
    
    const jsonStr = JSON.stringify(data, null, 2);
    
    // Simple regex base for syntax highlighting in a terminal-like view
    const highlighted = jsonStr
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = styles.jsonNumber;
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = styles.jsonKey;
          } else {
            cls = styles.jsonString;
          }
        } else if (/true|false/.test(match)) {
          cls = styles.jsonBool;
        } else if (/null/.test(match)) {
          cls = styles.jsonNull;
        }
        return `<span class="${cls}">${match}</span>`;
      });

    return <div dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  const info = getHeaderInfo();
  const Icon = info.icon;

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="900px">
        <DialogHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div 
              className={styles.modalHeaderIcon} 
              style={{ background: 'transparent', color: info.color, border: `1px solid ${info.color}30` }}
            >
              <Icon size={18} />
            </div>
            <div>
              <DialogTitle style={{ fontSize: '1.1rem', fontWeight: 600 }}>{info.title}</DialogTitle>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', opacity: 0.8 }}>
                {info.description}
              </div>
            </div>
          </div>
          <DialogClose />
        </DialogHeader>

        <DialogBody style={{ padding: 0, overflow: 'hidden' }}>
          <div className={styles.dialogTableWrapper} style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
                <div className="ui-spinner ui-spinner--md" />
              </div>
            ) : logs.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No activity records found for this period.
              </div>
            ) : (
              <table className={styles.activityTable}>
                <thead className={styles.activityHeader}>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>OPERATION & TARGET</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>COUNT</th>
                    <th>ORIGINATOR</th>
                    <th style={{ width: '150px' }}>TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => {
                    const rowId = log.id || index;
                    const isExpanded = expandedRows.has(rowId);
                    const time = log.time?.seconds 
                      ? new Date(log.time.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
                      : '-';

                    return (
                      <React.Fragment key={rowId}>
                        <tr 
                          className={`${styles.activityRow} ${isExpanded ? styles.expanded : ''}`}
                          onClick={() => toggleRow(rowId)}
                        >
                          <td className={styles.activityCell} style={{ textAlign: 'center' }}>
                            <ChevronRight 
                              size={16} 
                              className={`${styles.expandIcon} ${isExpanded ? styles.active : ''}`} 
                            />
                          </td>
                          <td className={styles.activityCell}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div 
                                className={styles.moduleIcon}
                                style={{ background: `${info.color}15`, color: info.color }}
                              >
                                <Icon size={14} />
                              </div>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {log.label || log.details?.action || `Logged ${type} access`}
                                {log.details?.path && (
                                  <span style={{ color: 'var(--text-secondary)', fontWeight: 400, marginLeft: '4px' }}>
                                    : {log.details.path}
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className={styles.activityCell} style={{ textAlign: 'center' }}>
                            <span className={styles.countBadge}>1</span>
                          </td>
                          <td className={styles.activityCell}>
                            <div className={styles.originator}>
                              <div className={styles.statusDot} style={{ background: info.color }} />
                              <span style={{ fontSize: '0.85rem' }}>{log.user || 'system'}</span>
                            </div>
                          </td>
                          <td className={styles.activityCell}>
                            <span className={styles.timestamp}>{time}</span>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={5} style={{ padding: 0 }}>
                              <div className={styles.payloadDisplay}>
                                <header>Event Payload</header>
                                <pre>
                                  {highlightJSON(log.details || log.data || {})}
                                </pre>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </DialogBody>

        <DialogFooter style={{ background: 'rgba(0,0,0,0.1)', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginRight: 'auto' }}>
            <span style={{ opacity: 0.6 }}>Total Tracked:</span>
            <strong style={{ color: info.color }}>{logs.length} records</strong>
          </div>
          <button 
            className="ui-button ui-ghost" 
            onClick={() => onOpenChange(false)}
            style={{ fontSize: '0.85rem' }}
          >
            Close Pipeline
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(ActivityAuditDialog);
