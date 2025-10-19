import React from 'react';
import './Progress.css';

const clampNumber = (value, min, max) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return min;
  }
  return Math.min(Math.max(numeric, min), max);
};

const Progress = ({
  value = 60,
  max = 100,
  label = 'Progress',
  showLabel = true,
  color = '#2563eb',
  className = '',
  style,
  ...props
}) => {
  const safeMax = clampNumber(max, 1, Number.MAX_SAFE_INTEGER);
  const safeValue = clampNumber(value, 0, safeMax);
  const percentage = Math.round((safeValue / safeMax) * 100);

  const classes = ['ui-progress', className].filter(Boolean).join(' ');

  return (
    <div className={classes} style={style} {...props}>
      {showLabel && (
        <div className="ui-progress__label">
          <span>{label || 'Progress'}</span>
          <span className="ui-progress__value">{percentage}%</span>
        </div>
      )}
      <div
        className="ui-progress__track"
        role="progressbar"
        aria-label={label || 'Progress'}
        aria-valuenow={safeValue}
        aria-valuemin={0}
        aria-valuemax={safeMax}
      >
        <div
          className="ui-progress__bar"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

export default Progress;
