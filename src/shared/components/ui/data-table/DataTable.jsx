import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react';
import EmptyState from '../empty-state/EmptyState';
import Spinner from '../spinner/Spinner';
import Skeleton from '../skeleton/Skeleton';
import { downloadCSV } from '../../../../utils/csvUtils';

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
  pageSize = 5,
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
  paginationVariant = 'numbers', // 'numbers', 'simple', or 'cursor'
  // Export
  showExport = false,
  exportFileName = 'export.csv'
}) => {
  const [sortConfig, setSortConfig] = useState(initialSort);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize(); // Init
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. Pagination Mode Detection
  // Strictly isolate modes: Cursor (Remote) vs Page (Local/Manual)
  const isCursorMode = !!onNext || !!onPrevious || paginationVariant === 'cursor';

  // 2. Sorting Logic
  const sortedData = useMemo(() => {
    if (!sortConfig.key || sortConfig.direction === 'none') {
      return data;
    }

    const normalizeSortValue = (value) => {
      if (value === null || value === undefined) return null;
      if (typeof value === 'object' && value.seconds !== undefined) {
        const nanos = value.nanoseconds || 0;
        return (value.seconds * 1000) + (nanos / 1000000);
      }
      if (Array.isArray(value)) return value.join(', ');
      if (typeof value === 'boolean') return value ? 1 : 0;
      return value;
    };

    const sortableData = [...data];
    sortableData.sort((a, b) => {
      const aValue = normalizeSortValue(a[sortConfig.key]);
      const bValue = normalizeSortValue(b[sortConfig.key]);

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
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 0;
  
  const paginatedData = useMemo(() => {
    // In Cursor mode, we NEVER slice data internally. The server handles it.
    // Also if manualPagination is true (page-based remote), we don't slice.
    if (isCursorMode || manualPagination) return sortedData;

    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize, isCursorMode, manualPagination]);

  const rangeStart = totalItems === 0 ? 0 : ((page - 1) * pageSize) + 1;
  const rangeEnd = totalItems === 0
    ? 0
    : Math.min(rangeStart + Math.max(paginatedData.length - 1, 0), totalItems);
  const shouldShowPagination = isCursorMode
    ? loading || paginatedData.length > 0 || page > 1 || hasMore || totalItems > 0
    : totalPages > 1;
  const hasKnownTotalPages = isCursorMode && totalItemsProp !== null && totalPages > 0;
  const previousDisabled = isCursorMode
    ? loading || isFirstPage
    : loading || page === 1;
  const nextDisabled = isCursorMode
    ? loading || !hasMore
    : loading || page === totalPages;

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
  
  const handleExport = () => {
    // 1. Prepare data for export
    // If we have custom renderers, we should try to use them for simpler values if possible, 
    // but usually, for CSV we want the raw data or a slightly normalized version.
    const exportData = paginatedData.map(row => {
        const normalizedRow = {};
        columns.forEach(col => {
            if (col.key && col.key !== 'actions') {
                const value = row[col.key];
                // Standard normalization for Firestore timestamps if they exist
                if (value?.seconds) {
                    normalizedRow[col.header || col.key] = new Date(value.seconds * 1000).toLocaleString();
                } else if (typeof value === 'object' && value !== null) {
                    normalizedRow[col.header || col.key] = JSON.stringify(value);
                } else {
                    normalizedRow[col.header || col.key] = value ?? '';
                }
            }
        });
        return normalizedRow;
    });

    downloadCSV(exportData, exportFileName);
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
      {/* Table-wide Spinner for re-fetching (when data already exists) */}
      {loading && paginatedData.length > 0 && (
        <div className="ui-table-loading-overlay">
          <Spinner size="md" />
        </div>
      )}

      {isMobile ? (
        <div className="ui-table-mobile-cards">
          <div className="ui-table-toolbar">
              {showExport && paginatedData.length > 0 && (
                  <button 
                      className="ui-table-export-btn" 
                      onClick={handleExport}
                      title="Export to CSV"
                  >
                      <Download size={14} /> Export CSV
                  </button>
              )}
          </div>
          {loading && paginatedData.length === 0 ? (
            Array.from({ length: pageSize }).map((_, i) => (
              <div key={`skeleton-${i}`} className="ui-table-card">
                <div className="ui-table-card-row">
                  <Skeleton height="1.2rem" width="60%" />
                </div>
                <div className="ui-table-card-row">
                   <Skeleton height="1rem" width="40%" />
                </div>
                <div className="ui-table-card-row">
                   <Skeleton height="1rem" width="80%" />
                </div>
              </div>
            ))
          ) : (paginatedData.length === 0 && !loading) ? (
            <EmptyState 
              title={emptyState?.title || "No data available"}
              description={emptyState?.description || "There are no records to display at the moment."}
              icon={emptyState?.icon}
              action={emptyState?.action}
            />
          ) : (
            paginatedData.map((row, rowIdx) => {
              const isSelected = selection?.selectedIds.includes(row[keyField]);
              return (
                <div 
                  key={row[keyField] || rowIdx} 
                  className={`ui-table-card ${rowClassName ? rowClassName(row) : ''} ${onRowClick ? 'ui-table-card--clickable' : ''} ${isSelected ? 'ui-table-card--selected' : ''}`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {selection && (
                    <div className="ui-table-card-row" onClick={(e) => e.stopPropagation()}>
                      <span className="ui-table-card-label">Select</span>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => selection.onSelect(row[keyField])}
                        className="ui-checkbox"
                      />
                    </div>
                  )}
                  {columns.map((col, colIdx) => {
                    const value = row[col.key];
                    let displayValue = value ?? '-';

                    if (typeof value === 'object' && value !== null && !React.isValidElement(value)) {
                      if (value.seconds) {
                        displayValue = new Date(value.seconds * 1000).toLocaleDateString();
                      } else {
                        displayValue = JSON.stringify(value);
                      }
                    }

                    const isPrimary = colIdx === 0;
                    const isActions = col.key === 'actions' || (!col.key && col.header === '');

                    return (
                      <div key={`${row[keyField] || rowIdx}-${col.key || colIdx}`} className={`ui-table-card-row ${isPrimary ? 'ui-table-card-primary' : ''} ${isActions ? 'ui-table-card-actions' : ''}`}>
                        {!isPrimary && !isActions && <span className="ui-table-card-label">{col.header}</span>}
                        <span className="ui-table-card-value">{col.render ? col.render(row) : displayValue}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <table className="ui-table">
          <thead>
            {showExport && paginatedData.length > 0 && (
              <tr className="ui-table-toolbar-row">
                <th colSpan={columns.length + (selection ? 1 : 0)}>
                    <div className="ui-table-toolbar">
                        <button 
                            className="ui-table-export-btn" 
                            onClick={handleExport}
                            title="Export current page to CSV"
                        >
                            <Download size={14} /> Export to CSV
                        </button>
                    </div>
                </th>
              </tr>
            )}
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
          {loading && paginatedData.length === 0 ? (
            Array.from({ length: pageSize }).map((_, i) => (
              <tr key={`skeleton-row-${i}`} className="ui-table-skeleton-row">
                {selection && <td><Skeleton width="20px" height="20px" /></td>}
                {columns.map((col, j) => (
                  <td key={`skeleton-cell-${j}`} style={col.width ? { width: col.width } : {}}>
                    <Skeleton width={j === 0 ? "70%" : "90%"} />
                  </td>
                ))}
              </tr>
            ))
          ) : (paginatedData.length === 0 && !loading) ? (
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
      )}

      {/* Pagination Controls */}
      {shouldShowPagination && (
        <div className="ui-paginationWrapper">
          <div className="ui-paginationLeft">
            <div className="ui-perPageControl">
              <span className="ui-perPageLabel">Show</span>
              <select 
                className="ui-perPageSelect"
                value={pageSize}
                onChange={(e) => onPageChange?.(1, Number(e.target.value))}
              >
                {[5, 10, 25, 50].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            {!isCursorMode && (
              <span className="ui-pageInfo">
                <span className="ui-pageInfo__primary">
                  <strong>{rangeStart}</strong>-<strong>{Math.min(page * pageSize, totalItems)}</strong> of <strong>{totalItems}</strong>
                </span>
              </span>
            )}
            {isCursorMode && (
              <span className="ui-pageInfo">
                <span className="ui-pageInfo__primary">
                  Page <strong>{page}</strong>
                  {hasKnownTotalPages && <> of <strong>{totalPages}</strong></>}
                </span>
                {totalItemsProp !== null && totalItems > 0 && (
                  <span className="ui-pageInfo__secondary">
                    <strong>{rangeStart}</strong>-<strong>{rangeEnd}</strong> of <strong>{totalItems}</strong>
                  </span>
                )}
              </span>
            )}
          </div>
          
          <div className="ui-pagination">
            <button 
              className={`ui-pageBtn ui-pageBtn--prev ${loading ? 'ui-pageBtn--loading' : ''}`} 
              onClick={() => {
                if (isCursorMode) onPrevious?.();
                else onPageChange?.(page - 1);
              }}
              disabled={previousDisabled}
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
                                  className={`ui-pageBtn ${page === pageNum ? 'ui-pageBtn--active' : ''} ${loading ? 'ui-pageBtn--loading' : ''}`}
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
              className={`ui-pageBtn ui-pageBtn--next ${loading ? 'ui-pageBtn--loading' : ''}`} 
              onClick={() => {
                if (isCursorMode) onNext?.();
                else onPageChange?.(page + 1);
              }}
              disabled={nextDisabled}
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
