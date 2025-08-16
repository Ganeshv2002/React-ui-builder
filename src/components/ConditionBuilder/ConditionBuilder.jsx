import React, { useState } from 'react';
import './ConditionBuilder.css';

const ConditionBuilder = ({ 
  conditions = [], 
  onChange, 
  title = "Conditions",
  availableFields = [] 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const addCondition = () => {
    const newCondition = {
      field: '',
      operator: 'equals',
      value: ''
    };
    onChange([...conditions, newCondition]);
  };

  const updateCondition = (index, field, value) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    onChange(newConditions);
  };

  const removeCondition = (index) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    onChange(newConditions);
  };

  const getValuePlaceholder = (operator) => {
    switch (operator) {
      case 'in':
      case 'not_in':
        return '["value1", "value2"] or value1, value2';
      case 'array_contains':
        return '["item1", "item2"] or item1, item2';
      case 'equals':
      case 'not_equals':
        return '"single_value" or ["val1", "val2"] or {"key": "value"}';
      case 'array_length_equals':
      case 'array_length_greater':
      case 'array_length_less':
        return '3';
      default:
        return 'value1, value2 or ["val1", "val2"]';
    }
  };

  const getValueHelp = (operator) => {
    switch (operator) {
      case 'in':
      case 'not_in':
        return 'Check if field value is in this array';
      case 'array_contains':
        return 'Check if field array contains any of these values';
      case 'equals':
      case 'not_equals':
        return 'Multiple values: field matches ANY of these values';
      case 'array_length_equals':
      case 'array_length_greater':
      case 'array_length_less':
        return 'Check array length (single number)';
      default:
        return 'Multiple values supported - field matches ANY value';
    }
  };

  const operators = [
    { value: 'equals', label: 'Equals (any of values)' },
    { value: 'not_equals', label: 'Not Equals (any of values)' },
    { value: 'contains', label: 'Contains (any of values)' },
    { value: 'greater_than', label: 'Greater Than (any of values)' },
    { value: 'less_than', label: 'Less Than (any of values)' },
    { value: 'in', label: 'In Array (any of values)' },
    { value: 'not_in', label: 'Not In Array (any of values)' },
    { value: 'array_contains', label: 'Array Contains (any of values)' },
    { value: 'array_length_equals', label: 'Array Length Equals' },
    { value: 'array_length_greater', label: 'Array Length Greater Than' },
    { value: 'array_length_less', label: 'Array Length Less Than' },
    { value: 'not_empty', label: 'Not Empty' },
    { value: 'empty', label: 'Empty' }
  ];

  return (
    <div className="condition-builder">
      <div 
        className="condition-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span>{title}</span>
        <span className={`toggle ${isExpanded ? 'expanded' : ''}`}>▼</span>
      </div>
      
      {isExpanded && (
        <div className="condition-content">
          {conditions.map((condition, index) => (
            <div key={index} className="condition-row">
              <select
                value={condition.field}
                onChange={(e) => updateCondition(index, 'field', e.target.value)}
                className="condition-field"
              >
                <option value="">Select Field</option>
                {availableFields.map(field => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
              
              <select
                value={condition.operator}
                onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                className="condition-operator"
              >
                {operators.map(op => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
              
              {!['not_empty', 'empty'].includes(condition.operator) && (
                <div className="condition-value-container">
                  <textarea
                    value={typeof condition.value === 'object' 
                      ? JSON.stringify(condition.value, null, 2) 
                      : (Array.isArray(condition.value) 
                          ? condition.value.join(', ')
                          : condition.value)}
                    onChange={(e) => {
                      let newValue = e.target.value;
                      
                      // Try to parse as JSON first (for objects/arrays)
                      try {
                        const parsed = JSON.parse(newValue);
                        updateCondition(index, 'value', parsed);
                      } catch {
                        // If not valid JSON, treat as comma-separated values for arrays
                        if (newValue.includes(',')) {
                          const arrayValue = newValue.split(',').map(v => v.trim()).filter(v => v !== '');
                          updateCondition(index, 'value', arrayValue);
                        } else {
                          // Single value
                          updateCondition(index, 'value', newValue);
                        }
                      }
                    }}
                    placeholder={getValuePlaceholder(condition.operator)}
                    className="condition-value"
                    rows="2"
                  />
                  <small className="value-help">
                    {getValueHelp(condition.operator)}
                  </small>
                </div>
              )}
              
              <button
                onClick={() => removeCondition(index)}
                className="remove-condition"
                type="button"
              >
                ×
              </button>
            </div>
          ))}
          
          <button
            onClick={addCondition}
            className="add-condition"
            type="button"
          >
            + Add Condition
          </button>
        </div>
      )}
    </div>
  );
};

export default ConditionBuilder;
