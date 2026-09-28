import React from 'react';
import './Heading.css';

const Heading = ({ 
  level = 1, 
  text = 'Heading', 
  align = 'left',
  style, 
  ...props 
}) => {
  // The editor stores levels as "h2"; older JSON may use 2. Both render <h2>.
  const depth = Math.min(6, Math.max(1, parseInt(String(level).replace(/^h/i, ''), 10) || 1));
  const HeadingTag = `h${depth}`;

  return React.createElement(
    HeadingTag,
    {
      className: `ui-heading ui-heading--${depth} ui-heading--${align}`,
      style,
      ...props
    },
    text
  );
};

export default Heading;
