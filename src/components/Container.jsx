import React from 'react';
import './Container.css';

const Container = ({ 
  children, 
  direction = 'vertical', 
  gap = 'medium',
  justifyContent = 'flex-start',
  alignItems = 'stretch',
  flexWrap = 'nowrap',
  padding = 'medium',
  style, 
  ...props 
}) => {
  const containerStyle = {
    justifyContent,
    alignItems,
    flexWrap,
    ...style
  };

  return (
    <div 
      className={`ui-container ui-container--${direction} ui-container--gap-${gap} ui-container--padding-${padding}`} 
      style={containerStyle}
      {...props}
    >
      {children || 'Container content'}
    </div>
  );
};

export default Container;
