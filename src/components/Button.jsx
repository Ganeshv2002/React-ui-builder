import React from 'react';
import './Button.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  type = 'button',
  onClick, 
  style, 
  isPreview = false,
  ...props 
}) => {
  const handleClick = (e) => {
    if (!isPreview) {
      e.preventDefault(); // Prevent actions in builder mode
      return;
    }
    
    // For submit buttons, let the form handle the submission
    if (type === 'submit') {
      // Don't preventDefault for submit buttons - let the form's onSubmit handle it
      console.log('🔥 Submit button clicked');
      return;
    }
    
    if (onClick) {
      onClick(e);
    } else {
      // Default action for buttons without onClick
      console.log('🔘 Button clicked:', children);
    }
  };

  return (
    <button
      className={`ui-button ui-button--${variant} ui-button--${size}`}
      type={type}
      onClick={handleClick}
      style={style}
      {...props}
    >
      {children || 'Button'}
    </button>
  );
};

export default Button;
