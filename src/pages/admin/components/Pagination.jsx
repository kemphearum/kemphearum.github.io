import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from '../../Admin.module.scss';

// Reusable Pagination component
const Pagination = ({ currentPage, totalPages, onPageChange, perPage, onPerPageChange, totalItems }) => {
    if (totalItems === 0) return null;
    const perPageOptions = [5, 10, 25];
    const start = (currentPage - 1) * perPage + 1;
    const end = Math.min(currentPage * perPage, totalItems);

    return (
        <div className={styles.paginationWrapper}>
            <div className={styles.paginationLeft}>
                <span className={styles.pageInfo}>
                    {start}–{end} of {totalItems}
                </span>
                <div className={styles.perPageControl}>
                    <span className={styles.perPageLabel}>Show</span>
                    <select
                        className={styles.perPageSelect}
                        value={perPage}
                        onChange={(e) => onPerPageChange(Number(e.target.value))}
                    >
                        {perPageOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
            </div>
            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button className={styles.pageBtn} onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                        <ChevronLeft size={16} /> Prev
                    </button>
                    <span className={styles.pageInfo}>Page {currentPage} of {totalPages}</span>
                    <button className={styles.pageBtn} onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Pagination;
