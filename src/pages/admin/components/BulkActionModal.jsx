import React, { useState, useEffect } from 'react';
import { Check, AlertCircle, Download, Upload, FileText, Database, ExternalLink } from 'lucide-react';
import BaseModal from './BaseModal';
import styles from '../../Admin.module.scss';

const BulkActionModal = ({
    isOpen,
    onClose,
    type = 'projects', // 'projects' or 'blog'
    data = [], // Preview data
    mode = 'import', // 'import' or 'export' (for preview view)
    onConfirm,
    overwriteExisting = true,
    setOverwriteExisting,
    loading = false,
    progress = 0 // 0 to 100
}) => {
    // No longer needs local 'view' state as it opens directly to preview
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [previewData, setPreviewData] = useState([]);

    const isBlog = type === 'blog';

    // Auto-select everything on load
    useEffect(() => {
        if (isOpen && data && data.length > 0) {
            setSelectedItems(new Set(data.map((_, i) => i)));
            setPreviewData(data);
        } else if (isOpen) {
            setSelectedItems(new Set());
            setPreviewData([]);
        }
    }, [isOpen, data]);

    const handleToggleSelect = (index) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedItems(newSelected);
    };

    const handleToggleAll = () => {
        if (selectedItems.size === previewData.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(previewData.map((_, i) => i)));
        }
    };

    const handleConfirm = () => {
        const selected = previewData.filter((_, i) => selectedItems.has(i));
        onConfirm(selected);
    };

    const headerContent = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', width: '100%' }}>
            <div className={styles.cardIcon} style={{ width: '36px', height: '36px', background: 'rgba(var(--primary-rgb), 0.1)' }}>
                {mode === 'import' ? <Upload size={18} /> : <ExternalLink size={18} />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                    {mode === 'import' ? 'Preview Import' : 'Export'}: {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
                    Review and select items to proceed
                </span>
            </div>
        </div>
    );

    const footerContent = (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            {mode === 'import' ? (
                <label className={styles.overwriteToggle} style={{ margin: 0, padding: '0.5rem 1rem', border: 'none', background: 'var(--tile-bg, rgba(255,255,255,0.03))' }}>
                    <input
                        type="checkbox"
                        checked={overwriteExisting}
                        onChange={(e) => setOverwriteExisting(e.target.checked)}
                    />
                    <div className={styles.toggleText}>
                        <span className={styles.label} style={{ fontSize: '0.85rem' }}>Overwrite existing</span>
                    </div>
                </label>
            ) : <div />}

            <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button onClick={onClose} className={styles.cancelBtn} disabled={loading}>
                    Cancel
                </button>
                <button
                    onClick={handleConfirm}
                    className={styles.primaryBtn}
                    disabled={loading || selectedItems.size === 0}
                >
                    {loading ? (
                        <span className={styles.btnLoading}><span className={styles.spinner} /> Processing...</span>
                    ) : (
                        <>
                            {mode === 'import' ? <Check size={18} /> : <Download size={18} />}
                            {mode === 'import' ? 'Start Import' : `Export Selected (${selectedItems.size})`}
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            footerContent={footerContent}
            maxWidth="950px"
            bodyStyle={{ overflow: 'hidden' }}
        >
            <div className={styles.bulkModalBody}>
                <div className={styles.previewInfo}>
                    <div className={styles.infoBadge}>
                        <AlertCircle size={16} />
                        <span>
                            {mode === 'import'
                                ? (overwriteExisting ? "Duplicates will be UPDATED with the new data." : "Duplicates will be SKIPPED.")
                                : "Select the specific items you want to download as JSON."
                            }
                        </span>
                    </div>
                </div>

                {loading && mode === 'import' && (
                    <div className={styles.importProgressContainer} style={{ marginBottom: '1.25rem', marginTop: 0 }}>
                        <div className={styles.importProgressInfo}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <span style={{ fontWeight: '700', color: 'var(--primary-color)' }}>
                                    {progress < 100 ? 'Importing items...' : 'Finalizing...'}
                                </span>
                                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                    Processed {Math.round((progress / 100) * data.length)} of {data.length} items
                                </span>
                            </div>
                            <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>{Math.round(progress)}%</span>
                        </div>
                        <div className={styles.importProgressBarWrapper}>
                            <div
                                className={styles.importProgressBar}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className={styles.tableWrapper} style={{ maxHeight: '60vh', minHeight: '200px' }}>
                    <table className={styles.previewTable}>
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.size === previewData.length && previewData.length > 0}
                                        onChange={handleToggleAll}
                                    />
                                </th>
                                <th style={{ width: '140px' }}>Status</th>
                                <th>Content Details</th>
                                {mode === 'import' && <th>Data Preview</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {previewData.map((item, index) => (
                                <tr key={index} onClick={() => handleToggleSelect(index)}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.has(index)}
                                            onChange={() => { }} // Row click handles it
                                        />
                                    </td>
                                    <td>
                                        {mode === 'import' ? (
                                            item.fileDuplicate ? (
                                                <span className={`${styles.statusBadge} ${styles.duplicate}`}>
                                                    <AlertCircle size={12} /> File Duplicate
                                                </span>
                                            ) : item.exists ? (
                                                <span className={`${styles.statusBadge} ${styles.update}`}>
                                                    <Database size={12} /> Update
                                                </span>
                                            ) : (
                                                <span className={`${styles.statusBadge} ${styles.new}`}>
                                                    <Database size={12} /> New
                                                </span>
                                            )
                                        ) : (
                                            <span className={`${styles.statusBadge} ${item.visible ? styles.new : styles.update}`}>
                                                {item.visible ? 'Published' : 'Draft'}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <div className={styles.itemTitle}>{item.title}</div>
                                        <div className={styles.itemSlug}>{item.slug}</div>
                                    </td>
                                    {mode === 'import' && (
                                        <td>
                                            <div style={{
                                                maxWidth: '240px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                fontSize: '0.75rem',
                                                opacity: 0.7
                                            }}>
                                                {type === 'blog' ? (item.excerpt || item.content?.substring(0, 60)) : item.description}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ marginTop: '1.25rem', padding: '0 0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-color)' }} />
                            <span><strong>{selectedItems.size}</strong> items selected for {mode === 'import' ? 'import' : 'export'}</span>
                        </div>
                    </div>

                </div>
            </div>
        </BaseModal>
    );
};

export default BulkActionModal;
