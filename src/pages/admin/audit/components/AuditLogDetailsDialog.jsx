import React from 'react';
import { 
  Shield, 
  Mail, 
  Globe, 
  Monitor, 
  MapPin, 
  Key, 
  Clock, 
  Smartphone, 
  Tablet, 
  X 
} from 'lucide-react';
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

const AuditLogDetailsDialog = ({ log, open, onOpenChange }) => {
  if (!log) return null;

  const formatDate = (ts) => {
    if (!ts) return 'Unknown';
    const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleString();
  };

  const details = [
    { label: 'Event Status', value: log.status || 'success', icon: Shield, color: log.status === 'failure' ? '#ef4444' : '#10b981' },
    { label: 'User Email', value: log.user || log.email || 'System', icon: Mail, color: '#38bdf8' },
    { label: 'IP Address', value: log.ipAddress || 'Unknown', icon: Globe, color: '#a78bfa' },
    { label: 'Device', value: log.device || 'Desktop', icon: Monitor, color: '#fb923c', isDevice: true },
    { label: 'Session ID', value: log.sessionId || 'Unknown', icon: Key, color: '#fbbf24' },
    { label: 'Timestamp', value: formatDate(log.time || log.timestamp), icon: Clock, color: '#64ffda', fullWidth: true },
    { label: 'User Agent', value: log.userAgent || 'Unknown', icon: Monitor, color: '#94a3b8', fullWidth: true },
  ];

  if (log.reason) {
    details.splice(1, 0, { label: 'Failure Reason', value: log.reason, icon: Shield, color: '#ef4444', fullWidth: true });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="600px">
        <DialogHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className={styles.modalHeaderIcon}>
              <Shield size={20} />
            </div>
            <DialogTitle>Audit Log Details</DialogTitle>
          </div>
          <DialogClose />
        </DialogHeader>

        <DialogBody>
          <div className={styles.detailsGrid}>
            {details.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div 
                  key={idx} 
                  className={`${styles.detailItem} ${item.fullWidth ? styles.fullWidth : ''}`}
                >
                  <header>
                    <Icon size={14} style={{ color: item.color }} />
                    <span style={{ color: item.color }}>{item.label}</span>
                  </header>
                  <p>
                    {item.isDevice && (
                      <span className={styles.deviceIcon}>
                        {log.device === 'mobile' ? <Smartphone size={12} /> : log.device === 'tablet' ? <Tablet size={12} /> : <Monitor size={12} />}
                      </span>
                    )}
                    {item.value}
                  </p>
                </div>
              );
            })}
          </div>

          {log.details && (
            <div className={styles.payloadSection}>
              <header>Event Payload</header>
              <pre>{JSON.stringify(log.details, null, 2)}</pre>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <button 
            className="ui-button ui-ghost" 
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuditLogDetailsDialog;
