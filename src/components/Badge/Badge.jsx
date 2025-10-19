import React from 'react';
import './Badge.css';

const Badge = ({
  children = 'New',
  variant = 'primary',
  size = 'medium',
  shape = 'rounded',
  className = '',
  style,
  ...props
}) => {
  const classes = [
    'ui-badge',
    `ui-badge--${variant}`,
    `ui-badge--${size}`,
    `ui-badge--${shape}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} style={style} {...props}>
      {children || 'Badge'}
    </span>
  );
};

export default Badge;
