import React from 'react';
import './TopBar.css';

const TopBar = ({ 
  variant = 'default',
  height = '60px',
  backgroundColor = 'var(--bg-surface)',
  position = 'static',
  children,
  style,
  isPreview = false,
  ...props 
}) => {
  const topBarStyle = {
    height,
    backgroundColor,
    position,
    ...style
  };

  return (
    <div 
      className={`ui-topbar ui-topbar--${variant}`}
      style={topBarStyle}
      {...props}
    >
      {children}
    </div>
  );
};

export default TopBar;
