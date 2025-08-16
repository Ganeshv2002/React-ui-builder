import React, { useState, useEffect, useRef } from 'react';
import './VisualValidationBuilder.css';

const VisualValidationBuilder = ({ value, onChange, label }) => {
  const [rules, setRules] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse JSON value to rules array on mount/change
  useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value);
        setRules(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setRules([]);
      }
    } else {
      setRules([]);
    }
  }, [value]);

  // Track last emitted serialized value to prevent redundant updates & loops
  const lastEmittedRef = useRef('');
  const isFirstEmissionRef = useRef(true);

  useEffect(() => {
    const jsonValue = rules.length > 0 ? JSON.stringify(rules) : '';
    if (isFirstEmissionRef.current) {
      isFirstEmissionRef.current = false;
      lastEmittedRef.current = jsonValue;
      return;
    }
    if (lastEmittedRef.current !== jsonValue) {
      lastEmittedRef.current = jsonValue;
      onChange(jsonValue);
    }
  }, [rules, onChange]);

  const addRule = () => {
    const newRule = {
      type: 'required',
      message: 'This field is required'
    };
    setRules([...rules, newRule]);
    setIsExpanded(true);
  };

  const updateRule = (index, updates) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], ...updates };
    setRules(updated);
  };

  const removeRule = (index) => {
    const updated = rules.filter((_, i) => i !== index);
    setRules(updated);
  };

  const ruleTypes = [
    { value: 'required', label: 'Required', hasValue: false },
    { value: 'minLength', label: 'Minimum Length', hasValue: true, valueType: 'number' },
    { value: 'maxLength', label: 'Maximum Length', hasValue: true, valueType: 'number' },
    { value: 'min', label: 'Minimum Value', hasValue: true, valueType: 'number' },
    { value: 'max', label: 'Maximum Value', hasValue: true, valueType: 'number' },
    { value: 'pattern', label: 'Pattern (Regex)', hasValue: true, valueType: 'text' },
    { value: 'email', label: 'Email Format', hasValue: false },
    { value: 'url', label: 'URL Format', hasValue: false },
    { value: 'number', label: 'Number Format', hasValue: false },
    { value: 'integer', label: 'Integer Format', hasValue: false },
    { value: 'custom', label: 'Custom Validation', hasValue: true, valueType: 'text' }
  ];

  const getRuleConfig = (type) => {
    return ruleTypes.find(rule => rule.value === type) || ruleTypes[0];
  };

  const getDefaultValue = (type) => {
    const config = getRuleConfig(type);
    if (!config.hasValue) return undefined;
    if (config.valueType === 'number') return '';
    return '';
  };

  const getDefaultMessage = (type) => {
    switch (type) {
      case 'required': return 'This field is required';
      case 'minLength': return 'Must be at least {value} characters';
      case 'maxLength': return 'Must not exceed {value} characters';
      case 'min': return 'Must be at least {value}';
      case 'max': return 'Must not exceed {value}';
      case 'pattern': return 'Invalid format';
      case 'email': return 'Please enter a valid email address';
      case 'url': return 'Please enter a valid URL';
      case 'number': return 'Please enter a valid number';
      case 'integer': return 'Please enter a whole number';
      case 'custom': return 'Validation failed';
      default: return 'Invalid input';
    }
  };

  return (
    <div className="visual-validation-builder">
      <div className="validation-header">
        <label className="validation-label">{label}</label>
        <div className="validation-actions">
          <button
            type="button"
            className="add-rule-btn"
            onClick={addRule}
            title="Add Validation Rule"
          >
            + Add
          </button>
          {rules.length > 0 && (
            <button
              type="button"
              className={`toggle-btn ${isExpanded ? 'expanded' : ''}`}
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? '−' : '+'}
            </button>
          )}
        </div>
      </div>

      {rules.length > 0 && (
        <div className="validation-summary">
          {rules.length} validation rule{rules.length !== 1 ? 's' : ''} defined
        </div>
      )}

      {isExpanded && rules.length > 0 && (
        <div className="rules-list">
          {rules.map((rule, index) => {
            const config = getRuleConfig(rule.type);
            return (
              <div key={index} className="rule-item">
                <div className="rule-row">
                  <div className="rule-type-group">
                    <label className="field-label">Rule Type</label>
                    <select
                      value={rule.type}
                      onChange={(e) => {
                        const newType = e.target.value;
                        const newConfig = getRuleConfig(newType);
                        updateRule(index, {
                          type: newType,
                          value: getDefaultValue(newType),
                          message: getDefaultMessage(newType)
                        });
                      }}
                      className="rule-type-select"
                    >
                      {ruleTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {config.hasValue && (
                    <div className="rule-value-group">
                      <label className="field-label">Value</label>
                      <input
                        type={config.valueType === 'number' ? 'number' : 'text'}
                        value={rule.value || ''}
                        onChange={(e) => updateRule(index, { value: e.target.value })}
                        className="rule-value-input"
                        placeholder="Enter value..."
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    className="remove-rule-btn"
                    onClick={() => removeRule(index)}
                    title="Remove rule"
                  >
                    ×
                  </button>
                </div>

                <div className="rule-message-group">
                  <label className="field-label">Error Message</label>
                  <input
                    type="text"
                    value={rule.message || ''}
                    onChange={(e) => updateRule(index, { message: e.target.value })}
                    className="rule-message-input"
                    placeholder="Error message to display..."
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rules.length === 0 && (
        <div className="no-rules">
          No validation rules defined. Click "Add" to create a rule.
        </div>
      )}
    </div>
  );
};

export default VisualValidationBuilder;
