import React from 'react';
import './Paragraph.css';

const Paragraph = ({ 
  text = 'This is a paragraph of text. You can edit this content in the properties panel.',
  align = 'left',
  size = 'medium',
  style, 
  ...props 
}) => {
  return (
    <p 
      className={`ui-paragraph ui-paragraph--${align} ui-paragraph--${size}`}
      style={style}
      {...props}
    >
      {text}
    </p>
  );
};

export default Paragraph;
