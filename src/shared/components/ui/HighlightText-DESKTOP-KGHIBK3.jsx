import React from 'react';

/**
 * A component that highlights parts of a text that match a search query.
 * case-insensitive.
 * 
 * @param {Object} props
 * @param {string} props.text - The full text to display
 * @param {string} props.query - The search query to highlight
 * @param {string} [props.className] - Optional custom class for the container
 * @param {string} [props.highlightClassName] - Optional custom class for the <mark> tag
 */
const HighlightText = ({ text, query, className = '', highlightClassName = '' }) => {
  if (!query || !text) {
    return <span className={className}>{text || ''}</span>;
  }

  const parts = String(text).split(new RegExp(`(${query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi'));

  return (
    <span className={className}>
      {parts.map((part, i) => (
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className={`ui-search-highlight ${highlightClassName}`}>
            {part}
          </mark>
        ) : (
          part
        )
      ))}
    </span>
  );
};

export default HighlightText;
