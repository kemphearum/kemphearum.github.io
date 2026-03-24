import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List } from 'lucide-react';
import styles from './TableOfContents.module.scss';

const TableOfContents = ({ content }) => {
    const [headings, setHeadings] = useState([]);
    const [activeId, setActiveId] = useState('');

    useEffect(() => {
        if (!content) {
            setHeadings([]);
            return;
        }
        // Simple regex to extract H2 and H3 headings from markdown
        const headingRegex = /^##\s+(.*)$|^###\s+(.*)$/gm;
        const matches = [];
        let match;

        while ((match = headingRegex.exec(content)) !== null) {
            const level = match[1] ? 2 : 3;
            const text = match[1] || match[2];
            // rehype-slug format: lowercase, replace spaces with dashes, remove special chars
            const id = text.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]/g, '');
            
            matches.push({ id, text, level });
        }

        setHeadings(matches);
    }, [content]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visibleEntry = entries.find((entry) => entry.isIntersecting);
                if (visibleEntry) {
                    setActiveId(visibleEntry.target.id);
                }
            },
            { rootMargin: '-10% 0px -70% 0px' }
        );

        headings.forEach((heading) => {
            const element = document.getElementById(heading.id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [headings]);

    const scrollToHeading = (id) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 100; // Account for fixed header
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            setActiveId(id);
        }
    };

    if (headings.length === 0) return null;

    return (
        <div className={styles.tocWrapper}>
            <div className={styles.tocHeader}>
                <List size={16} />
                <span>On This Page</span>
            </div>
            <nav className={styles.tocNav}>
                <ul className={styles.tocList}>
                    {headings.map((heading) => (
                        <li 
                            key={heading.id} 
                            className={`${styles.tocItem} ${styles[`level${heading.level}`]} ${activeId === heading.id ? styles.active : ''}`}
                        >
                            <button onClick={() => scrollToHeading(heading.id)}>
                                {heading.text}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
};

export default TableOfContents;
