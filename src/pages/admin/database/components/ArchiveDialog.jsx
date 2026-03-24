import React from 'react';
import { Trash2 } from 'lucide-react';
import { Dialog, Button } from '../../../../shared/components/ui';
import { useTranslation } from '../../../../hooks/useTranslation';

const ArchiveDialog = ({ 
  open, 
  onOpenChange, 
  archiveDays, 
  onConfirm, 
  loading 
}) => {
  const { language } = useTranslation();
  const tr = (enText, kmText) => (language === 'km' ? kmText : enText);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="460px">
        <Dialog.Header 
          title={tr('Confirm Archive', 'បញ្ជាក់ការប័ណ្ណសារ')} 
          icon={Trash2}
          variant="danger"
        />
        
        <Dialog.Body>
          <p className="ui-text-secondary ui-text-center ui-mb-large">
            {tr('You are about to permanently delete all', 'អ្នកកំពុងលុបជាអចិន្ត្រៃយ៍')} <strong>{tr('Messages', 'សារ')}</strong>, <strong>{tr('Audit Logs', 'កំណត់ហេតុសវនកម្ម')}</strong>, {tr('and', 'និង')} <strong>{tr('Analytics', 'វិភាគ')}</strong> {tr('older than', 'ដែលចាស់ជាង')} <span className="ui-text-danger ui-font-bold">{archiveDays} {tr('days', 'ថ្ងៃ')}</span>.
          </p>

          <div className="ui-card ui-bg-subtle ui-p-medium ui-mb-large">
            <div className="ui-flex-start-gap-medium ui-mb-medium">
              <div className="ui-badge ui-badge-info ui-badge-sm">1</div>
              <div className="ui-text-small">
                <strong>{tr('Recommended:', 'ណែនាំ៖')}</strong> {tr('Download full JSON Backup before proceeding.', 'ទាញយក JSON Backup ពេញលេញ មុនពេលបន្ត។')}
              </div>
            </div>
            <div className="ui-flex-start-gap-medium">
              <div className="ui-badge ui-badge-danger ui-badge-sm">2</div>
              <div className="ui-text-small">
                <strong>{tr('Permanent:', 'អចិន្ត្រៃយ៍៖')}</strong> {tr('Records will be permanently removed from Firebase.', 'កំណត់ត្រានឹងត្រូវដកចេញពី Firebase ជាអចិន្ត្រៃយ៍។')}
              </div>
            </div>
          </div>

          <p className="ui-text-primary ui-font-bold ui-text-center">
            {tr('Are you absolutely sure?', 'តើអ្នកប្រាកដទេ?')}
          </p>
        </Dialog.Body>

        <Dialog.Footer>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {tr('Cancel', 'បោះបង់')}
          </Button>
          <Button 
            variant="danger" 
            onClick={onConfirm} 
            isLoading={loading}
            icon={Trash2}
          >
            {tr('Archive and Delete', 'ប័ណ្ណសារ និងលុប')}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

export default ArchiveDialog;
