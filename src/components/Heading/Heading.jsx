import React from 'react';
import './Heading.css';

const Heading = ({ 
  level = 1, 
  text = 'Heading', 
  align = 'left',
  style, 
  ...props 
}) => {
  const HeadingTag = `h${level}`;
  
  return React.createElement(
    HeadingTag,
    {
      className: `ui-heading ui-heading--${level} ui-heading--${align}`,
      style,
      ...props
    },
    text
  );
};

export default Heading;
