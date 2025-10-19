import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleInfo,
  faCircleCheck,
  faTriangleExclamation,
  faCircleXmark,
} from '@fortawesome/free-solid-svg-icons';
import './Alert.css';

const variantIconMap = {
  info: faCircleInfo,
  success: faCircleCheck,
  warning: faTriangleExclamation,
  danger: faCircleXmark,
};

const Alert = ({
  title = 'Heads up!',
  description = 'Something happened that needs your attention.',
  variant = 'info',
  showIcon = true,
  children,
  className = '',
  style,
  ...props
}) => {
  const classes = ['ui-alert', `ui-alert--${variant}`, className]
    .filter(Boolean)
    .join(' ');

  const icon = variantIconMap[variant] || variantIconMap.info;

  return (
    <div className={classes} role="alert" style={style} {...props}>
      {showIcon && (
        <span className="ui-alert__icon" aria-hidden="true">
          <FontAwesomeIcon icon={icon} />
        </span>
      )}
      <div className="ui-alert__content">
        {title && <h4 className="ui-alert__title">{title}</h4>}
        {description && (
          <p className="ui-alert__description">{description}</p>
        )}
        {children}
      </div>
    </div>
  );
};

export default Alert;
