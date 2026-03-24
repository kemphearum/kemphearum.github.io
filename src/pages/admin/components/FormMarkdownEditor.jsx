import React, { useId, useRef, useState } from 'react';
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
    id,
    rows = 10,
    isPreviewMode,
    onTogglePreview,
    placeholder = "Write in Markdown...",
    required = false,
    fullWidth = true,
    className = '',
    ...props
}) => {
    const formContext = useFormContext();
    const textareaRef = useRef(null);
    const internalId = useId();
    const textareaId = id || `markdown-editor-${internalId.replace(/:/g, '')}`;
    const [localPreviewMode, setLocalPreviewMode] = useState(false);

    const watchedValue = formContext && name ? formContext.watch(name) : undefined;
    const currentValue = watchedValue ?? value ?? '';
    const isPreviewControlled = typeof isPreviewMode === 'boolean';
    const previewMode = isPreviewControlled ? isPreviewMode : localPreviewMode;

    const characterCount = currentValue.length;
    const wordCount = currentValue.trim() ? currentValue.trim().split(/\s+/).length : 0;

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

    const applyInsertion = ({
        insertion,
        selectionStartOffset = insertion.length,
        selectionEndOffset = selectionStartOffset
    }) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const sourceText = currentValue || '';
        const nextValue = sourceText.slice(0, start) + insertion + sourceText.slice(end);

        emitChange(nextValue);
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + selectionStartOffset, start + selectionEndOffset);
        }, 0);
    };

    const insertMarkdown = (syntax) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = (currentValue || '').slice(start, end);
        const hasSelection = Boolean(selectedText);
        let insertion = '';
        let selectionStartOffset = 0;
        let selectionEndOffset = 0;

        switch (syntax) {
            case 'bold':
                insertion = `**${selectedText || 'bold text'}**`;
                selectionStartOffset = 2;
                selectionEndOffset = insertion.length - 2;
                break;
            case 'italic':
                insertion = `*${selectedText || 'italic text'}*`;
                selectionStartOffset = 1;
                selectionEndOffset = insertion.length - 1;
                break;
            case 'link':
                insertion = `[${selectedText || 'Link text'}](https://example.com)`;
                if (hasSelection) {
                    selectionStartOffset = 1;
                    selectionEndOffset = 1 + selectedText.length;
                } else {
                    const urlStart = insertion.indexOf('https://example.com');
                    selectionStartOffset = urlStart;
                    selectionEndOffset = urlStart + 'https://example.com'.length;
                }
                break;
            case 'code':
                insertion = `\n\`\`\`\n${selectedText || 'code here'}\n\`\`\`\n`;
                selectionStartOffset = insertion.indexOf(selectedText || 'code here');
                selectionEndOffset = selectionStartOffset + (selectedText || 'code here').length;
                break;
            default:
                return;
        }

        applyInsertion({ insertion, selectionStartOffset, selectionEndOffset });
    };

    const handleTogglePreview = () => {
        if (typeof onTogglePreview === 'function') {
            onTogglePreview();
        }

        if (!isPreviewControlled) {
            setLocalPreviewMode((prev) => !prev);
        }
    };

    const handleKeyDown = (event) => {
        const hasModifier = event.ctrlKey || event.metaKey;

        if (hasModifier && !event.shiftKey) {
            const key = event.key.toLowerCase();

            if (key === 'b') {
                event.preventDefault();
                insertMarkdown('bold');
                return;
            }

            if (key === 'i') {
                event.preventDefault();
                insertMarkdown('italic');
                return;
            }

            if (key === 'k') {
                event.preventDefault();
                insertMarkdown('link');
            }
        }

        if (event.key === 'Tab') {
            event.preventDefault();
            applyInsertion({ insertion: '  ' });
        }
    };

    return (
        <div className="ui-formGroup" style={fullWidth ? { gridColumn: 'span 2' } : {}}>
            <div className="ui-markdownEditor">
                <div className="ui-editorHeader">
                    <div className="ui-toolbar">
                        {!previewMode && (
                            <div className="ui-formatGroup" role="toolbar" aria-label="Markdown formatting controls">
                                <button
                                    type="button"
                                    className="ui-markdownAction"
                                    onClick={() => insertMarkdown('bold')}
                                    title="Bold (Ctrl/Cmd+B)"
                                    aria-label="Bold"
                                >
                                    <Bold size={16} />
                                </button>
                                <button
                                    type="button"
                                    className="ui-markdownAction"
                                    onClick={() => insertMarkdown('italic')}
                                    title="Italic (Ctrl/Cmd+I)"
                                    aria-label="Italic"
                                >
                                    <Italic size={16} />
                                </button>
                                <button
                                    type="button"
                                    className="ui-markdownAction"
                                    onClick={() => insertMarkdown('link')}
                                    title="Link (Ctrl/Cmd+K)"
                                    aria-label="Link"
                                >
                                    <LinkIcon size={16} />
                                </button>
                                <button
                                    type="button"
                                    className="ui-markdownAction"
                                    onClick={() => insertMarkdown('code')}
                                    title="Code block"
                                    aria-label="Code block"
                                >
                                    <Code size={16} />
                                </button>
                            </div>
                        )}
                        <button
                            type="button"
                            className={`ui-previewToggle ${previewMode ? 'ui-isActive' : ''}`}
                            onClick={handleTogglePreview}
                            aria-pressed={previewMode}
                            aria-label={previewMode ? 'Switch to edit mode' : 'Switch to preview mode'}
                        >
                            {previewMode ? <><Edit2 size={14} /> Edit</> : <><Eye size={14} /> Preview</>}
                        </button>
                    </div>
                </div>

                {previewMode ? (
                    <div className="ui-previewBox" aria-live="polite">
                        <MarkdownRenderer content={currentValue || '*Nothing to preview yet.*'} />
                    </div>
                ) : (
                    <textarea
                        id={textareaId}
                        ref={textareaRef}
                        name={name}
                        placeholder={placeholder}
                        value={currentValue}
                        onChange={(event) => emitChange(event.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={rows}
                        required={required}
                        className={`ui-markdownTextarea ${className}`.trim()}
                        spellCheck={true}
                        {...props}
                    />
                )}

                <div className="ui-editorMeta">
                    <span>{wordCount} words • {characterCount} characters</span>
                    {!previewMode && <span className="ui-editorHint">Shortcuts: Ctrl/Cmd+B, I, K</span>}
                </div>
            </div>
        </div>
    );
};

export default FormMarkdownEditor;
