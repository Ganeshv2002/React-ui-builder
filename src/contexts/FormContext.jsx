import React, { createContext, useContext, useState, useCallback } from 'react';

// Form Context to manage form state and conditional logic
const FormContext = createContext();

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    return null; // Return null if not within a form
  }
  return context;
};

export const FormProvider = ({ children }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const updateField = useCallback((fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Clear error when field is updated
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  }, [errors]);

  const setFieldError = useCallback((fieldName, error) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  }, []);

  const clearFieldError = useCallback((fieldName) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const validateField = useCallback((fieldName, value, validationRules) => {
    if (!validationRules || !Array.isArray(validationRules)) {
      return null;
    }

    for (const rule of validationRules) {
      switch (rule.type) {
        case 'required':
          if (!value || value.toString().trim() === '') {
            return rule.message || 'This field is required';
          }
          break;
        case 'minLength':
          if (value && value.length < rule.value) {
            return rule.message || `Minimum length is ${rule.value}`;
          }
          break;
        case 'maxLength':
          if (value && value.length > rule.value) {
            return rule.message || `Maximum length is ${rule.value}`;
          }
          break;
        case 'pattern':
          if (value && !new RegExp(rule.value).test(value)) {
            return rule.message || 'Invalid format';
          }
          break;
        case 'email':
          if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return rule.message || 'Invalid email format';
          }
          break;
        case 'min':
          if (value && Number(value) < rule.value) {
            return rule.message || `Minimum value is ${rule.value}`;
          }
          break;
        case 'max':
          if (value && Number(value) > rule.value) {
            return rule.message || `Maximum value is ${rule.value}`;
          }
          break;
        default:
          break;
      }
    }
    return null;
  }, []);

  const checkConditions = useCallback((conditions) => {
    if (!conditions || !Array.isArray(conditions)) {
      return false;
    }

    return conditions.some(condition => {
      const fieldValue = formData[condition.field];
      const conditionValue = condition.value;
      
      // Helper function to check if a value matches any of the condition values
      const matchesAnyValue = (testValue, conditionValues) => {
        // If condition value is not an array, convert it to array for uniform handling
        const valuesToCheck = Array.isArray(conditionValues) ? conditionValues : [conditionValues];
        
        return valuesToCheck.some(checkValue => {
          switch (condition.operator) {
            case 'equals':
              // Handle deep equality for objects/arrays
              if (typeof testValue === 'object' && typeof checkValue === 'object') {
                return JSON.stringify(testValue) === JSON.stringify(checkValue);
              }
              return testValue === checkValue;
            case 'not_equals':
              if (typeof testValue === 'object' && typeof checkValue === 'object') {
                return JSON.stringify(testValue) !== JSON.stringify(checkValue);
              }
              return testValue !== checkValue;
            case 'contains':
              if (Array.isArray(testValue)) {
                return testValue.some(item => 
                  typeof item === 'object' 
                    ? JSON.stringify(item).includes(checkValue)
                    : item.toString().includes(checkValue)
                );
              }
              return testValue && testValue.toString().includes(checkValue);
            case 'greater_than':
              return Number(testValue) > Number(checkValue);
            case 'less_than':
              return Number(testValue) < Number(checkValue);
            case 'in':
              // checkValue should be an array for 'in' operator
              const inArray = Array.isArray(checkValue) ? checkValue : [checkValue];
              if (Array.isArray(testValue)) {
                return testValue.some(item => inArray.includes(item));
              }
              return inArray.includes(testValue);
            case 'not_in':
              const notInArray = Array.isArray(checkValue) ? checkValue : [checkValue];
              if (Array.isArray(testValue)) {
                return !testValue.some(item => notInArray.includes(item));
              }
              return !notInArray.includes(testValue);
            case 'array_contains':
              // Check if field value (array) contains any of the condition values
              if (Array.isArray(testValue)) {
                return Array.isArray(checkValue) 
                  ? checkValue.some(val => testValue.includes(val))
                  : testValue.includes(checkValue);
              }
              return false;
            case 'array_length_equals':
              return Array.isArray(testValue) && testValue.length === Number(checkValue);
            case 'array_length_greater':
              return Array.isArray(testValue) && testValue.length > Number(checkValue);
            case 'array_length_less':
              return Array.isArray(testValue) && testValue.length < Number(checkValue);
            default:
              return false;
          }
        });
      };
      
      switch (condition.operator) {
        case 'not_empty':
          if (Array.isArray(fieldValue)) {
            return fieldValue.length > 0;
          }
          if (typeof fieldValue === 'object' && fieldValue !== null) {
            return Object.keys(fieldValue).length > 0;
          }
          return fieldValue && fieldValue.toString().trim() !== '';
        case 'empty':
          if (Array.isArray(fieldValue)) {
            return fieldValue.length === 0;
          }
          if (typeof fieldValue === 'object' && fieldValue !== null) {
            return Object.keys(fieldValue).length === 0;
          }
          return !fieldValue || fieldValue.toString().trim() === '';
        default:
          return matchesAnyValue(fieldValue, conditionValue);
      }
    });
  }, [formData]);

  const value = {
    formData,
    errors,
    updateField,
    setFieldError,
    clearFieldError,
    validateField,
    checkConditions
  };

  return (
    <FormContext.Provider value={value}>
      {children}
    </FormContext.Provider>
  );
};

export default FormContext;
