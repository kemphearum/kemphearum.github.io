import React from 'react';
import { Bold, Italic, Link as LinkIcon, Code, Eye, Edit2 } from 'lucide-react';
import MarkdownRenderer from '@/sections/MarkdownRenderer';
import { useFormContext } from 'react-hook-form';

/**
 * FormMarkdownEditor component with toolbar actions and preview capability.
 */
const FormMarkdownEditor = ({
    value,
    onChange,
    name,
    id = "markdown-editor",
    rows = 10,
    isPreviewMode = false,
    onTogglePreview = () => { },
    placeholder = "Write in Markdown...",
    required = false,
    fullWidth = true,
    ...props
}) => {
    const formContext = useFormContext();
    const watchedValue = formContext && name ? formContext.watch(name) : undefined;
    const currentValue = watchedValue ?? value ?? '';

    const emitChange = (nextValue) => {
        if (onChange) {
            onChange({
                target: {
                    name,
                    value: nextValue
                }
            });
        }

        if (formContext && name) {
            formContext.setValue(name, nextValue, { shouldDirty: true, shouldTouch: true });
        }
    };

    const insertMarkdown = (syntax) => {
        const textarea = document.getElementById(id);
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = currentValue;
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

        emitChange(newText);
        setTimeout(() => {
            textarea.focus();
            // Optional: set selection back
        }, 0);
    };

    return (
        <div className="ui-formGroup" style={fullWidth ? { gridColumn: 'span 2' } : {}}>
            <div className="ui-editorHeader">
                <div className="ui-toolbar">
                    {!isPreviewMode && (
                        <div className="ui-formatGroup">
                            <button type="button" onClick={() => insertMarkdown('bold')} title="Bold"><Bold size={16} /></button>
                            <button type="button" onClick={() => insertMarkdown('italic')} title="Italic"><Italic size={16} /></button>
                            <button type="button" onClick={() => insertMarkdown('link')} title="Link"><LinkIcon size={16} /></button>
                            <button type="button" onClick={() => insertMarkdown('code')} title="Code Block"><Code size={16} /></button>
                        </div>
                    )}
                    <button type="button" className="ui-previewToggle" onClick={onTogglePreview}>
                        {isPreviewMode ? <><Edit2 size={14} /> Edit</> : <><Eye size={14} /> Preview</>}
                    </button>
                </div>
            </div>

            {isPreviewMode ? (
                <div className="ui-previewBox">
                    <MarkdownRenderer content={currentValue || '*Nothing to preview...*'} />
                </div>
            ) : (
                <textarea
                    id={id}
                    placeholder={placeholder}
                    value={currentValue}
                    onChange={(event) => emitChange(event.target.value)}
                    rows={rows}
                    required={required}
                    style={{ fontFamily: 'monospace' }}
                    {...props}
                />
            )}
        </div>
    );
};

export default FormMarkdownEditor;
