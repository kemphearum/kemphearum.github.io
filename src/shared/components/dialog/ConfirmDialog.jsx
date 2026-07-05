import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { Dialog, Button } from '../ui';
import { useTranslation } from '../../../hooks/useTranslation';

const ConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  loading,
  title,
  message,
  confirmLabel,
  loadingLabel,
  confirmVariant = 'primary',
  tone = 'info',
  note,
  icon,
}) => {
  const { t } = useTranslation();
  const DefaultIcon = tone === 'danger' || tone === 'warning' ? AlertTriangle : Info;
  const ConfirmIcon = icon || DefaultIcon;

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
                {title || t('admin.common.confirm.title', 'Please Confirm')}
              </Dialog.Title>
              <Dialog.Description className="ui-confirm-dialog__description">
                {t('admin.common.confirm.review', 'Review before you continue.')}
              </Dialog.Description>
            </div>
          </div>
          <Dialog.Close />
        </Dialog.Header>
        
        <Dialog.Body className="ui-confirm-dialog__body">
          <p className="ui-confirm-dialog__message">
            {message || t('admin.common.confirm.message', 'Are you sure you want to proceed?')}
          </p>
          {note && <p className="ui-confirm-dialog__note">{note}</p>}
        </Dialog.Body>
        
        <Dialog.Footer className="ui-confirm-dialog__footer">
          <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
            {t('admin.common.cancel', 'Cancel')}
          </Button>
          <Button 
            variant={confirmVariant}
            onClick={onConfirm} 
            isLoading={loading}
          >
            {loading ? (loadingLabel || t('admin.common.processing', 'Processing...')) : (confirmLabel || t('admin.common.confirm.button', 'Confirm'))}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

export default ConfirmDialog;
