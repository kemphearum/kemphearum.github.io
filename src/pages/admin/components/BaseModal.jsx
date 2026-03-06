import React from 'react';
import { X } from 'lucide-react';
import styles from '../../Admin.module.scss';

const BaseModal = ({
    isOpen,
    onClose,
    headerContent,
    footerContent,
    children,
    maxWidth = '800px',
    maxHeight = '90vh',
    zIndex = 1000,
    headerStyle = {},
    contentStyle = {},
    bodyStyle = {},
    footerStyle = {}
}) => {
    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose} style={{ zIndex }}>
            <div
                className={styles.modalContent}
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth,
                    maxHeight,
                    width: '90%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '16px',
                    background: 'var(--bg-surface)',
                    padding: 0,
                    ...contentStyle
                }}
            >
                {headerContent && (
                    <div
                        className={styles.modalHeader}
                        style={{
                            flexShrink: 0,
                            padding: '1.25rem 1.5rem',
                            background: 'rgba(10, 10, 18, 0.2)',
                            borderBottom: '1px solid var(--divider)',
                            position: 'relative',
                            ...headerStyle
                        }}
                    >
                        {headerContent}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className={styles.closeBtn}
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    right: '1.5rem',
                                    transform: 'translateY(-50%)',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                )}

                <div
                    className={styles.modalBody}
                    style={{
                        padding: '1.5rem',
                        overflowY: 'auto',
                        flexGrow: 1,
                        ...bodyStyle
                    }}
                >
                    {children}
                </div>

                {footerContent && (
                    <div
                        className={styles.modalFooter}
                        style={{
                            flexShrink: 0,
                            padding: '1rem 1.5rem',
                            background: 'var(--bg-surface)',
                            borderTop: '1px solid var(--divider)',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '0.75rem',
                            ...footerStyle
                        }}
                    >
                        {footerContent}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BaseModal;
