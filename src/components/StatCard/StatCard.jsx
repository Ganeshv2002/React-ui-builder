import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowTrendUp,
  faArrowTrendDown,
  faMinus,
} from '@fortawesome/free-solid-svg-icons';
import './StatCard.css';

const trendIconMap = {
  up: faArrowTrendUp,
  down: faArrowTrendDown,
  neutral: faMinus,
};

const StatCard = ({
  title = 'Total Revenue',
  value = '$24,500',
  change = '+12% vs last month',
  trend = 'up',
  variant = 'neutral',
  helperText = 'Updated just now',
  children,
  className = '',
  style,
  ...props
}) => {
  const classes = ['ui-stat-card', `ui-stat-card--${variant}`, className]
    .filter(Boolean)
    .join(' ');

  const icon = trendIconMap[trend] || trendIconMap.neutral;

  return (
    <div className={classes} style={style} {...props}>
      <div className="ui-stat-card__header">
        <span className="ui-stat-card__title">{title}</span>
      </div>
      <div className="ui-stat-card__value">{value}</div>
      {change && (
        <div className={`ui-stat-card__change ui-stat-card__change--${trend}`}>
          <FontAwesomeIcon icon={icon} aria-hidden="true" />
          <span>{change}</span>
        </div>
      )}
      {helperText && (
        <p className="ui-stat-card__helper" aria-live="polite">
          {helperText}
        </p>
      )}
      {children}
    </div>
  );
};

export default StatCard;
