/**
 * Component templates for generated apps
 * These are simplified versions of the builder components without editor dependencies
 */

// Basic Button component for generated apps
export const generateButtonComponent = () => {
  const jsx = `import React from 'react';
import './Button.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  type = 'button',
  onClick, 
  style,
  className = '',
  ...props 
}) => {
  const baseClass = 'btn';
  const variantClass = \`btn-\${variant}\`;
  const sizeClass = \`btn-\${size}\`;
  const classes = [baseClass, variantClass, sizeClass, className].filter(Boolean).join(' ');

  return (
    <button 
      type={type}
      className={classes}
      onClick={onClick}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;`;

  const css = `.btn {
  display: inline-block;
  padding: 8px 16px;
  margin: 4px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  text-decoration: none;
  transition: all 0.2s ease;
  background: #007bff;
  color: white;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.btn:active {
  transform: translateY(0);
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
}

.btn-medium {
  padding: 8px 16px;
  font-size: 14px;
}

.btn-large {
  padding: 12px 24px;
  font-size: 16px;
}`;

  return { jsx, css };
};

// Basic Input component for generated apps
export const generateInputComponent = () => {
  const jsx = `import React, { useState } from 'react';
import './Input.css';

const Input = ({ 
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  name,
  id,
  required = false,
  disabled = false,
  style,
  className = '',
  ...props 
}) => {
  const [localValue, setLocalValue] = useState(value || '');

  const handleChange = (e) => {
    setLocalValue(e.target.value);
    if (onChange) {
      onChange(e);
    }
  };

  const inputId = id || name || 'input';

  return (
    <div className={\`input-group \${className}\`} style={style}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        required={required}
        disabled={disabled}
        className="input-field"
        {...props}
      />
    </div>
  );
};

export default Input;`;

  const css = `.input-group {
  margin-bottom: 16px;
}

.input-label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #333;
}

.required {
  color: #dc3545;
  margin-left: 2px;
}

.input-field {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.input-field:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.input-field:disabled {
  background-color: #f8f9fa;
  color: #6c757d;
}`;

  return { jsx, css };
};

// Basic Container component for generated apps
export const generateContainerComponent = () => {
  const jsx = `import React from 'react';
import './Container.css';

const Container = ({ 
  direction = 'vertical',
  gap = 'medium',
  justifyContent = 'flex-start',
  alignItems = 'stretch',
  flexWrap = 'nowrap',
  padding = 'medium',
  children,
  style,
  className = '',
  ...props 
}) => {
  const containerClass = \`container container-\${direction} gap-\${gap} justify-\${justifyContent} align-\${alignItems} wrap-\${flexWrap} padding-\${padding} \${className}\`;

  return (
    <div 
      className={containerClass.trim()}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

export default Container;`;

  const css = `.container {
  display: flex;
}

.container-vertical {
  flex-direction: column;
}

.container-horizontal {
  flex-direction: row;
}

.gap-none { gap: 0; }
.gap-small { gap: 8px; }
.gap-medium { gap: 16px; }
.gap-large { gap: 24px; }
.gap-xl { gap: 32px; }

.padding-none { padding: 0; }
.padding-small { padding: 8px; }
.padding-medium { padding: 16px; }
.padding-large { padding: 24px; }
.padding-xl { padding: 32px; }

.justify-flex-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-flex-end { justify-content: flex-end; }
.justify-space-between { justify-content: space-between; }
.justify-space-around { justify-content: space-around; }
.justify-space-evenly { justify-content: space-evenly; }

.align-stretch { align-items: stretch; }
.align-flex-start { align-items: flex-start; }
.align-center { align-items: center; }
.align-flex-end { align-items: flex-end; }
.align-baseline { align-items: baseline; }

.wrap-nowrap { flex-wrap: nowrap; }
.wrap-wrap { flex-wrap: wrap; }
.wrap-wrap-reverse { flex-wrap: wrap-reverse; }`;

  return { jsx, css };
};

// Generate all component templates
export const generateAllComponents = () => {
  const components = {};
  
  // Basic components with folder structure
  const button = generateButtonComponent();
  components['src/components/Button/Button.jsx'] = button.jsx;
  components['src/components/Button/Button.css'] = button.css;
  
  const input = generateInputComponent();
  components['src/components/Input/Input.jsx'] = input.jsx;
  components['src/components/Input/Input.css'] = input.css;
  
  const container = generateContainerComponent();
  components['src/components/Container/Container.jsx'] = container.jsx;
  components['src/components/Container/Container.css'] = container.css;
  
  // Simple components with folder structure
  components['src/components/Text/Text.jsx'] = `import React from 'react';
import './Text.css';

const Text = ({ variant = 'body', children, style, className = '' }) => {
  const Tag = variant === 'body' ? 'p' : variant;
  return <Tag className={\`text text-\${variant} \${className}\`} style={style}>{children}</Tag>;
};

export default Text;`;

  components['src/components/Text/Text.css'] = `.text {
  margin: 0 0 16px 0;
}
.text-h1 { font-size: 2em; font-weight: bold; }
.text-h2 { font-size: 1.5em; font-weight: bold; }
.text-h3 { font-size: 1.25em; font-weight: bold; }
.text-body { font-size: 1em; }`;

  components['src/components/Card/Card.jsx'] = `import React from 'react';
import './Card.css';

const Card = ({ title, children, style, className = '' }) => (
  <div className={\`card \${className}\`} style={style}>
    {title && <h3 className="card-title">{title}</h3>}
    <div className="card-content">{children}</div>
  </div>
);

export default Card;`;

  components['src/components/Card/Card.css'] = `.card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.card-title { margin: 0 0 16px 0; color: #333; }
.card-content { line-height: 1.6; }`;

  components['src/components/Badge/Badge.jsx'] = `import React from 'react';
import './Badge.css';

const Badge = ({ children = 'New', variant = 'primary', size = 'medium', shape = 'rounded', className = '', style, ...props }) => {
  const classes = ['ui-badge', \`ui-badge--\${variant}\`, \`ui-badge--\${size}\`, \`ui-badge--\${shape}\`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} style={style} {...props}>
      {children || 'Badge'}
    </span>
  );
};

export default Badge;`;

  components['src/components/Badge/Badge.css'] = `.ui-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  border-radius: 0.5rem;
  letter-spacing: 0.02em;
  color: #0f172a;
  background-color: #e2e8f0;
}
.ui-badge--small { padding: 0.125rem 0.375rem; font-size: 0.7rem; }
.ui-badge--medium { padding: 0.25rem 0.5rem; font-size: 0.75rem; }
.ui-badge--large { padding: 0.375rem 0.75rem; font-size: 0.85rem; }
.ui-badge--rounded { border-radius: 0.5rem; }
.ui-badge--pill { border-radius: 9999px; }
.ui-badge--square { border-radius: 0.25rem; }
.ui-badge--primary { background-color: #2563eb; color: #f8fafc; }
.ui-badge--neutral { background-color: #e2e8f0; color: #0f172a; }
.ui-badge--success { background-color: #22c55e; color: #052e16; }
.ui-badge--warning { background-color: #facc15; color: #78350f; }
.ui-badge--danger { background-color: #ef4444; color: #fff7ed; }`;

  components['src/components/Alert/Alert.jsx'] = `import React from 'react';
import './Alert.css';

const Alert = ({ title = 'Heads up!', description = 'Something happened that needs your attention.', variant = 'info', showIcon = true, children, className = '', style, ...props }) => {
  const classes = ['ui-alert', \`ui-alert--\${variant}\`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} role="alert" style={style} {...props}>
      {showIcon && <span className="ui-alert__icon" aria-hidden="true"></span>}
      <div className="ui-alert__content">
        {title && <h4 className="ui-alert__title">{title}</h4>}
        {description && <p className="ui-alert__description">{description}</p>}
        {children}
      </div>
    </div>
  );
};

export default Alert;`;

  components['src/components/Alert/Alert.css'] = `.ui-alert {
  display: flex;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid transparent;
  background-color: #f8fafc;
  color: #0f172a;
}
.ui-alert__icon {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 9999px;
  background-color: currentColor;
  opacity: 0.2;
  margin-top: 0.15rem;
}
.ui-alert__content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.ui-alert__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}
.ui-alert__description {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
  color: #1e293b;
}
.ui-alert--info {
  background-color: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  color: #1d4ed8;
}
.ui-alert--success {
  background-color: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
  color: #15803d;
}
.ui-alert--warning {
  background-color: rgba(250, 204, 21, 0.12);
  border-color: rgba(250, 204, 21, 0.35);
  color: #b45309;
}
.ui-alert--danger {
  background-color: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.35);
  color: #b91c1c;
}`;

  components['src/components/Avatar/Avatar.jsx'] = `import React from 'react';
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

const Avatar = ({ src = '', alt = 'Team member', initials = 'JD', size = 'md', shape = 'circle', status = 'none', className = '', style, ...props }) => {
  const normalizedInitials = normalizeInitials(initials) || 'A';
  const labelParts = [alt || \`Avatar \${normalizedInitials}\`];

  if (status && status !== 'none') {
    labelParts.push(\`Status: \${status}\`);
  }

  const ariaLabel = labelParts.join('. ');

  const classes = ['ui-avatar', \`ui-avatar--\${size}\`, \`ui-avatar--\${shape}\`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} role="img" aria-label={ariaLabel} style={style} {...props}>
      {src ? (
        <img className="ui-avatar__image" src={src} alt="" />
      ) : (
        <span className="ui-avatar__initials" aria-hidden="true">
          {normalizedInitials}
        </span>
      )}
      {status && status !== 'none' && (
        <span className={\`ui-avatar__status ui-avatar__status--\${status}\`} aria-hidden="true" />
      )}
    </div>
  );
};

export default Avatar;`;

  components['src/components/Avatar/Avatar.css'] = `.ui-avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #e2e8f0;
  color: #1e293b;
  font-weight: 600;
  overflow: hidden;
  user-select: none;
}
.ui-avatar__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ui-avatar__initials {
  font-size: 0.85em;
  letter-spacing: 0.04em;
}
.ui-avatar--circle { border-radius: 9999px; }
.ui-avatar--square { border-radius: 0.75rem; }
.ui-avatar--xs { width: 1.75rem; height: 1.75rem; font-size: 0.7rem; }
.ui-avatar--sm { width: 2.25rem; height: 2.25rem; font-size: 0.8rem; }
.ui-avatar--md { width: 3rem; height: 3rem; font-size: 1rem; }
.ui-avatar--lg { width: 3.5rem; height: 3.5rem; font-size: 1.125rem; }
.ui-avatar--xl { width: 4rem; height: 4rem; font-size: 1.25rem; }
.ui-avatar__status {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 0.9rem;
  height: 0.9rem;
  border-radius: 9999px;
  border: 2px solid #ffffff;
  background-color: #94a3b8;
}
.ui-avatar__status--online { background-color: #22c55e; }
.ui-avatar__status--offline { background-color: #94a3b8; }
.ui-avatar__status--busy { background-color: #ef4444; }`;

  components['src/components/Progress/Progress.jsx'] = `import React from 'react';
import './Progress.css';

const clampNumber = (value, min, max) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return min;
  }
  return Math.min(Math.max(numeric, min), max);
};

const Progress = ({ value = 60, max = 100, label = 'Progress', showLabel = true, color = '#2563eb', className = '', style, ...props }) => {
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
          style={{ width: \`\${percentage}%\`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

export default Progress;`;

  components['src/components/Progress/Progress.css'] = `.ui-progress {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 10rem;
}
.ui-progress__label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #1e293b;
}
.ui-progress__value {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: #0f172a;
}
.ui-progress__track {
  position: relative;
  height: 0.75rem;
  width: 100%;
  background-color: #e2e8f0;
  border-radius: 9999px;
  overflow: hidden;
}
.ui-progress__bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 9999px;
  transition: width 0.3s ease;
  background-color: #2563eb;
}`;

  components['src/components/StatCard/StatCard.jsx'] = `import React from 'react';
import './StatCard.css';

const StatCard = ({ title = 'Total Revenue', value = '$24,500', change = '+12% vs last month', trend = 'up', variant = 'neutral', helperText = 'Updated just now', children, className = '', style, ...props }) => {
  const classes = ['ui-stat-card', \`ui-stat-card--\${variant}\`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} style={style} {...props}>
      <div className="ui-stat-card__header">
        <span className="ui-stat-card__title">{title}</span>
      </div>
      <div className="ui-stat-card__value">{value}</div>
      {change && (
        <div className={\`ui-stat-card__change ui-stat-card__change--\${trend}\`}>
          <span>{change}</span>
        </div>
      )}
      {helperText && <p className="ui-stat-card__helper">{helperText}</p>}
      {children}
    </div>
  );
};

export default StatCard;`;

  components['src/components/StatCard/StatCard.css'] = `.ui-stat-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.25rem;
  border-radius: 1rem;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 8px rgba(15, 23, 42, 0.05);
  min-width: 14rem;
}
.ui-stat-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #475569;
}
.ui-stat-card__title {
  font-weight: 600;
  color: #0f172a;
}
.ui-stat-card__value {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #0f172a;
}
.ui-stat-card__change {
  display: inline-flex;
  align-items: center;
  font-size: 0.9rem;
  font-weight: 600;
}
.ui-stat-card__change--up { color: #16a34a; }
.ui-stat-card__change--down { color: #dc2626; }
.ui-stat-card__change--neutral { color: #64748b; }
.ui-stat-card__helper {
  margin: 0;
  font-size: 0.8rem;
  color: #64748b;
}
.ui-stat-card--accent {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(14, 165, 233, 0.1));
  border-color: rgba(59, 130, 246, 0.25);
}`;

  return components;
};
