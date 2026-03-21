import React, { useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Eye, Edit3 } from 'lucide-react';

/**
 * FormMarkdownEditor Component
 * A simple markdown editor with live preview integrated with react-hook-form.
 * 
 * @param {string} name - The field name for react-hook-form
 * @param {string} placeholder - Placeholder text
 */
const FormMarkdownEditor = ({ name, placeholder = "Write your content here..." }) => {
  const { control } = useFormContext();
  const [view, setView] = useState('edit'); // 'edit' or 'preview'

  return (
    <div className="ui-markdown-editor">
      <div className="ui-markdown-toolbar">
        <button 
          type="button" 
          className={view === 'edit' ? 'ui-markdown-toolbar-button--active' : ''}
          onClick={() => setView('edit')}
        >
          <Edit3 size={14} style={{ marginRight: '4px' }} />
          Edit
        </button>
        <button 
          type="button" 
          className={view === 'preview' ? 'ui-markdown-toolbar-button--active' : ''}
          onClick={() => setView('preview')}
        >
          <Eye size={14} style={{ marginRight: '4px' }} />
          Preview
        </button>
      </div>

      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          view === 'edit' ? (
            <textarea
              {...field}
              className="ui-markdown-textarea"
              placeholder={placeholder}
            />
          ) : (
            <div className="ui-markdown-preview">
              {/* Very basic preview logic for demonstration - in production, use a library like react-markdown */}
              {field.value ? (
                field.value.split('\n').map((line, i) => (
                  <p key={i}>{line || '\u00A0'}</p>
                ))
              ) : (
                <p style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Nothing to preview</p>
              )}
            </div>
          )
        )}
      />
    </div>
  );
};

export default FormMarkdownEditor;
