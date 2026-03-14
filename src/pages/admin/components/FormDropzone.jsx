import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, ImageIcon, Image as ImageIcon2, FolderPlus, Trash2, Eye, XCircle, CheckCircle2, Maximize2 } from 'lucide-react';
import BaseModal from './BaseModal';
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
    onClearExisting,
    accept = "image/*",
    placeholder = 'Upload Image'
}) => {
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [internalClear, setInternalClear] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            return;
        }

        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setInternalClear(false); // Reset clear state when a new file is provided externally

        return () => URL.revokeObjectURL(url);
    }, [file]);

    // Also reset clear state if the currentImageUrl changes from outside (e.g. switching between posts)
    useEffect(() => {
        setInternalClear(false);
    }, [currentImageUrl]);

    const validateFile = (file) => {
        if (!file) return null;

        // Check file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
        if (!validTypes.includes(file.type)) {
            return "Invalid file type. Please upload an image (JPG, PNG, WebP, GIF, or SVG).";
        }

        // Check file size (1MB Firestore limit)
        const maxSize = 1 * 1024 * 1024;
        if (file.size > maxSize) {
            return "File is too large. Maximum size is 1MB to ensure database compatibility.";
        }

        return null;
    };

    const handleFileSelect = (selectedFile) => {
        const validationError = validateFile(selectedFile);
        if (validationError) {
            setError(validationError);
            setTimeout(() => setError(null), 5000);
            return;
        }
        setError(null);
        setInternalClear(false);
        onFileChange(selectedFile);
    };

    const handleRemove = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Notify parent to clear new file
        onFileChange(null);
        
        // If there was a current image, we internally clear it for immediate UI feedback
        if (currentImageUrl || previewUrl) {
            setInternalClear(true);
            if (onClearExisting) onClearExisting();
        }

        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleBrowseClick = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        fileInputRef.current?.click();
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles && droppedFiles.length > 0) {
            handleFileSelect(droppedFiles[0]);
        }
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const hasData = (previewUrl || currentImageUrl) && !internalClear;
    const isNewImage = !!previewUrl && !internalClear;

    return (
        <div className={styles.fileInputGroup}>
            {label && (
                <label className={styles.dropzoneLabel}>
                    <div className={styles.labelTitle}>
                        {label}
                        {hint && <span className={styles.hint}> ({hint})</span>}
                    </div>
                </label>
            )}

            <div className={styles.dropzoneRoot}>
                <input
                    type="file"
                    ref={fileInputRef}
                    accept={accept}
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    className={styles.hiddenInput}
                />

                {hasData ? (
                    <div 
                        className={`${styles.unifiedPreviewDropzone} ${isDragging ? styles.isDragging : ''} ${error ? styles.hasError : ''}`}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={handleBrowseClick}
                    >
                        <div className={styles.premiumImageCard}>
                            <img 
                                src={previewUrl || currentImageUrl} 
                                alt="Current" 
                                className={styles.unifiedPreviewImg} 
                            />
                            
                            {/* Floating Control Pill */}
                            <div 
                                className={styles.unifiedControlPill}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button 
                                    type="button"
                                    className={styles.pillActionBtn}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsPreviewModalOpen(true);
                                    }}
                                    title="Preview Image"
                                >
                                    <Maximize2 size={18} />
                                    <span>Preview</span>
                                </button>
                                
                                <div className={styles.pillDivider} />
                                
                                <button 
                                    type="button"
                                    className={styles.pillActionBtn}
                                    onClick={handleBrowseClick}
                                    title="Change Image"
                                >
                                    <FolderPlus size={18} />
                                    <span>Change</span>
                                </button>
                                
                                <div className={styles.pillDivider} />
                                
                                <button 
                                    type="button"
                                    className={`${styles.pillActionBtn} ${styles.danger}`}
                                    onClick={handleRemove}
                                    title="Clear Image"
                                >
                                    <Trash2 size={18} />
                                    <span>Clear</span>
                                </button>
                            </div>

                            {/* Dynamic Status Badge */}
                            <div className={`${styles.topBadge} ${isNewImage ? styles.newBadge : ''}`}>
                                {isNewImage ? (
                                    <>
                                        <CheckCircle2 size={12} /> Ready to Upload
                                        {file && <span className={styles.fileMetric}>({formatSize(file.size)})</span>}
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon size={12} /> Currently Published
                                    </>
                                )}
                            </div>

                            {/* Hover Help Info */}
                            <div className={styles.hoverHelp}>
                                <Upload size={14} /> Click or Drop to Change
                            </div>

                            {/* Drop Overlay (only visible on drag) */}
                            {isDragging && (
                                <div className={styles.dropOverlay}>
                                    <Upload size={32} />
                                    <span>Drop to Replace</span>
                                </div>
                            )}
                        </div>
                        {error && (
                            <div className={styles.validationErrorUnified}>
                                <XCircle size={14} /> {error}
                            </div>
                        )}
                    </div>
                ) : (
                    <div 
                        className={`${styles.fullDropzone} ${isDragging ? styles.isDragging : ''} ${error ? styles.hasError : ''}`}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={handleBrowseClick}
                    >
                        <div className={styles.fullDropzoneContent}>
                            <div className={styles.uploadIconCircle}>
                                <Upload size={32} />
                            </div>
                            <div className={styles.fullUploadText}>
                                <span className={styles.main}>{placeholder}</span>
                                <span className={styles.sub}>Drag and drop your image here, or click to browse</span>
                                <span className={styles.uploadRequirements}>
                                    Max 1MB • Recommended: 1920x720 (16:6)
                                </span>
                            </div>
                        </div>
                        {error && (
                            <div className={styles.validationErrorFull}>
                                <XCircle size={16} /> {error}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Integrated Preview Modal */}
            <BaseModal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                headerContent={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <ImageIcon2 size={20} className={styles.primaryText} />
                        <span>Image Preview</span>
                    </div>
                }
                maxWidth="1000px"
                bodyStyle={{ padding: 0, background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}
            >
                <img 
                    src={previewUrl || currentImageUrl} 
                    alt="Preview" 
                    className={styles.modalPreviewImg} 
                />
            </BaseModal>
        </div>
    );
};

export default FormDropzone;
