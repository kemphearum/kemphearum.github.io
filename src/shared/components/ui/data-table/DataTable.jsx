import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import EmptyState from '../empty-state/EmptyState';
import Spinner from '../spinner/Spinner';

/**
 * DataTable Component (Final Premium Version)
 * A generic, presentational table component with pagination, sorting, and enhanced UX.
 * Strictly follows the .ui-* global styling architecture.
 */
const DataTable = ({ 
  data = [], 
  columns = [], 
  keyField = 'id', 
  className = '', 
  rowClassName,
  // Pagination (Controlled)
  pageSize = 10,
  page = 1,
  onPageChange,
  // Cursor Pagination Props
  hasMore = false,
  isFirstPage = true,
  onNext,
  onPrevious,
  // Selection (For Bulk Actions)
  selection = null, // { selectedIds: [], onSelect: (id) => {}, onSelectAll: () => {} }
  // Interactions
  onRowClick,
  loading = false,
  // Empty State override
  emptyState = null, // { icon, title, description, action }
  // Sorting (Internal)
  initialSort = { key: null, direction: 'none' },
  // Server-side pagination support
  totalItems: totalItemsProp = null,
  manualPagination = false,
  paginationVariant = 'numbers' // 'numbers', 'simple', or 'cursor'
}) => {
  const [sortConfig, setSortConfig] = useState(initialSort);

  // 1. Pagination Mode Detection
  // Strictly isolate modes: Cursor (Remote) vs Page (Local/Manual)
  const isCursorMode = !!onNext || !!onPrevious || paginationVariant === 'cursor';

  // 2. Sorting Logic
  const sortedData = useMemo(() => {
    if (!sortConfig.key || sortConfig.direction === 'none') {
      return data;
    }

    const sortableData = [...data];
    sortableData.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;
      
      // Handle different types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue > bValue ? 1 : -1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return sortableData;
  }, [data, sortConfig]);

  // 3. Pagination & Data Slicing Logic
  const totalItems = totalItemsProp !== null ? totalItemsProp : sortedData.length;
  const totalPages = isCursorMode ? 0 : Math.ceil(totalItems / pageSize);
  
  const paginatedData = useMemo(() => {
    // In Cursor mode, we NEVER slice data internally. The server handles it.
    // Also if manualPagination is true (page-based remote), we don't slice.
    if (isCursorMode || manualPagination) return sortedData;

    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize, isCursorMode, manualPagination]);

  // 4. Selection Helpers
  const isAllSelected = useMemo(() => {
    if (!selection || paginatedData.length === 0) return false;
    return paginatedData.every(item => selection.selectedIds.includes(item[keyField]));
  }, [selection, paginatedData, keyField]);

  // 5. Handlers
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'none';
      key = null;
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (col) => {
    if (!col.sortable) return null;
    const isActive = sortConfig.key === col.key;
    const Icon = !isActive ? ArrowUpDown : (sortConfig.direction === 'asc' ? ArrowUp : ArrowDown);
    
    return (
      <span className={`ui-table-sortIcon ${isActive ? 'ui-table-sortIcon--active' : ''}`}>
        <Icon size={14} />
      </span>
    );
  };

  return (
    <div className={`ui-table-container ${className}`}>
      {/* Loading Overlay - Unified UI */}
      {loading && (
        <div className="ui-table-loading-overlay">
          <Spinner size="md" />
        </div>
      )}

      <table className="ui-table">
        <thead>
          <tr>
            {selection && (
              <th className="ui-table-selection-header" style={{ width: '40px' }}>
                <input 
                  type="checkbox" 
                  checked={isAllSelected}
                  onChange={selection.onSelectAll}
                  className="ui-checkbox"
                />
              </th>
            )}
            {columns.map((col, idx) => (
              <th 
                key={col.key || idx} 
                className={`${col.className || ''} ${col.sortable ? 'ui-table-sortable' : ''}`}
                onClick={() => col.sortable && handleSort(col.key)}
                style={col.width ? { width: col.width } : {}}
              >
                <div className="ui-table-header-content">
                  {col.header}
                  {getSortIcon(col)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(paginatedData.length === 0 && !loading) ? (
            <tr>
              <td colSpan={columns.length + (selection ? 1 : 0)} className="ui-table-empty-cell">
                <EmptyState 
                  title={emptyState?.title || "No data available"}
                  description={emptyState?.description || "There are no records to display at the moment."}
                  icon={emptyState?.icon}
                  action={emptyState?.action}
                />
              </td>
            </tr>
          ) : (
            paginatedData.map((row, rowIdx) => {
              const isSelected = selection?.selectedIds.includes(row[keyField]);
              return (
                <tr 
                  key={row[keyField] || rowIdx} 
                  className={`${rowClassName ? rowClassName(row) : ''} ${onRowClick ? 'ui-table-row--clickable' : ''} ${isSelected ? 'ui-table-row--selected' : ''}`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {selection && (
                    <td className="ui-table-selection-cell" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => selection.onSelect(row[keyField])}
                        className="ui-checkbox"
                      />
                    </td>
                  )}
                  {columns.map((col, colIdx) => {
                    const value = row[col.key];
                    let displayValue = value ?? '-';

                    // Handle Firestore Timestamps or other plain objects
                    if (typeof value === 'object' && value !== null && !React.isValidElement(value)) {
                      if (value.seconds) {
                        displayValue = new Date(value.seconds * 1000).toLocaleDateString();
                      } else {
                        displayValue = JSON.stringify(value);
                      }
                    }

                    return (
                      <td key={`${row[keyField] || rowIdx}-${col.key || colIdx}`} className={col.className || ''}>
                        {col.render ? col.render(row) : displayValue}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Pagination Controls */}
      {(totalPages > 1 || isCursorMode) && (
        <div className="ui-paginationWrapper">
          <div className="ui-paginationLeft">
            {!isCursorMode && (
              <span className="ui-pageInfo">
                Showing <strong>{(page - 1) * pageSize + 1}</strong> to <strong>{Math.min(page * pageSize, totalItems)}</strong> of <strong>{totalItems}</strong> entries
              </span>
            )}
            {isCursorMode && (
              <span className="ui-pageInfo">
                Page <strong>{page}</strong> {loading ? '(Loading...)' : ''}
              </span>
            )}
          </div>
          
          <div className="ui-pagination">
            <button 
              className="ui-pageBtn" 
              onClick={() => {
                if (isCursorMode) onPrevious?.();
                else onPageChange?.(page - 1);
              }}
              disabled={(isCursorMode ? isFirstPage : page === 1) || loading}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            
            {(!isCursorMode && paginationVariant === 'numbers') && (
              <div className="ui-pagination-numbers">
                  {Array.from({ length: totalPages }).map((_, i) => {
                      const pageNum = i + 1;
                      if (pageNum === 1 || pageNum === totalPages || (pageNum >= page - 1 && pageNum <= page + 1)) {
                          return (
                              <button 
                                  key={pageNum}
                                  className={`ui-pageBtn ${page === pageNum ? 'ui-pageBtn--active' : ''}`}
                                  onClick={() => onPageChange?.(pageNum)}
                              >
                                  {pageNum}
                              </button>
                          );
                      } else if (pageNum === page - 2 || pageNum === page + 2) {
                          return <span key={pageNum} className="ui-pagination-ellipsis">...</span>;
                      }
                      return null;
                  })}
              </div>
            )}

            <button 
              className="ui-pageBtn" 
              onClick={() => {
                if (isCursorMode) onNext?.();
                else onPageChange?.(page + 1);
              }}
              disabled={(isCursorMode ? !hasMore : page === totalPages) || loading}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(DataTable);
