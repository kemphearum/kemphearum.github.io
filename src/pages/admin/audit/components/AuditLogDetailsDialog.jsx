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
import { useTranslation } from '../../../../hooks/useTranslation';

const AuditLogDetailsDialog = ({ log, open, onOpenChange }) => {
  const { language } = useTranslation();
  const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
  const locale = language === 'km' ? 'km-KH' : 'en-US';

  if (!log) return null;

  const formatDate = (ts) => {
    if (!ts) return tr('Unknown', 'មិនស្គាល់');
    const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleString(locale, {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };
  const localizeStatus = (value) => {
    const key = String(value || '').toLowerCase();
    const map = {
      success: tr('Success', 'ជោគជ័យ'),
      failure: tr('Failure', 'បរាជ័យ'),
      enabled: tr('Enabled', 'បានបើក'),
      disabled: tr('Disabled', 'បានបិទ')
    };
    return map[key] || value || tr('Unknown', 'មិនស្គាល់');
  };

  const localizeDevice = (value) => {
    const key = String(value || '').toLowerCase();
    if (key.includes('phone') || key.includes('mobile')) return tr('Mobile', 'ទូរស័ព្ទ');
    if (key.includes('tablet') || key.includes('ipad')) return tr('Tablet', 'ថេប្លេត');
    if (key.includes('desktop') || !key) return tr('Desktop', 'កុំព្យូទ័រ');
    return value;
  };
  const details = [
    { label: tr('Event Status', 'ស្ថានភាពព្រឹត្តិការណ៍'), value: localizeStatus(log.status || 'success'), icon: Shield, color: log.status === 'failure' ? '#ef4444' : '#10b981' },
    { label: tr('User Email', 'អ៊ីមែលអ្នកប្រើ'), value: log.user || log.email || tr('System', 'ប្រព័ន្ធ'), icon: Mail, color: '#38bdf8' },
    { label: tr('IP Address', 'អាសយដ្ឋាន IP'), value: log.ipAddress || tr('Unknown', 'មិនស្គាល់'), icon: Globe, color: '#a78bfa' },
    { label: tr('Device', 'ឧបករណ៍'), value: localizeDevice(log.device), icon: Monitor, color: '#fb923c', isDevice: true },
    { label: tr('Session ID', 'លេខសម្គាល់សម័យ'), value: log.sessionId || tr('Unknown', 'មិនស្គាល់'), icon: Key, color: '#fbbf24' },
    { label: tr('Timestamp', 'ពេលវេលា'), value: formatDate(log.time || log.timestamp), icon: Clock, color: '#64ffda', fullWidth: true },
    { label: tr('User Agent', 'ព័ត៌មានកម្មវិធីរុករក'), value: log.userAgent || tr('Unknown', 'មិនស្គាល់'), icon: Monitor, color: '#94a3b8', fullWidth: true },
  ];

  if (log.reason) {
    details.splice(1, 0, { label: tr('Failure Reason', 'មូលហេតុបរាជ័យ'), value: log.reason, icon: Shield, color: '#ef4444', fullWidth: true });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="600px">
        <DialogHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className={styles.modalHeaderIcon}>
              <Shield size={20} />
            </div>
            <DialogTitle>{tr('Audit Log Details', 'ព័ត៌មានលម្អិតកំណត់ហេតុសវនកម្ម')}</DialogTitle>
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
              <header>{tr('Event Payload', 'ទិន្នន័យព្រឹត្តិការណ៍')}</header>
              <pre>{JSON.stringify(log.details, null, 2)}</pre>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <button 
            className="ui-button ui-ghost" 
            onClick={() => onOpenChange(false)}
          >
            {tr('Close', 'បិទ')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuditLogDetailsDialog;
