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
    footerStyle = {},
    smallHeader = false
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
                    ...contentStyle
                }}
            >
                {headerContent && (
                    <div
                        className={`${styles.modalHeader} ${smallHeader ? styles.smallHeader : ''}`}
                        style={headerStyle}
                    >
                        <div className={styles.modalTitle}>
                            {headerContent}
                        </div>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className={styles.closeBtn}
                                aria-label="Close modal"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                )}

                <div
                    className={styles.modalBody}
                    style={bodyStyle}
                >
                    {children}
                </div>

                {footerContent && (
                    <div
                        className={styles.modalFooter}
                        style={{
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
