import React from 'react';
import { Upload, FileJson, AlertTriangle } from 'lucide-react';
import { Dialog, Button } from '../../../../shared/components/ui';
import { useTranslation } from '../../../../hooks/useTranslation';

const RestoreDialog = ({
  open,
  onOpenChange,
  restoreFile,
  onConfirm,
  loading
}) => {
  const { t } = useTranslation();

  if (!restoreFile) return null;

  const sizeKb = (restoreFile.size / 1024).toFixed(2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="460px">
        <Dialog.Header
          title={t('admin.forms.restoreData')}
          icon={Upload}
          variant="primary"
        />

        <Dialog.Body>
          <div className="ui-file-info">
            <div className="ui-file-icon">
              <FileJson size={28} />
            </div>
            <div className="ui-file-details">
              <div className="ui-file-name">{restoreFile.name}</div>
              <div className="ui-file-meta">
                <div className="ui-dot-indicator"></div>
                {sizeKb} KB - {t('admin.forms.jSONBackupFile')}
              </div>
            </div>
          </div>

          <p className="ui-text-secondary ui-text-center ui-mt-large ui-lh-relaxed">
            {t('admin.forms.existingDatabaseDocu')} <strong>{t('admin.forms.completelyOverwritte')}</strong> {t('admin.forms.withTheBackupData')}
          </p>

          <div className="ui-warning-box ui-mt-medium">
            <AlertTriangle size={18} /> {t('admin.forms.warningThisActionCan')}
          </div>

          <p className="ui-text-primary ui-font-bold ui-text-center ui-mt-large">
            {t('admin.forms.areYouReadyToRestore')}
          </p>
        </Dialog.Body>

        <Dialog.Footer>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('admin.forms.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            isLoading={loading}
            icon={Upload}
          >
            {t('admin.forms.startRestore')}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

export default RestoreDialog;
