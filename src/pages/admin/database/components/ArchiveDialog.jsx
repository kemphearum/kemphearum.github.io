import React from 'react';
import { Trash2 } from 'lucide-react';
import { Dialog, Button } from '../../../../shared/components/ui';

const ArchiveDialog = ({ 
  open, 
  onOpenChange, 
  archiveDays, 
  onConfirm, 
  loading 
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="460px">
        <Dialog.Header 
          title="Confirm Archive" 
          icon={Trash2}
          variant="danger"
        />
        
        <Dialog.Body>
          <p className="ui-text-secondary ui-text-center ui-mb-large">
            You are about to permanently delete all <strong>Messages</strong>, <strong>Audit Logs</strong>, and <strong>Analytics</strong> older than <span className="ui-text-danger ui-font-bold">{archiveDays} days</span>.
          </p>

          <div className="ui-card ui-bg-subtle ui-p-medium ui-mb-large">
            <div className="ui-flex-start-gap-medium ui-mb-medium">
              <div className="ui-badge ui-badge-info ui-badge-sm">1</div>
              <div className="ui-text-small">
                <strong>Recommended:</strong> Download full JSON Backup before proceeding.
              </div>
            </div>
            <div className="ui-flex-start-gap-medium">
              <div className="ui-badge ui-badge-danger ui-badge-sm">2</div>
              <div className="ui-text-small">
                <strong>Permanent:</strong> Records will be permanently removed from Firebase.
              </div>
            </div>
          </div>

          <p className="ui-text-primary ui-font-bold ui-text-center">
            Are you absolutely sure?
          </p>
        </Dialog.Body>

        <Dialog.Footer>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={onConfirm} 
            isLoading={loading}
            icon={Trash2}
          >
            Delete Forever
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

export default ArchiveDialog;
