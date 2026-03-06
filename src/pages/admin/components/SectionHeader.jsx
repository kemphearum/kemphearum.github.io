import React from 'react';
import styles from '../../Admin.module.scss';

const SectionHeader = ({
    title,
    description,
    icon: Icon,
    rightElement,
    style
}) => {
    return (
        <div className={styles.sectionHeader} style={style}>
            <div className={styles.headerInfo}>
                {Icon && (
                    <div className={styles.headerIcon}>
                        <Icon size={24} />
                    </div>
                )}
                <div>
                    <h2 className={styles.headerTitle}>{title}</h2>
                    {description && <p className={styles.headerDescription}>{description}</p>}
                </div>
            </div>
            {rightElement && (
                <div className={styles.headerActions}>
                    {rightElement}
                </div>
            )}
        </div>
    );
};

export default SectionHeader;
