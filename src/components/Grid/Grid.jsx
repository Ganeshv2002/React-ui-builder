import React from 'react';
import './Grid.css';

const Grid = ({ 
  columns = 2,
  rows = 'auto',
  gap = '16px',
  columnGap = '',
  rowGap = '',
  justifyItems = 'stretch',
  alignItems = 'stretch',
  justifyContent = 'start',
  alignContent = 'start',
  autoFlow = 'row',
  minColumnWidth = '',
  children,
  style,
  isPreview = false,
  ...props 
}) => {
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: minColumnWidth 
      ? `repeat(auto-fit, minmax(${minColumnWidth}, 1fr))`
      : typeof columns === 'number' 
        ? `repeat(${columns}, 1fr)`
        : columns,
    gridTemplateRows: rows,
    gap: gap,
    columnGap: columnGap || undefined,
    rowGap: rowGap || undefined,
    justifyItems,
    alignItems,
    justifyContent,
    alignContent,
    gridAutoFlow: autoFlow,
    ...style
  };

  return (
    <div 
      className="ui-grid"
      style={gridStyle}
      {...props}
    >
      {children}
    </div>
  );
};

export default Grid;
