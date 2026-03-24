import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, ImageIcon, Image as ImageIcon2, FolderPlus, Trash2, Eye, XCircle, CheckCircle2, Maximize2 } from 'lucide-react';
import { Dialog } from '@/shared/components/ui';
import { useTranslation } from '../../../hooks/useTranslation';

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
    placeholder = '',
    circular = false,
    aspectRatio = "16 / 6"
}) => {
    const { language } = useTranslation();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
    const dropzonePlaceholder = placeholder || tr('Upload Image', 'ផ្ទុករូបភាព');
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
            return tr('Invalid file type. Please upload an image (JPG, PNG, WebP, GIF, or SVG).', 'ប្រភេទឯកសារមិនត្រឹមត្រូវ។ សូមផ្ទុករូបភាព (JPG, PNG, WebP, GIF ឬ SVG)។');
        }

        // Check file size (1MB Firestore limit)
        const maxSize = 1 * 1024 * 1024;
        if (file.size > maxSize) {
            return tr('File is too large. Maximum size is 1MB to ensure database compatibility.', 'ឯកសារធំពេក។ ទំហំអតិបរមា 1MB ដើម្បីឱ្យសមស្របជាមួយមូលដ្ឋានទិន្នន័យ។');
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
        <div className="ui-fileInputGroup">
            <div className="ui-dropzoneRoot">
                <input
                    type="file"
                    ref={fileInputRef}
                    accept={accept}
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    className="ui-hiddenInput"
                />

                {hasData ? (
                    <div 
                        className={`ui-unifiedPreviewDropzone ${isDragging ? 'ui-isDragging' : ''} ${error ? 'ui-hasError' : ''}`}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={handleBrowseClick}
                        style={circular ? { width: '200px', height: '200px', margin: '0 auto', aspectRatio: '1/1' } : { aspectRatio }}
                    >
                        <div className="ui-premiumImageCard" style={circular ? { borderRadius: '50%', height: '100%', overflow: 'visible' } : {}}>
                            <img 
                                src={previewUrl || currentImageUrl} 
                                alt={tr('Current image', 'រូបភាពបច្ចុប្បន្ន')}
                                className="ui-unifiedPreviewImg" 
                                style={circular ? { borderRadius: '50%' } : {}}
                            />
                            
                            {/* Floating Control Pill */}
                            <div 
                                className={`ui-unifiedControlPill ${circular ? 'ui-circularPill' : ''}`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button 
                                    type="button"
                                    className="ui-pillActionBtn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsPreviewModalOpen(true);
                                    }}
                                    title={tr('Preview Image', 'មើលរូបភាពជាមុន')}
                                >
                                    <Maximize2 size={18} />
                                    {!circular && <span>{tr('Preview', 'មើលជាមុន')}</span>}
                                </button>
                                
                                <div className="ui-pillDivider" />
                                
                                <button 
                                    type="button"
                                    className="ui-pillActionBtn"
                                    onClick={handleBrowseClick}
                                    title={tr('Change Image', 'ប្តូររូបភាព')}
                                >
                                    <FolderPlus size={18} />
                                    {!circular && <span>{tr('Change', 'ប្តូរ')}</span>}
                                </button>
                                
                                {onClearExisting && (
                                    <>
                                        <div className="ui-pillDivider" />
                                        <button 
                                            type="button"
                                            className="ui-pillActionBtn ui-danger"
                                            onClick={handleRemove}
                                            title={tr('Clear Image', 'សម្អាតរូបភាព')}
                                        >
                                            <Trash2 size={18} />
                                            {!circular && <span>{tr('Clear', 'សម្អាត')}</span>}
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Dynamic Status Badge */}
                            <div className={`ui-topBadge ${isNewImage ? 'ui-newBadge' : ''} ${circular ? 'ui-circularBadge' : ''}`}>
                                {isNewImage ? (
                                    <>
                                        <CheckCircle2 size={12} /> {circular ? tr('Ready', 'រួចរាល់') : tr('Ready to Upload', 'រួចរាល់សម្រាប់ផ្ទុក')}
                                        {file && <span className="ui-fileMetric">({formatSize(file.size)})</span>}
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon size={12} /> {circular ? tr('Active', 'កំពុងប្រើ') : tr('Currently Published', 'កំពុងប្រើបច្ចុប្បន្ន')}
                                    </>
                                )}
                            </div>

                            {/* Hover Help Info */}
                            <div className="ui-hoverHelp">
                                <Upload size={14} /> {tr('Click or Drop to Change', 'ចុច ឬទម្លាក់ដើម្បីប្តូរ')}
                            </div>

                            {/* Drop Overlay (only visible on drag) */}
                            {isDragging && (
                                <div className="ui-dropOverlay">
                                    <Upload size={32} />
                                    <span>{tr('Drop to Replace', 'ទម្លាក់ដើម្បីជំនួស')}</span>
                                </div>
                            )}
                        </div>
                        {error && (
                            <div className="ui-validationErrorUnified">
                                <XCircle size={14} /> {error}
                            </div>
                        )}
                    </div>
                ) : (
                    <div 
                        className={`ui-fullDropzone ${isDragging ? 'ui-isDragging' : ''} ${error ? 'ui-hasError' : ''}`}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={handleBrowseClick}
                        style={circular ? { width: '200px', height: '200px', margin: '0 auto', borderRadius: '50%' } : { aspectRatio }}
                    >
                        <div className="ui-fullDropzoneContent">
                            <div className="ui-uploadIconCircle">
                                <Upload size={circular ? 24 : 32} />
                            </div>
                            <div className="ui-fullUploadText">
                                <span className="ui-main" style={circular ? { fontSize: '0.9rem' } : {}}>{dropzonePlaceholder}</span>
                                {!circular && <span className="ui-sub">{tr('Drag and drop your image here, or click to browse', 'អូសទម្លាក់រូបភាពនៅទីនេះ ឬចុចដើម្បីរកមើល')}</span>}
                                <span className="ui-uploadRequirements" style={circular ? { fontSize: '0.7rem' } : {}}>
                                    {circular ? tr('Max 1MB', 'អតិបរមា 1MB') : tr('Max 1MB • Recommended: 1920x720 (16:6)', 'អតិបរមា 1MB • ណែនាំ៖ 1920x720 (16:6)')}
                                </span>
                            </div>
                        </div>
                        {error && (
                            <div className="ui-validationErrorFull">
                                <XCircle size={16} /> {error}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Integrated Preview Modal */}
            <Dialog open={isPreviewModalOpen} onOpenChange={(open) => !open && setIsPreviewModalOpen(false)}>
                <Dialog.Content maxWidth="1000px" style={{ padding: 0, background: '#000' }}>
                    <Dialog.Header>
                        <Dialog.Title style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <ImageIcon2 size={20} className="ui-primaryText" />
                            <span>{tr('Image Preview', 'មើលរូបភាពជាមុន')}</span>
                        </Dialog.Title>
                    </Dialog.Header>
                    
                    <Dialog.Body style={{ padding: 0, background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                        <img 
                            src={previewUrl || currentImageUrl} 
                            alt={tr('Preview image', 'រូបភាពមើលជាមុន')}
                            style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} 
                        />
                    </Dialog.Body>
                </Dialog.Content>
            </Dialog>
        </div>
    );
};

export default FormDropzone;
