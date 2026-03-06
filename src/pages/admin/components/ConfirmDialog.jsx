import React from 'react';
import { Trash2, Key } from 'lucide-react';
import styles from '../../Admin.module.scss';
import BaseModal from './BaseModal';

const ConfirmDialog = ({ confirmDialog, setConfirmDialog }) => {
    if (!confirmDialog.isOpen) return null;

    const handleClose = () => {
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' });
    };

    const isDanger = confirmDialog.type === 'danger';

    return (
        <BaseModal
            isOpen={confirmDialog.isOpen}
            onClose={handleClose}
            zIndex={1300}
            maxWidth="440px"
            headerStyle={{
                background: isDanger ? 'rgba(239, 68, 68, 0.05)' : 'rgba(251, 146, 60, 0.05)',
                padding: '0.75rem 1.5rem',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}
            bodyStyle={{
                padding: '1.5rem',
                lineHeight: '1.6',
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap'
            }}
            footerStyle={{
                padding: '0.75rem 1.5rem'
            }}
            headerContent={
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: isDanger ? '#ef4444' : '#f97316' }}>
                    {isDanger ? <Trash2 size={20} /> : <Key size={20} />} {confirmDialog.title}
                </h3>
            }
            footerContent={
                <>
                    <button onClick={handleClose} className={styles.cancelBtn} style={{ padding: '0.6rem 1.25rem', margin: 0 }}>
                        Cancel
                    </button>
                    <button onClick={confirmDialog.onConfirm} className={isDanger ? styles.deleteBtn : styles.primaryBtn} style={{ padding: '0.6rem 1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {confirmDialog.confirmText}
                    </button>
                </>
            }
        >
            {confirmDialog.message}
        </BaseModal>
    );
};

export default ConfirmDialog;
