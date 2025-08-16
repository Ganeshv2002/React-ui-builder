import React from 'react';
import './Divider.css';

const Divider = ({ 
  thickness = '1px',
  color = '#e0e0e0',
  marginTop = '16px',
  marginBottom = '16px',
  borderStyle = 'solid',
  ...props 
}) => {
  return (
    <hr 
      className="ui-divider"
      style={{
        borderTop: `${thickness} ${borderStyle} ${color}`,
        borderBottom: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        marginTop,
        marginBottom,
        width: '100%'
      }}
      {...props}
    />
  );
};

export default Divider;
