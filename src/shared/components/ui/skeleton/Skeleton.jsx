import React from 'react';

/**
 * Skeleton Component
 * A premium placeholder loader with shimmer animation.
 */
const Skeleton = ({ 
  width, 
  height, 
  circle = false, 
  className = '', 
  style = {},
  variant = 'default' // 'default', 'text'
}) => {
  const customStyle = {
    width: width || (circle ? height : '100%'),
    height: height || '1em',
    ...style
  };

  const classes = [
    'ui-skeleton',
    circle ? 'ui-skeleton--circle' : '',
    variant === 'text' ? 'ui-skeleton--text' : '',
    className
  ].filter(Boolean).join(' ');

  return <div className={classes} style={customStyle} />;
};

export default Skeleton;
