import React from 'react';
import './SideBar.css';

const SideBar = ({ 
  position = 'left',
  width = '250px',
  backgroundColor = 'var(--bg-surface)',
  variant = 'default',
  collapsible = false,
  collapsed = false,
  children,
  style,
  isPreview = false,
  ...props 
}) => {
  const sideBarStyle = {
    width: collapsed ? '60px' : width,
    backgroundColor,
    [position]: 0,
    ...style
  };

  return (
    <div 
      className={`ui-sidebar ui-sidebar--${position} ui-sidebar--${variant} ${collapsed ? 'ui-sidebar--collapsed' : ''}`}
      style={sideBarStyle}
      {...props}
    >
      <div className="ui-sidebar-content">
        {children}
      </div>
    </div>
  );
};

export default SideBar;
