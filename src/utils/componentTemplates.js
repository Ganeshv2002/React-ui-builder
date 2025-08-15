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
  
  // Basic components
  const button = generateButtonComponent();
  components['src/components/Button.jsx'] = button.jsx;
  components['src/components/Button.css'] = button.css;
  
  const input = generateInputComponent();
  components['src/components/Input.jsx'] = input.jsx;
  components['src/components/Input.css'] = input.css;
  
  const container = generateContainerComponent();
  components['src/components/Container.jsx'] = container.jsx;
  components['src/components/Container.css'] = container.css;
  
  // Simple components
  components['src/components/Text.jsx'] = `import React from 'react';

const Text = ({ variant = 'body', children, style, className = '' }) => {
  const Tag = variant === 'body' ? 'p' : variant;
  return <Tag className={\`text text-\${variant} \${className}\`} style={style}>{children}</Tag>;
};

export default Text;`;

  components['src/components/Text.css'] = `.text {
  margin: 0 0 16px 0;
}
.text-h1 { font-size: 2em; font-weight: bold; }
.text-h2 { font-size: 1.5em; font-weight: bold; }
.text-h3 { font-size: 1.25em; font-weight: bold; }
.text-body { font-size: 1em; }`;

  components['src/components/Card.jsx'] = `import React from 'react';
import './Card.css';

const Card = ({ title, children, style, className = '' }) => (
  <div className={\`card \${className}\`} style={style}>
    {title && <h3 className="card-title">{title}</h3>}
    <div className="card-content">{children}</div>
  </div>
);

export default Card;`;

  components['src/components/Card.css'] = `.card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.card-title { margin: 0 0 16px 0; color: #333; }
.card-content { line-height: 1.6; }`;

  return components;
};
