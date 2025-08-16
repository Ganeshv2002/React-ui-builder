import React from 'react';
import { usePages } from '../../contexts/PageContext';

const NavigationLink = ({ 
  targetPageId, 
  children, 
  className = '', 
  style = {},
  isPreview = false,
  ...props 
}) => {
  const { setCurrentPageId, pages } = usePages();
  
  const targetPage = pages.find(page => page.id === targetPageId);
  
  const handleClick = (e) => {
    if (isPreview && targetPage) {
      e.preventDefault();
      setCurrentPageId(targetPageId);
    }
  };

  const linkStyle = {
    color: 'var(--primary)',
    textDecoration: 'underline',
    cursor: 'pointer',
    ...style
  };

  if (!targetPage) {
    return (
      <span style={{ ...linkStyle, color: 'var(--danger)', opacity: 0.7 }}>
        {children || '[Broken Link]'}
      </span>
    );
  }

  return (
    <a
      href={targetPage.path}
      onClick={handleClick}
      className={className}
      style={linkStyle}
      title={isPreview ? `Navigate to ${targetPage.name}` : `Links to ${targetPage.name} (${targetPage.path})`}
      {...props}
    >
      {children || targetPage.name}
    </a>
  );
};

export default NavigationLink;
