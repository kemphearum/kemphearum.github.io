import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Reusable Pagination component
const Pagination = ({ currentPage, totalPages, onPageChange, perPage, onPerPageChange, totalItems }) => {
    if (totalItems === 0) return null;
    const perPageOptions = [5, 10, 25, 50];
    const start = (currentPage - 1) * perPage + 1;
    const end = Math.min(currentPage * perPage, totalItems);

    return (
        <div className="ui-paginationWrapper">
            <div className="ui-paginationLeft">
                <span className="ui-pageInfo">
                    {start}–{end} of {totalItems}
                </span>
                <div className="ui-perPageControl">
                    <span className="ui-perPageLabel">Show</span>
                    <select
                        className="ui-perPageSelect"
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
                <div className="ui-pagination">
                    <button className="ui-pageBtn ui-pageBtn--prev" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                        <ChevronLeft size={16} /> Prev
                    </button>
                    <span className="ui-pageInfo">Page {currentPage} of {totalPages}</span>
                    <button className="ui-pageBtn ui-pageBtn--next" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Pagination;
