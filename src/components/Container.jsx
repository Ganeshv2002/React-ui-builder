import React from 'react';
import './Container.css';

const Container = ({ children, direction = 'vertical', gap = 'medium', style, ...props }) => {
  return (
    <div 
      className={`ui-container ui-container--${direction} ui-container--gap-${gap}`} 
      style={style}
      {...props}
    >
      {children || 'Container content'}
    </div>
  );
};

export default Container;
