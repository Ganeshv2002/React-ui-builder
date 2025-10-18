import React from 'react';
import './TaskBar.css';

const TaskBar = ({ 
  variant = 'bottom',
  height = '48px',
  backgroundColor = 'var(--bg-surface)',
  padding = '8px 16px',
  gap = '12px',
  justifyContent = 'center',
  alignItems = 'center',
  position = 'fixed',
  children,
  style,
  isPreview = false,
  ...props 
}) => {
  const taskBarStyle = {
    height,
    backgroundColor,
    padding,
    gap,
    justifyContent,
    alignItems,
    position: isPreview ? position : 'relative',
    bottom: isPreview && position === 'fixed' ? '0' : 'auto',
    left: isPreview && position === 'fixed' ? '0' : 'auto',
    right: isPreview && position === 'fixed' ? '0' : 'auto',
    zIndex: isPreview && position === 'fixed' ? '1000' : 'auto',
    ...style
  };

  return (
    <div 
      className={`ui-taskbar ui-taskbar--${variant}`}
      style={taskBarStyle}
      {...props}
    >
      {children}
    </div>
  );
};

export default TaskBar;
