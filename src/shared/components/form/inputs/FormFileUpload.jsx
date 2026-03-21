import React, { useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

/**
 * FormFileUpload Component
 * A reusable file upload component integrated with react-hook-form.
 * 
 * @param {string} name - The field name for react-hook-form
 * @param {string} accept - Accepted file types (e.g., "image/*")
 */
const FormFileUpload = ({ name, accept = "image/*" }) => {
  const { setValue, watch, register } = useFormContext();
  const fileInputRef = useRef(null);
  
  // Watch the current value (could be a File object or a URL string)
  const currentValue = watch(name);
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setValue(name, file, { shouldValidate: true, shouldDirty: true });
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setValue(name, null, { shouldValidate: true, shouldDirty: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Determine preview URL
  let previewUrl = null;
  if (currentValue) {
    if (typeof currentValue === 'string') {
      previewUrl = currentValue;
    } else if (currentValue instanceof File) {
      previewUrl = URL.createObjectURL(currentValue);
    }
  }

  return (
    <div className="ui-upload">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        style={{ display: 'none' }}
      />
      
      {!previewUrl ? (
        <div className="ui-upload-dropzone" onClick={handleClick}>
          <Upload className="ui-icon" size={24} />
          <span>Click or drag to upload image</span>
        </div>
      ) : (
        <div className="ui-upload-preview">
          <img src={previewUrl} alt="Preview" />
          <div className="ui-upload-preview-overlay">
            <button 
              type="button" 
              className="ui-upload-preview-remove"
              onClick={handleRemove}
              title="Remove image"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormFileUpload;
