import React, { useId, useRef, useState } from 'react';
import { Bold, Italic, Link as LinkIcon, Code, Eye, Edit2 } from 'lucide-react';
import MarkdownRenderer from '@/sections/MarkdownRenderer';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from '../../../hooks/useTranslation';

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
    placeholder,
    required = false,
    fullWidth = true,
    className = '',
    ...props
}) => {
    const { language } = useTranslation();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
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
                insertion = `**${selectedText || tr('bold text', 'អត្ថបទដិត')}**`;
                selectionStartOffset = 2;
                selectionEndOffset = insertion.length - 2;
                break;
            case 'italic':
                insertion = `*${selectedText || tr('italic text', 'អត្ថបទទ្រេត')}*`;
                selectionStartOffset = 1;
                selectionEndOffset = insertion.length - 1;
                break;
            case 'link':
                insertion = `[${selectedText || tr('Link text', 'អត្ថបទតំណ')}](https://example.com)`;
                if (hasSelection) {
                    selectionStartOffset = 1;
                    selectionEndOffset = 1 + selectedText.length;
                } else {
                    const urlStart = insertion.indexOf('https://example.com');
                    selectionStartOffset = urlStart;
                    selectionEndOffset = urlStart + 'https://example.com'.length;
                }
                break;
            case 'code': {
                const codePlaceholder = selectedText || tr('code here', 'កូដនៅទីនេះ');
                insertion = `\n\`\`\`\n${codePlaceholder}\n\`\`\`\n`;
                selectionStartOffset = insertion.indexOf(codePlaceholder);
                selectionEndOffset = selectionStartOffset + codePlaceholder.length;
                break;
            }
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
                            <div className="ui-formatGroup" role="toolbar" aria-label={tr('Markdown formatting controls', 'ការគ្រប់គ្រងទ្រង់ទ្រាយ Markdown')}>
                                <button
                                    type="button"
                                    className="ui-markdownAction"
                                    onClick={() => insertMarkdown('bold')}
                                    title={tr('Bold (Ctrl/Cmd+B)', 'ដិត (Ctrl/Cmd+B)')}
                                    aria-label={tr('Bold', 'ដិត')}
                                >
                                    <Bold size={16} />
                                </button>
                                <button
                                    type="button"
                                    className="ui-markdownAction"
                                    onClick={() => insertMarkdown('italic')}
                                    title={tr('Italic (Ctrl/Cmd+I)', 'ទ្រេត (Ctrl/Cmd+I)')}
                                    aria-label={tr('Italic', 'ទ្រេត')}
                                >
                                    <Italic size={16} />
                                </button>
                                <button
                                    type="button"
                                    className="ui-markdownAction"
                                    onClick={() => insertMarkdown('link')}
                                    title={tr('Link (Ctrl/Cmd+K)', 'តំណ (Ctrl/Cmd+K)')}
                                    aria-label={tr('Link', 'តំណ')}
                                >
                                    <LinkIcon size={16} />
                                </button>
                                <button
                                    type="button"
                                    className="ui-markdownAction"
                                    onClick={() => insertMarkdown('code')}
                                    title={tr('Code block', 'ប្លុកកូដ')}
                                    aria-label={tr('Code block', 'ប្លុកកូដ')}
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
                            aria-label={previewMode ? tr('Switch to edit mode', 'ប្ដូរទៅរបៀបកែសម្រួល') : tr('Switch to preview mode', 'ប្ដូរទៅរបៀបមើលជាមុន')}
                        >
                            {previewMode
                                ? <><Edit2 size={14} /> {tr('Edit', 'កែសម្រួល')}</>
                                : <><Eye size={14} /> {tr('Preview', 'មើលជាមុន')}</>}
                        </button>
                    </div>
                </div>

                {previewMode ? (
                    <div className="ui-previewBox" aria-live="polite">
                        <MarkdownRenderer content={currentValue || tr('*Nothing to preview yet.*', '*មិនទាន់មានអ្វីសម្រាប់មើលជាមុន។*')} />
                    </div>
                ) : (
                    <textarea
                        id={textareaId}
                        ref={textareaRef}
                        name={name}
                        placeholder={placeholder || tr('Write in Markdown...', 'សរសេរជា Markdown...')}
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
                    <span>{wordCount} {tr('words', 'ពាក្យ')} - {characterCount} {tr('characters', 'តួអក្សរ')}</span>
                    {!previewMode && <span className="ui-editorHint">{tr('Shortcuts: Ctrl/Cmd+B, I, K', 'ផ្លូវកាត់: Ctrl/Cmd+B, I, K')}</span>}
                </div>
            </div>
        </div>
    );
};

export default FormMarkdownEditor;
