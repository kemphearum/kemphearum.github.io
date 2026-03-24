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
import { useTranslation } from '../../../../hooks/useTranslation';

const ActivityAuditDialog = ({ type, logs, loading, open, onOpenChange }) => {
  const { language } = useTranslation();
  const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const locale = language === 'km' ? 'km-KH' : 'en-US';

  const localizeAction = (value) => {
    const key = String(value || '').toLowerCase();
    const map = {
      read: tr('Read', 'អាន'),
      write: tr('Write', 'សរសេរ'),
      delete: tr('Delete', 'លុប'),
      created: tr('Created', 'បានបង្កើត'),
      updated: tr('Updated', 'បានកែប្រែ'),
      deleted: tr('Deleted', 'បានលុប')
    };
    return map[key] || value || tr('Activity event', 'ព្រឹត្តិការណ៍សកម្មភាព');
  };

  const resolveOperationLabel = (log) => {
    const candidate = log?.label || log?.details?.action || type;
    return localizeAction(candidate);
  };
  const handleOpenChange = (nextOpen) => {
    if (!nextOpen) setExpandedRows(new Set());
    onOpenChange(nextOpen);
  };

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
    const dateStr = now.toLocaleDateString(locale, {
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    switch (type) {
      case 'read':
        return {
          title: tr('Reads Audit History', 'ប្រវត្តិសវនកម្មការអាន'),
          description: tr(`Activity reports for ${dateStr}`, `របាយការណ៍សកម្មភាពសម្រាប់ ${dateStr}`),
          icon: Eye,
          color: '#38bdf8'
        };
      case 'write':
        return {
          title: tr('Writes Audit History', 'ប្រវត្តិសវនកម្មការកែប្រែ'),
          description: tr(`Activity reports for ${dateStr}`, `របាយការណ៍សកម្មភាពសម្រាប់ ${dateStr}`),
          icon: Edit3,
          color: '#a78bfa'
        };
      case 'delete':
        return {
          title: tr('Deletes Audit History', 'ប្រវត្តិសវនកម្មការលុប'),
          description: tr(`Activity reports for ${dateStr}`, `របាយការណ៍សកម្មភាពសម្រាប់ ${dateStr}`),
          icon: Trash2,
          color: '#fb923c'
        };
      default:
        return {
          title: tr('Activity History', 'ប្រវត្តិសកម្មភាព'),
          description: tr(`Activity reports for ${dateStr}`, `របាយការណ៍សកម្មភាពសម្រាប់ ${dateStr}`),
          icon: Hash,
          color: 'var(--primary-color)'
        };
    }
  };

  const highlightJSON = (data) => {
    if (!data || Object.keys(data).length === 0) {
      return null;
    }
    
    const jsonStr = JSON.stringify(data, null, 2);
    
    // Simple regex base for syntax highlighting in a terminal-like view
    const highlighted = jsonStr
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, (match) => {
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

    return highlighted;
  };

  const info = getHeaderInfo();
  const Icon = info.icon;

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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

        <DialogBody style={{ padding: 0, overflow: 'auto' }}>
          <div className={styles.dialogTableWrapper} style={{ maxHeight: '60vh', overflow: 'auto' }}>
            {loading ? (
              <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
                <div className="ui-spinner ui-spinner--md" />
              </div>
            ) : logs.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                {tr('No activity records found for this period.', 'មិនមានកំណត់ត្រាសកម្មភាពសម្រាប់រយៈពេលនេះទេ។')}
              </div>
            ) : (
              <table className={styles.activityTable} style={{ minWidth: '680px' }}>
                <thead className={styles.activityHeader}>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>{tr('OPERATION & TARGET', 'សកម្មភាព និងគោលដៅ')}</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>{tr('COUNT', 'ចំនួន')}</th>
                    <th>{tr('ORIGINATOR', 'អ្នកបង្កើត')}</th>
                    <th style={{ width: '150px' }}>{tr('TIMESTAMP', 'ពេលវេលា')}</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => {
                    const rowId = log.id || index;
                    const isExpanded = expandedRows.has(rowId);
                    const time = log.time?.seconds
                      ? new Date(log.time.seconds * 1000).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
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
                                {resolveOperationLabel(log)}
                                {log.details?.path && (
                                  <span style={{ color: 'var(--text-secondary)', fontWeight: 400, marginLeft: '4px' }}>
                                    : {log.details.path}
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className={styles.activityCell} style={{ textAlign: 'center' }}>
                            <span className={styles.countBadge}>{Number.isFinite(log.count) ? log.count : 1}</span>
                          </td>
                          <td className={styles.activityCell}>
                            <div className={styles.originator}>
                              <div className={styles.statusDot} style={{ background: info.color }} />
                              <span style={{ fontSize: '0.85rem' }}>{log.user || tr('System', 'ប្រព័ន្ធ')}</span>
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
                                <header>{tr('Event Payload', 'ទិន្នន័យព្រឹត្តិការណ៍')}</header>
                                {(() => {
                                  const payloadHtml = highlightJSON(log.details || log.data || {});
                                  if (!payloadHtml) {
                                    return <div className={styles.payloadEmpty}>{tr('No metadata recorded for this event.', 'មិនមានមេតាដាតាសម្រាប់ព្រឹត្តិការណ៍នេះទេ។')}</div>;
                                  }
                                  return <pre dangerouslySetInnerHTML={{ __html: payloadHtml }} />;
                                })()}
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
            <span style={{ opacity: 0.6 }}>{tr('Total Tracked:', 'សរុបដែលបានតាមដាន:')}</span>
            <strong style={{ color: info.color }}>{logs.length} {tr('records', 'កំណត់ត្រា')}</strong>
          </div>
          <button 
            className="ui-button ui-ghost" 
            onClick={() => handleOpenChange(false)}
            style={{ fontSize: '0.85rem' }}
          >
            {tr('Close', 'បិទ')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(ActivityAuditDialog);
