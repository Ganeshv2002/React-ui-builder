import React from 'react';
import './Text.css';

const Text = ({ variant = 'body', children, style, ...props }) => {
  const Tag = variant === 'h1' ? 'h1' : 
              variant === 'h2' ? 'h2' : 
              variant === 'h3' ? 'h3' : 
              variant === 'body' ? 'p' : 'span';

  return (
    <Tag className={`ui-text ui-text--${variant}`} style={style} {...props}>
      {children || `Sample ${variant} text`}
    </Tag>
  );
};

export default Text;
