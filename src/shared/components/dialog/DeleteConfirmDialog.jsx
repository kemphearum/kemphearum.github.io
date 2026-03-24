import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Dialog, Button } from '../ui';

const DeleteConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  loading,
  title,
  message,
  confirmLabel = 'Delete',
  loadingLabel = 'Deleting...',
  confirmVariant = 'danger',
  tone = 'danger',
  note,
  icon,
}) => {
  const ConfirmIcon = icon || AlertTriangle;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="440px" className={`ui-confirm-dialog ui-confirm-dialog--${tone}`}>
        <Dialog.Header className="ui-confirm-dialog__header">
          <div className="ui-confirm-dialog__titleWrap">
            <div className="ui-confirm-dialog__icon" aria-hidden="true">
              <ConfirmIcon size={18} />
            </div>
            <div>
              <Dialog.Title className="ui-confirm-dialog__title">
                {title || 'Confirm Deletion'}
              </Dialog.Title>
              <Dialog.Description className="ui-confirm-dialog__description">
                Review the impact before you continue.
              </Dialog.Description>
            </div>
          </div>
          <Dialog.Close />
        </Dialog.Header>
        
        <Dialog.Body className="ui-confirm-dialog__body">
          <p className="ui-confirm-dialog__message">
            {message || 'Are you sure you want to delete this item? This action cannot be undone.'}
          </p>
          {note && <p className="ui-confirm-dialog__note">{note}</p>}
        </Dialog.Body>
        
        <Dialog.Footer className="ui-confirm-dialog__footer">
          <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
            Cancel
          </Button>
          <Button 
            variant={confirmVariant}
            onClick={onConfirm} 
            isLoading={loading}
          >
            {loading ? loadingLabel : confirmLabel}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
