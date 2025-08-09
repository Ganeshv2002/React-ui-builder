import React from 'react';
import './Card.css';

const Card = ({ title, children, style, ...props }) => {
  return (
    <div className="ui-card" style={style} {...props}>
      {title && <div className="ui-card-header">{title}</div>}
      <div className="ui-card-content">
        {children || 'Card content goes here'}
      </div>
    </div>
  );
};

export default Card;
