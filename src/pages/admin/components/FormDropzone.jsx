import React from 'react';
import { Upload } from 'lucide-react';
import styles from '../../Admin.module.scss';

/**
 * FormDropzone component for file uploads.
 */
const FormDropzone = ({
    label,
    hint,
    file,
    onFileChange,
    accept = "image/*",
    placeholder = 'Upload Image'
}) => {
    return (
        <div className={styles.fileInputGroup}>
            {label && (
                <label>
                    {label}
                    {hint && <span className={styles.hint}> ({hint})</span>}
                </label>
            )}
            <div className={styles.fileDropzone}>
                <input
                    type="file"
                    accept={accept}
                    onChange={(e) => onFileChange(e.target.files[0])}
                />
                <div className={styles.fileDropzoneContent}>
                    <Upload size={24} />
                    <span>{file ? file.name : placeholder}</span>
                </div>
            </div>
        </div>
    );
};

export default FormDropzone;
