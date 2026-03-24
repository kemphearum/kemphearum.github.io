import React, { useState, useEffect } from 'react';
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

        const seenIds = new Map();
        const matches = content
            .split(/\r?\n/)
            .reduce((acc, line, index) => {
                const headingMatch = line.match(/^(##|###)\s+(.+?)\s*#*\s*$/);
                if (!headingMatch) return acc;

                const level = headingMatch[1].length;
                const text = headingMatch[2].trim();
                if (!text) return acc;

                let baseId = text
                    .normalize('NFKD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .toLowerCase()
                    .replace(/[^\p{L}\p{N}\s-]/gu, '')
                    .trim()
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-');

                if (!baseId) {
                    baseId = `section-${level}-${index}`;
                }

                const count = seenIds.get(baseId) || 0;
                seenIds.set(baseId, count + 1);
                const id = count === 0 ? baseId : `${baseId}-${count}`;

                acc.push({ id, text, level });
                return acc;
            }, []);

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
            const offsetPosition = element.getBoundingClientRect().top + window.scrollY - offset;

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
