import React, { useState, useEffect } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import styles from '../../Admin.module.scss';

/**
 * FormDropzone component for file uploads with live preview.
 */
const FormDropzone = ({
    label,
    hint,
    file,
    onFileChange,
    currentImageUrl,
    accept = "image/*",
    placeholder = 'Upload Image'
}) => {
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            return;
        }

        const url = URL.createObjectURL(file);
        setPreviewUrl(url);

        // Clean up the URL on unmount or when file changes
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const handleRemove = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onFileChange(null);
    };

    const hasImage = previewUrl || currentImageUrl;

    return (
        <div className={styles.fileInputGroup}>
            {label && (
                <label>
                    {label}
                    {hint && <span className={styles.hint}> ({hint})</span>}
                </label>
            )}
            <div className={`${styles.fileDropzone} ${hasImage ? styles.hasPreview : ''}`}>
                <input
                    type="file"
                    accept={accept}
                    onChange={(e) => onFileChange(e.target.files[0])}
                    className={styles.fileInput}
                />
                
                {hasImage ? (
                    <div className={styles.previewContainer}>
                        <img 
                            src={previewUrl || currentImageUrl} 
                            alt="Preview" 
                            className={styles.imagePreview} 
                        />
                        <div className={styles.previewOverlay}>
                            <div className={styles.previewActions}>
                                <button 
                                    className={styles.removePreviewBtn} 
                                    onClick={handleRemove}
                                    title="Remove image"
                                >
                                    <X size={18} />
                                </button>
                                <div className={styles.changeHint}>
                                    <Upload size={14} /> Click to change
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={styles.fileDropzoneContent}>
                        <div className={styles.uploadIconWrapper}>
                            <Upload size={28} />
                        </div>
                        <div className={styles.uploadText}>
                            <span className={styles.primaryText}>{placeholder}</span>
                            <span className={styles.secondaryText}>Drag and drop or click to browse</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormDropzone;
