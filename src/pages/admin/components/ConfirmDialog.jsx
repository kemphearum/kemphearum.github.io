import React from 'react';
import { Trash2, Key, X } from 'lucide-react';
import styles from '../../Admin.module.scss';

const ConfirmDialog = ({ confirmDialog, setConfirmDialog }) => {
    if (!confirmDialog.isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' })} style={{ zIndex: 1300 }}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', padding: 0, borderRadius: '16px' }}>
                <div className={styles.modalHeader} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '1.25rem 1.5rem', background: confirmDialog.type === 'danger' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(251, 146, 60, 0.05)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: confirmDialog.type === 'danger' ? '#ef4444' : '#f97316', margin: 0 }}>
                        {confirmDialog.type === 'danger' ? <Trash2 size={20} /> : <Key size={20} />} {confirmDialog.title}
                    </h3>
                    <button onClick={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' })} className={styles.closeBtn} style={{ position: 'absolute', top: '50%', right: '1.5rem', transform: 'translateY(-50%)' }}>
                        <X size={20} />
                    </button>
                </div>
                <div style={{ padding: '1.5rem', lineHeight: '1.6', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                    {confirmDialog.message}
                </div>
                <div className={styles.modalFooter} style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button onClick={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' })} className={styles.cancelBtn} style={{ padding: '0.6rem 1.25rem', margin: 0 }}>
                        Cancel
                    </button>
                    <button onClick={confirmDialog.onConfirm} className={confirmDialog.type === 'danger' ? styles.deleteBtn : styles.primaryBtn} style={{ padding: '0.6rem 1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {confirmDialog.confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
