import { useState, useCallback, useMemo, useEffect } from 'react';

/**
 * A reusable hook for cursor-based pagination with history tracking for "Previous" support.
 * 
 * @param {Object} options
 * @param {number} options.limit - Number of items per page
 * @param {Array} options.dependencies - List of dependencies that should reset the pagination (e.g., search, filters)
 * @returns {Object} { data, cursor, cursorStack, hasMore, fetchNext, fetchPrevious, reset }
 */
export const useCursorPagination = (initialLimit = 10, dependencies = []) => {
  const [limit, setLimit] = useState(initialLimit);
  const [cursor, setCursor] = useState(null);
  const [cursorStack, setCursorStack] = useState([null]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Reset pagination when dependencies or limit change
  useEffect(() => {
    reset();
  }, [...dependencies, limit]);

  const reset = useCallback(() => {
    setCursor(null);
    setCursorStack([null]);
    setPage(1);
    setHasMore(false);
  }, []);

  const updateAfterFetch = useCallback((lastDoc, more) => {
    setHasMore(more);
  }, []);

  const fetchNext = useCallback((lastDoc) => {
    if (!lastDoc) return;
    setCursorStack(prev => [...prev, lastDoc]);
    setCursor(lastDoc);
    setPage(prev => prev + 1);
  }, []);

  const fetchPrevious = useCallback(() => {
    if (cursorStack.length <= 1) return;
    
    const newStack = cursorStack.slice(0, -1);
    const previousCursor = newStack[newStack.length - 1];
    
    setCursorStack(newStack);
    setCursor(previousCursor);
    setPage(prev => Math.max(1, prev - 1));
  }, [cursorStack]);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setLimit(newPageSize);
    reset();
  }, [reset]);

  return {
    limit,
    cursor,
    page,
    hasMore,
    fetchNext,
    fetchPrevious,
    reset,
    updateAfterFetch,
    handlePageSizeChange,
    isFirstPage: cursorStack.length <= 1
  };
};

export default useCursorPagination;
