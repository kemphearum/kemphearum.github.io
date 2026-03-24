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
  const { language } = useTranslation();
  const tr = (enText, kmText) => (language === 'km' ? kmText : enText);

  if (!restoreFile) return null;

  const sizeKb = (restoreFile.size / 1024).toFixed(2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="460px">
        <Dialog.Header
          title={tr('Restore Data', 'ស្ដារទិន្នន័យ')}
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
                {sizeKb} KB - {tr('JSON backup file', 'ឯកសារ JSON backup')}
              </div>
            </div>
          </div>

          <p className="ui-text-secondary ui-text-center ui-mt-large ui-lh-relaxed">
            {tr('Existing database documents with the same IDs will be', 'ឯកសារមូលដ្ឋានទិន្នន័យដែលមាន ID ដូចគ្នា នឹងត្រូវ')} <strong>{tr('completely overwritten', 'សរសេរជាន់ទាំងស្រុង')}</strong> {tr('with the backup data.', 'ដោយទិន្នន័យបម្រុង។')}
          </p>

          <div className="ui-warning-box ui-mt-medium">
            <AlertTriangle size={18} /> {tr('Warning: This action cannot be undone.', 'ព្រមាន៖ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។')}
          </div>

          <p className="ui-text-primary ui-font-bold ui-text-center ui-mt-large">
            {tr('Are you ready to restore?', 'តើអ្នករួចរាល់សម្រាប់ស្ដារទិន្នន័យទេ?')}
          </p>
        </Dialog.Body>

        <Dialog.Footer>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {tr('Cancel', 'បោះបង់')}
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            isLoading={loading}
            icon={Upload}
          >
            {tr('Start Restore', 'ចាប់ផ្តើមស្ដារ')}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

export default RestoreDialog;
