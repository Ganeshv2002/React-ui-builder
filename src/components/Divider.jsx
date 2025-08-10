import React from 'react';
import './Divider.css';

const Divider = ({ 
  thickness = 1,
  color = '#e0e0e0',
  margin = 'medium',
  style, 
  ...props 
}) => {
  return (
    <hr 
      className={`ui-divider ui-divider--${margin}`}
      style={{
        borderTop: `${thickness}px solid ${color}`,
        ...style
      }}
      {...props}
    />
  );
};

export default Divider;
