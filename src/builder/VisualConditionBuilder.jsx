import React, { useState, useEffect } from 'react';
import './VisualConditionBuilder.css';

const VisualConditionBuilder = ({ value, onChange, label, formComponents = [] }) => {
  const [conditions, setConditions] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse JSON value to conditions array on mount/change
  useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value);
        setConditions(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setConditions([]);
      }
    } else {
      setConditions([]);
    }
  }, [value]);

  // Update parent when conditions change
  useEffect(() => {
    const jsonValue = conditions.length > 0 ? JSON.stringify(conditions) : '';
    onChange(jsonValue);
  }, [conditions, onChange]);

  const addCondition = () => {
    const newCondition = {
      field: '',
      operator: 'equals',
      value: '',
      logicalOperator: conditions.length > 0 ? 'AND' : undefined
    };
    setConditions([...conditions, newCondition]);
    setIsExpanded(true);
  };

  const updateCondition = (index, updates) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], ...updates };
    setConditions(updated);
  };

  const removeCondition = (index) => {
    const updated = conditions.filter((_, i) => i !== index);
    // Remove logical operator from first condition if it exists
    if (updated.length > 0 && updated[0].logicalOperator) {
      updated[0] = { ...updated[0] };
      delete updated[0].logicalOperator;
    }
    setConditions(updated);
  };

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Not Contains' },
    { value: 'starts_with', label: 'Starts With' },
    { value: 'ends_with', label: 'Ends With' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'greater_equal', label: 'Greater or Equal' },
    { value: 'less_equal', label: 'Less or Equal' },
    { value: 'array_contains', label: 'Array Contains' },
    { value: 'array_length_equals', label: 'Array Length Equals' },
    { value: 'array_length_greater', label: 'Array Length Greater' }
  ];

  const getFieldOptions = () => {
    // Get all form field names from components
    const fieldNames = formComponents
      .filter(comp => comp.type === 'Input' && comp.props?.name)
      .map(comp => comp.props.name);
    
    return [...new Set(fieldNames)].sort();
  };

  return (
    <div className="visual-condition-builder">
      <div className="condition-header">
        <label className="condition-label">{label}</label>
        <div className="condition-actions">
          <button
            type="button"
            className="add-condition-btn"
            onClick={addCondition}
            title="Add Condition"
          >
            + Add
          </button>
          {conditions.length > 0 && (
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

      {conditions.length > 0 && (
        <div className="condition-summary">
          {conditions.length} condition{conditions.length !== 1 ? 's' : ''} defined
        </div>
      )}

      {isExpanded && conditions.length > 0 && (
        <div className="conditions-list">
          {conditions.map((condition, index) => (
            <div key={index} className="condition-item">
              {index > 0 && (
                <div className="logical-operator">
                  <select
                    value={condition.logicalOperator || 'AND'}
                    onChange={(e) => updateCondition(index, { logicalOperator: e.target.value })}
                    className="logical-select"
                  >
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                  </select>
                </div>
              )}
              
              <div className="condition-row">
                <div className="field-group">
                  <label className="field-label">Field</label>
                  <select
                    value={condition.field}
                    onChange={(e) => updateCondition(index, { field: e.target.value })}
                    className="field-select"
                  >
                    <option value="">Select field...</option>
                    {getFieldOptions().map(fieldName => (
                      <option key={fieldName} value={fieldName}>
                        {fieldName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="operator-group">
                  <label className="field-label">Operator</label>
                  <select
                    value={condition.operator}
                    onChange={(e) => updateCondition(index, { operator: e.target.value })}
                    className="operator-select"
                  >
                    {operators.map(op => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="value-group">
                  <label className="field-label">Value</label>
                  <input
                    type="text"
                    value={condition.value}
                    onChange={(e) => updateCondition(index, { value: e.target.value })}
                    className="value-input"
                    placeholder="Enter value..."
                  />
                </div>

                <button
                  type="button"
                  className="remove-condition-btn"
                  onClick={() => removeCondition(index)}
                  title="Remove condition"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {conditions.length === 0 && (
        <div className="no-conditions">
          No conditions defined. Click "Add" to create a condition.
        </div>
      )}
    </div>
  );
};

export default VisualConditionBuilder;
