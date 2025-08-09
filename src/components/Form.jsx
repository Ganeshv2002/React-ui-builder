import React from 'react';
import { FormProvider } from '../contexts/FormContext';
import './Form.css';

const Form = ({ 
  method = 'POST',
  action = '',
  onSubmit,
  children,
  style,
  isPreview = false,
  ...props 
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isPreview) {
      // In builder mode, don't actually submit
      return;
    }
    
    // Collect all form data
    const formData = new FormData(e.target);
    const formValues = {};
    
    for (let [key, value] of formData.entries()) {
      formValues[key] = value;
    }
    
    console.log('🚀 Form submitted with data:', formValues);
    
    if (onSubmit) {
      onSubmit(formValues);
    } else if (action) {
      // If action URL is provided, submit to that URL
      console.log('📡 Submitting form to:', action);
      // In a real app, you would make an HTTP request here
      fetch(action, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formValues)
      }).then(response => {
        console.log('✅ Form submission response:', response);
      }).catch(error => {
        console.error('❌ Form submission error:', error);
      });
    } else {
      alert('✅ Form submitted successfully!\nData: ' + JSON.stringify(formValues, null, 2));
    }
  };

  const formContent = (
    <form 
      className="ui-form"
      style={style}
      method={method}
      action={action}
      onSubmit={handleSubmit}
      {...props}
    >
      {children}
    </form>
  );

  // Wrap with FormProvider only in preview mode for conditional logic
  if (isPreview) {
    return (
      <FormProvider>
        {formContent}
      </FormProvider>
    );
  }

  return formContent;
};

export default Form;
