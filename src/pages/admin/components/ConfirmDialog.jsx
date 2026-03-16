import React from 'react';
import { Trash2, Key } from 'lucide-react';
import styles from '../styles/adminModals.module.scss';
import cardStyles from '../styles/adminCards.module.scss';
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
            smallHeader={true}
            headerStyle={{
                background: isDanger ? 'rgba(239, 68, 68, 0.05)' : 'rgba(251, 146, 60, 0.05)'
            }}
            bodyStyle={{
                lineHeight: '1.6',
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap'
            }}
            headerContent={
                <h3 style={{ color: isDanger ? '#ef4444' : '#f97316' }}>
                    {isDanger ? <Trash2 size={20} /> : <Key size={20} />} {confirmDialog.title}
                </h3>
            }
            footerContent={
                <>
                    <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} className={cardStyles.secondaryBtn} style={{ margin: 0 }}>
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            confirmDialog.onConfirm?.();
                            setConfirmDialog({ ...confirmDialog, isOpen: false });
                        }}
                        className={confirmDialog.type === 'danger' ? cardStyles.deleteBtn : cardStyles.primaryBtn}
                        style={{ margin: 0, padding: '0.65rem 1.5rem' }}
                    >
                        {confirmDialog.confirmText || 'Confirm'}
                    </button>
                </>
            }
        >
            {confirmDialog.message}
        </BaseModal>
    );
};

export default ConfirmDialog;
