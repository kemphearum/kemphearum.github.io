import React, { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../../context/NotificationContextValue';
import { useTranslation } from '../../../hooks/useTranslation';
import styles from './NotificationCenter.module.scss';

const TYPE_COLOR = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
};

const NotificationCenter = () => {
    const { t, language } = useTranslation();
    const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const handlePointer = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false);
        };
        const handleKey = (event) => { if (event.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', handlePointer);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handlePointer);
            document.removeEventListener('keydown', handleKey);
        };
    }, [open]);

    const toggle = () => {
        setOpen((prev) => {
            const next = !prev;
            if (next && unreadCount > 0) markAllRead();
            return next;
        });
    };

    const formatTime = (timestamp) => new Intl.DateTimeFormat(language === 'km' ? 'km-KH' : 'en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(new Date(timestamp));

    return (
        <div className={styles.wrapper} ref={wrapperRef}>
            <button
                type="button"
                className={styles.bell}
                onClick={toggle}
                aria-label={t('admin.notifications.title')}
                title={t('admin.notifications.title')}
            >
                <Bell size={18} />
                {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>

            {open && (
                <div className={styles.panel} role="dialog" aria-label={t('admin.notifications.title')}>
                    <div className={styles.header}>
                        <span>{t('admin.notifications.title')}</span>
                        {notifications.length > 0 && (
                            <button type="button" className={styles.clear} onClick={clearAll}>
                                {t('admin.notifications.clearAll')}
                            </button>
                        )}
                    </div>
                    <div className={styles.list}>
                        {notifications.length === 0 ? (
                            <div className={styles.empty}>{t('admin.notifications.empty')}</div>
                        ) : (
                            notifications.map((item) => (
                                <div key={item.id} className={styles.item}>
                                    <span className={styles.dot} style={{ background: TYPE_COLOR[item.type] || TYPE_COLOR.info }} />
                                    <div className={styles.body}>
                                        <span className={styles.message}>{item.message}</span>
                                        <span className={styles.time}>{formatTime(item.timestamp)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
