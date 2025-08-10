import React from 'react';
import './Link.css';

const Link = ({ href = '#', text = 'Link text', target = '_self', style, ...props }) => {
  return (
    <a 
      href={href}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      className="ui-link"
      style={style}
      {...props}
    >
      {text}
    </a>
  );
};

export default Link;
