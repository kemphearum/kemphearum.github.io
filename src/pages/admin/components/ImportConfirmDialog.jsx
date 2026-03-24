import React from 'react';
import { Upload, FileText } from 'lucide-react';
import { Dialog, Button } from '@/shared/components/ui';
import { useTranslation } from '../../../hooks/useTranslation';

const ImportConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
  title = '',
  description = '',
  fileName = '',
  format = '',
  stats = [],
  notes = [],
  confirmText = ''
}) => {
  const { language } = useTranslation();
  const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
  const resolvedTitle = title || tr('Confirm Import', 'បញ្ជាក់ការនាំចូល');
  const resolvedConfirmText = confirmText || tr('Import', 'នាំចូល');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="560px" className="ui-importConfirmDialog">
        <Dialog.Header className="ui-importConfirmDialog__header">
          <div className="ui-importConfirmDialog__titleWrap">
            <div className="ui-importConfirmDialog__icon">
              <Upload size={18} />
            </div>
            <div>
              <Dialog.Title>{resolvedTitle}</Dialog.Title>
              {description && <Dialog.Description>{description}</Dialog.Description>}
            </div>
          </div>
          <Dialog.Close />
        </Dialog.Header>

        <Dialog.Body className="ui-importConfirmDialog__body">
          <div className="ui-importConfirmDialog__fileMeta">
            <FileText size={16} />
            <span className="ui-importConfirmDialog__fileName">{fileName || tr('Selected file', 'ឯកសារដែលបានជ្រើស')}</span>
            {format && <span className="ui-importConfirmDialog__format">{format}</span>}
          </div>

          {stats.length > 0 && (
            <div className="ui-importConfirmDialog__stats">
              {stats.map(({ label, value }) => (
                <div key={label} className="ui-importConfirmDialog__stat">
                  <span className="ui-importConfirmDialog__statValue">{value}</span>
                  <span className="ui-importConfirmDialog__statLabel">{label}</span>
                </div>
              ))}
            </div>
          )}

          {notes.length > 0 && (
            <div className="ui-importConfirmDialog__notes">
              {notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          )}
        </Dialog.Body>

        <Dialog.Footer className="ui-importConfirmDialog__footer">
          <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
            {tr('Cancel', 'បោះបង់')}
          </Button>
          <Button onClick={onConfirm} isLoading={loading}>
            {loading ? tr('Importing...', 'កំពុងនាំចូល...') : resolvedConfirmText}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

export default ImportConfirmDialog;
