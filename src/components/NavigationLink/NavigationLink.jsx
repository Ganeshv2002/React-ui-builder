import React from 'react';
import { usePages } from '../../contexts/PageContext';

const NavigationLink = (props) => {
  const {
    targetPageId,
    children,
    className = '',
    style = {},
    isPreview: previewProp,
    onClick: userOnClick,
    ...restProps
  } = props;

  const isPreviewPropProvided = Object.prototype.hasOwnProperty.call(props, 'isPreview');
  const isPreview = Boolean(previewProp);

  const { setCurrentPageId, pages } = usePages();
  const targetPage = pages.find((page) => page.id === targetPageId);

  const handleClick = (event) => {
    if (userOnClick) {
      userOnClick(event);
    }

    if (!targetPage || event.defaultPrevented) {
      return;
    }

    if (isPreviewPropProvided) {
      event.preventDefault();
      setCurrentPageId(targetPageId);
    }
  };

  const linkStyle = {
    color: 'var(--primary)',
    textDecoration: 'underline',
    cursor: 'pointer',
    ...style,
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
      {...restProps}
    >
      {children || targetPage.name}
    </a>
  );
};

export default NavigationLink;
