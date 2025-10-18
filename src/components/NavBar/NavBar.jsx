import React from 'react';
import './NavBar.css';

const NavBar = ({ 
  variant = 'horizontal',
  backgroundColor = 'var(--bg-surface)',
  padding = '16px 24px',
  gap = '24px',
  justifyContent = 'flex-start',
  alignItems = 'center',
  children,
  style,
  isPreview = false,
  ...props 
}) => {
  const navBarStyle = {
    backgroundColor,
    padding,
    gap,
    justifyContent,
    alignItems,
    ...style
  };

  return (
    <nav 
      className={`ui-navbar ui-navbar--${variant}`}
      style={navBarStyle}
      {...props}
    >
      {children}
    </nav>
  );
};

export default NavBar;
