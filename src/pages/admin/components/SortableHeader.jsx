import React from 'react';
import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';

// Reusable SortableHeader component
const SortableHeader = ({ label, field, sortField, sortDirection, onSort, style }) => (
    <div
        onClick={() => onSort(field)}
        style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', transition: 'color 0.2s ease', ...style }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-color)'}
        onMouseLeave={e => e.currentTarget.style.color = ''}
    >
        {label}
        {sortField === field
            ? (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)
            : <ArrowUpDown size={14} style={{ opacity: 0.3 }} />}
    </div>
);

export default SortableHeader;
