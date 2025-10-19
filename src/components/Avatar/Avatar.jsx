import React from 'react';
import './Avatar.css';

const normalizeInitials = (value) => {
  if (!value) {
    return '';
  }

  return value
    .toString()
    .split(' ')
    .map((segment) => segment.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

const Avatar = ({
  src = '',
  alt = 'Team member',
  initials = 'JD',
  size = 'md',
  shape = 'circle',
  status = 'none',
  className = '',
  style,
  ...props
}) => {
  const normalizedInitials = normalizeInitials(initials) || 'A';
  const labelParts = [alt || `Avatar ${normalizedInitials}`];

  if (status && status !== 'none') {
    labelParts.push(`Status: ${status}`);
  }

  const ariaLabel = labelParts.join('. ');

  const classes = [
    'ui-avatar',
    `ui-avatar--${size}`,
    `ui-avatar--${shape}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      role="img"
      aria-label={ariaLabel}
      style={style}
      {...props}
    >
      {src ? (
        <img className="ui-avatar__image" src={src} alt="" />
      ) : (
        <span className="ui-avatar__initials" aria-hidden="true">
          {normalizedInitials}
        </span>
      )}
      {status && status !== 'none' && (
        <span
          className={`ui-avatar__status ui-avatar__status--${status}`}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default Avatar;
