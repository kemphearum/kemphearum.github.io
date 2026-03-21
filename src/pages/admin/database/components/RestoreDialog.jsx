import React from 'react';
import { Upload, FileJson, AlertTriangle } from 'lucide-react';
import { Dialog, Button } from '../../../../shared/components/ui';

const RestoreDialog = ({ 
  open, 
  onOpenChange, 
  restoreFile, 
  onConfirm, 
  loading 
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="460px">
        <Dialog.Header 
          title="Restore Data" 
          icon={Upload}
          variant="primary"
        />
        
        <Dialog.Body>
          <div className="ui-file-info">
            <div className="ui-file-icon">
              <FileJson size={28} />
            </div>
            <div className="ui-file-details">
              <div className="ui-file-name">{restoreFile?.name}</div>
              <div className="ui-file-meta">
                <div className="ui-dot-indicator"></div>
                {(restoreFile?.size / 1024).toFixed(2)} KB • JSON Backup File
              </div>
            </div>
          </div>

          <p className="ui-text-secondary ui-text-center ui-mt-large ui-lh-relaxed">
            Existing database documents with the same IDs will be <strong>completely overwritten</strong> with the backup data.
          </p>

          <div className="ui-warning-box ui-mt-medium">
            <AlertTriangle size={18} /> Warning: This action cannot be undone.
          </div>

          <p className="ui-text-primary ui-font-bold ui-text-center ui-mt-large">
            Are you ready to restore?
          </p>
        </Dialog.Body>

        <Dialog.Footer>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={onConfirm} 
            isLoading={loading}
            icon={Upload}
          >
            Start Full Restore
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

export default RestoreDialog;
