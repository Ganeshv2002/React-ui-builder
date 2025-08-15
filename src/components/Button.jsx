import React from 'react';
import { usePages } from '../contexts/PageContext';
import './Button.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  type = 'button',
  targetPageId = '',
  navigateOnValidation = false,
  onClick, 
  style, 
  isPreview = false,
  ...props 
}) => {
  const { setCurrentPageId, pages } = usePages();
  
  const targetPage = pages.find(page => page.id === targetPageId);

  const validateForm = () => {
    // Find the closest form element
    const button = document.activeElement;
    const form = button.closest('form');
    
    if (!form) {
      console.log('🔍 No form found for validation');
      return true; // No form to validate
    }

    // Check HTML5 form validity
    const isValid = form.checkValidity();
    
    if (!isValid) {
      // Trigger validation messages
      form.reportValidity();
      console.log('❌ Form validation failed');
      return false;
    }

    console.log('✅ Form validation passed');
    return true;
  };

  const handleNavigation = () => {
    if (targetPage) {
      console.log(`🔗 Navigating to page: ${targetPage.name} (${targetPage.path})`);
      setCurrentPageId(targetPageId);
    }
  };

  const handleClick = (e) => {
    if (!isPreview) {
      e.preventDefault(); // Prevent actions in builder mode
      return;
    }
    
    // Handle submit buttons with validation
    if (type === 'submit') {
      if (navigateOnValidation && targetPageId) {
        e.preventDefault(); // Prevent form submission
        
        // Validate form first
        if (validateForm()) {
          // Navigate only if validation passes
          handleNavigation();
        }
        return;
      }
      
      // Normal submit behavior
      console.log('🔥 Submit button clicked');
      return;
    }
    
    // Handle regular buttons with navigation
    if (targetPageId && targetPage) {
      e.preventDefault();
      handleNavigation();
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
      title={isPreview && targetPage ? `Navigate to ${targetPage.name}` : undefined}
      {...props}
    >
      {children || 'Button'}
    </button>
  );
};

export default Button;
