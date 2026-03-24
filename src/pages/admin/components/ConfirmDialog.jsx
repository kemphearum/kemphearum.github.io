import React from 'react';
import { Trash2, Key } from 'lucide-react';
import { Dialog, Button } from '@/shared/components/ui';

const ConfirmDialog = ({ confirmDialog, setConfirmDialog }) => {
    if (!confirmDialog.isOpen) return null;

    const handleClose = () => {
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' });
    };

    const isDanger = confirmDialog.type === 'danger';

    return (
        <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && handleClose()}>
            <Dialog.Content maxWidth="440px" style={{ zIndex: 1300 }}>
                <Dialog.Header style={{ background: isDanger ? 'rgba(239, 68, 68, 0.05)' : 'rgba(251, 146, 60, 0.05)' }}>
                    <Dialog.Title style={{ color: isDanger ? '#ef4444' : '#f97316', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {isDanger ? <Trash2 size={20} /> : <Key size={20} />} {confirmDialog.title}
                    </Dialog.Title>
                </Dialog.Header>

                <Dialog.Body style={{ lineHeight: '1.6', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                    {confirmDialog.message}
                </Dialog.Body>

                <Dialog.Footer>
                    <Button variant="ghost" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button 
                        variant={isDanger ? "danger" : "primary"}
                        onClick={() => { confirmDialog.onConfirm?.(); handleClose(); }}
                    >
                        {confirmDialog.confirmText}
                    </Button>
                </Dialog.Footer>
            </Dialog.Content>
        </Dialog>
    );
};

export default ConfirmDialog;
