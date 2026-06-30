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
  const { language, t } = useTranslation();
  const locale = language === 'km' ? 'km-KH' : 'en-US';

  if (!log) return null;

  const formatDate = (ts) => {
    if (!ts) return t('admin.forms.unknown');
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
      success: t('admin.forms.success'),
      failure: t('admin.forms.failure'),
      enabled: t('admin.forms.enabled'),
      disabled: t('admin.forms.disabled')
    };
    return map[key] || value || t('admin.forms.unknown');
  };

  const localizeDevice = (value) => {
    const key = String(value || '').toLowerCase();
    if (key.includes('phone') || key.includes('mobile')) return t('admin.forms.mobile');
    if (key.includes('tablet') || key.includes('ipad')) return t('admin.forms.tablet');
    if (key.includes('desktop') || !key) return t('admin.forms.desktop');
    return value;
  };
  const details = [
    { label: t('admin.forms.eventStatus'), value: localizeStatus(log.status || 'success'), icon: Shield, color: log.status === 'failure' ? '#ef4444' : '#10b981' },
    { label: t('admin.forms.userEmail'), value: log.user || log.email || t('admin.forms.system'), icon: Mail, color: '#38bdf8' },
    { label: t('admin.forms.iPAddress'), value: log.ipAddress || t('admin.forms.unknown'), icon: Globe, color: '#a78bfa' },
    { label: t('admin.forms.device'), value: localizeDevice(log.device), icon: Monitor, color: '#fb923c', isDevice: true },
    { label: t('admin.forms.sessionID'), value: log.sessionId || t('admin.forms.unknown'), icon: Key, color: '#fbbf24' },
    { label: t('admin.forms.timestamp'), value: formatDate(log.time || log.timestamp), icon: Clock, color: '#64ffda', fullWidth: true },
    { label: t('admin.forms.userAgent'), value: log.userAgent || t('admin.forms.unknown'), icon: Monitor, color: '#94a3b8', fullWidth: true },
  ];

  if (log.reason) {
    details.splice(1, 0, { label: t('admin.forms.failureReason'), value: log.reason, icon: Shield, color: '#ef4444', fullWidth: true });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="600px">
        <DialogHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className={styles.modalHeaderIcon}>
              <Shield size={20} />
            </div>
            <DialogTitle>{t('admin.forms.auditLogDetails')}</DialogTitle>
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
              <header>{t('admin.forms.eventPayload')}</header>
              <pre>{JSON.stringify(log.details, null, 2)}</pre>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <button 
            className="ui-button ui-ghost" 
            onClick={() => onOpenChange(false)}
          >
            {t('admin.forms.close')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuditLogDetailsDialog;
