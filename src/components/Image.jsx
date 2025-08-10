import React from 'react';
import './Image.css';

const Image = ({ src = 'https://via.placeholder.com/300x200', alt = 'Image', width, height, style, ...props }) => {
  return (
    <img 
      src={src}
      alt={alt}
      width={width}
      height={height}
      className="ui-image"
      style={style}
      {...props}
    />
  );
};

export default Image;
