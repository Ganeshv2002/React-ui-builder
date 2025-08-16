import React, { useState, useEffect, useCallback } from 'react';
import { useFormContext } from '../../contexts/FormContext';
import './Input.css';

const Input = ({ 
  type = 'text', 
  placeholder = 'Enter text...', 
  label, 
  value: initialValue, 
  onChange,
  style,
  required = false,
  disabled = false,
  readonly = false,
  min,
  max,
  step,
  pattern,
  maxLength,
  minLength,
  multiple = false,
  accept,
  name,
  id,
  isPreview = false,
  showConditions = '',
  disableConditions = '',
  validationRules = '',
  ...props 
}) => {
  // Local state for preview mode
  const [localValue, setLocalValue] = useState(initialValue || '');
  const [validationError, setValidationError] = useState('');
  
  const formContext = useFormContext();
  
  // Parse JSON conditions and rules
  const parseJSON = (jsonString) => {
    if (!jsonString || typeof jsonString !== 'string') return [];
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.warn('Invalid JSON:', jsonString);
      return [];
    }
  };
  
  const showConditionsArray = parseJSON(showConditions);
  const disableConditionsArray = parseJSON(disableConditions);
  const validationRulesArray = parseJSON(validationRules);
  
  // Check if field should be shown
  const shouldShow = () => {
    if (!isPreview || !formContext || showConditionsArray.length === 0) {
      return true;
    }
    return formContext.checkConditions(showConditionsArray);
  };
  
  // Check if field should be disabled
  const shouldDisable = () => {
    if (!isPreview || !formContext || disableConditionsArray.length === 0) {
      return disabled;
    }
    return disabled || formContext.checkConditions(disableConditionsArray);
  };
  
  // Validate field (memoized to prevent infinite re-renders)
  const validateInput = useCallback((value) => {
    if (!isPreview || !formContext || validationRulesArray.length === 0) {
      return;
    }
    
    const error = formContext.validateField(name, value, validationRulesArray);
    if (error) {
      setValidationError(error);
      formContext.setFieldError(name, error);
    } else {
      setValidationError('');
      formContext.clearFieldError(name);
    }
  }, [isPreview, formContext, validationRulesArray, name]);
  
  // Update form context when value changes
  useEffect(() => {
    if (isPreview && formContext && name) {
      formContext.updateField(name, localValue);
      validateInput(localValue);
    }
  }, [localValue, isPreview, formContext, name, validateInput]);

  // In preview mode, inputs should be interactive; in builder mode, they should be readonly
  const handleChange = (e) => {
    const newValue = e.target.value;
    
    if (isPreview) {
      setLocalValue(newValue);
      if (formContext && name) {
        formContext.updateField(name, newValue);
        validateInput(newValue);
      }
    }
    if (onChange) {
      onChange(e);
    }
  };
  // Handle different input types that might need special rendering
  const renderInput = () => {
    // Check visibility first
    if (!shouldShow()) {
      return null;
    }
    
    const isFieldDisabled = shouldDisable();
    
    // Base props that apply to all input types
    const baseProps = {
      placeholder,
      onChange: handleChange,
      required,
      disabled: isFieldDisabled,
      readOnly: readonly || !isPreview, // Readonly in builder mode, interactive in preview mode
      name: name || id,
      id,
      className: `ui-input ${isFieldDisabled ? 'ui-input--disabled' : ''} ${validationError ? 'ui-input--error' : ''}`,
      style: style, // Apply the style to the input element itself
      ...props
    };

    // Handle value based on input type
    const currentValue = isPreview ? localValue : (initialValue || '');
    
    if (type === 'checkbox') {
      baseProps.checked = Boolean(currentValue);
    } else if (type === 'radio') {
      baseProps.checked = currentValue === placeholder; // For radio, check if value matches the option
    } else {
      baseProps.value = currentValue;
    }

    // Set the type
    if (type !== 'textarea' && type !== 'select') {
      baseProps.type = type;
    }

    // Additional props that only apply to specific input types
    const numericTypes = ['number', 'range', 'date', 'datetime-local', 'month', 'week', 'time'];
    const textTypes = ['text', 'email', 'password', 'tel', 'url', 'search', 'textarea'];
    
    // Add numeric constraints only for numeric/date types
    if (numericTypes.includes(type)) {
      if (min !== undefined && min !== '' && min !== null) {
        baseProps.min = type === 'number' || type === 'range' ? Number(min) : min;
      }
      if (max !== undefined && max !== '' && max !== null) {
        baseProps.max = type === 'number' || type === 'range' ? Number(max) : max;
      }
      if (step !== undefined && step !== '' && step !== null) {
        baseProps.step = type === 'number' || type === 'range' ? Number(step) : step;
      }
    }
    
    // Add text constraints only for text types
    if (textTypes.includes(type)) {
      if (maxLength !== undefined && maxLength !== '' && maxLength !== null) {
        baseProps.maxLength = Number(maxLength);
      }
      if (minLength !== undefined && minLength !== '' && minLength !== null) {
        baseProps.minLength = Number(minLength);
      }
      if (pattern !== undefined && pattern !== '') {
        baseProps.pattern = pattern;
      }
    }
    
    // Add file-specific props only for file type
    if (type === 'file') {
      if (multiple !== undefined) baseProps.multiple = multiple;
      if (accept !== undefined && accept !== '') baseProps.accept = accept;
    }

    // For certain input types, we might need special handling
    switch (type) {
      case 'textarea':
        return (
          <textarea
            placeholder={baseProps.placeholder}
            value={currentValue}
            onChange={baseProps.onChange}
            required={baseProps.required}
            disabled={baseProps.disabled}
            readOnly={baseProps.readOnly}
            maxLength={baseProps.maxLength}
            minLength={baseProps.minLength}
            name={baseProps.name}
            id={baseProps.id}
            style={baseProps.style}
            className={`ui-textarea ${isFieldDisabled ? 'ui-textarea--disabled' : ''} ${validationError ? 'ui-textarea--error' : ''}`}
          />
        );
      case 'select':
        return (
          <select
            {...baseProps}
            className={`ui-select ${disabled ? 'ui-select--disabled' : ''}`}
          >
            <option value="">Select an option</option>
            {/* Options would be passed as children or options prop */}
          </select>
        );
      case 'radio':
      case 'checkbox':
        return (
          <div className="ui-input-group">
            <input 
              type={baseProps.type}
              value={currentValue}
              onChange={baseProps.onChange}
              required={baseProps.required}
              disabled={baseProps.disabled}
              name={baseProps.name}
              id={baseProps.id}
              className={baseProps.className}
            />
            <label htmlFor={id} className="ui-input-inline-label">
              {placeholder || label}
            </label>
          </div>
        );
      default:
        return <input {...baseProps} />;
    }
  };

  const inputContent = renderInput();
  
  // If input should not be shown, return null
  if (!shouldShow()) {
    return null;
  }

  return (
    <div className={`ui-input-container ${type === 'radio' || type === 'checkbox' ? 'ui-input-container--inline' : ''}`}>
      {label && (type !== 'radio' && type !== 'checkbox') && (
        <label htmlFor={id} className="ui-input-label">
          {label}
          {required && <span className="ui-input-required">*</span>}
        </label>
      )}
      {inputContent}
      {validationError && (
        <div className="ui-input-error">
          {validationError}
        </div>
      )}
    </div>
  );
};

export default Input;
