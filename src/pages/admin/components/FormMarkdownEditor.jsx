import React from 'react';
import { Bold, Italic, Link as LinkIcon, Code, Eye, Edit2 } from 'lucide-react';
import styles from '../../Admin.module.scss';
import MarkdownRenderer from '../../../components/MarkdownRenderer';

/**
 * FormMarkdownEditor component with toolbar actions and preview capability.
 */
const FormMarkdownEditor = ({
    label,
    value,
    onChange,
    id = "markdown-editor",
    rows = 10,
    isPreviewMode = false,
    onTogglePreview = () => { },
    placeholder = "Write in Markdown...",
    required = false,
    fullWidth = true
}) => {

    const insertMarkdown = (syntax) => {
        const textarea = document.getElementById(id);
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = value || '';
        const selectedText = text.substring(start, end);
        let newText;

        switch (syntax) {
            case 'bold':
                newText = text.substring(0, start) + `**${selectedText || 'bold text'}**` + text.substring(end);
                break;
            case 'italic':
                newText = text.substring(0, start) + `*${selectedText || 'italic text'}*` + text.substring(end);
                break;
            case 'link':
                newText = text.substring(0, start) + `[${selectedText || 'Link text'}](url)` + text.substring(end);
                break;
            case 'code':
                newText = text.substring(0, start) + `\n\`\`\`\n${selectedText || 'code here'}\n\`\`\`\n` + text.substring(end);
                break;
            default:
                return;
        }

        onChange({ target: { value: newText } });
        setTimeout(() => {
            textarea.focus();
            // Optional: set selection back
        }, 0);
    };

    return (
        <div className={styles.inputGroup} style={fullWidth ? { gridColumn: 'span 2' } : {}}>
            <div className={styles.editorHeader}>
                {label && <label>{label}</label>}
                <div className={styles.toolbar}>
                    {!isPreviewMode && (
                        <div className={styles.formatGroup}>
                            <button type="button" onClick={() => insertMarkdown('bold')} title="Bold"><Bold size={16} /></button>
                            <button type="button" onClick={() => insertMarkdown('italic')} title="Italic"><Italic size={16} /></button>
                            <button type="button" onClick={() => insertMarkdown('link')} title="Link"><LinkIcon size={16} /></button>
                            <button type="button" onClick={() => insertMarkdown('code')} title="Code Block"><Code size={16} /></button>
                        </div>
                    )}
                    <button type="button" className={styles.previewToggle} onClick={onTogglePreview}>
                        {isPreviewMode ? <><Edit2 size={14} /> Edit</> : <><Eye size={14} /> Preview</>}
                    </button>
                </div>
            </div>

            {isPreviewMode ? (
                <div className={styles.previewBox}>
                    <MarkdownRenderer content={value || '*Nothing to preview...*'} />
                </div>
            ) : (
                <textarea
                    id={id}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    rows={rows}
                    required={required}
                    style={{ fontFamily: 'monospace' }}
                />
            )}
        </div>
    );
};

export default FormMarkdownEditor;
