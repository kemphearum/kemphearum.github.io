import React from 'react';
 
import { motion } from 'framer-motion';
import styles from './SectionHeader.module.scss';

/**
 * Standard public-section header: optional eyebrow, an animated title, and an
 * optional subtitle. Centralizes the repeated `motion.h2 + subtitle` pattern
 * across public sections so spacing and motion stay consistent.
 */
const SectionHeader = ({ eyebrow, title, subtitle, align = 'center', id }) => (
    <header className={`${styles.header} ${styles[`align--${align}`] || ''}`}>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <motion.h2
            id={id}
            className={`section-title ${styles.title}`}
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
        >
            {title}
        </motion.h2>
        {subtitle && (
            <motion.p
                className={styles.subtitle}
                initial={{ opacity: 0, y: -10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.08 }}
            >
                {subtitle}
            </motion.p>
        )}
    </header>
);

export default SectionHeader;
