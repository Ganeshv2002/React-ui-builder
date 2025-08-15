import React from 'react';
import { FormProvider } from '../contexts/FormContext';
import { usePages } from '../contexts/PageContext';
import './Form.css';

const Form = ({ 
  method = 'POST',
  action = '',
  targetPageId = '',
  navigateOnSuccess = false,
  onSubmit,
  children,
  style,
  isPreview = false,
  ...props 
}) => {
  const { setCurrentPageId, pages } = usePages();
  const targetPage = pages.find(page => page.id === targetPageId);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isPreview) {
      // In builder mode, don't actually submit
      return;
    }

    // Check form validity first
    const form = e.target;
    if (!form.checkValidity()) {
      form.reportValidity();
      console.log('❌ Form validation failed');
      return;
    }
    
    // Collect all form data
    const formData = new FormData(e.target);
    const formValues = {};
    
    for (let [key, value] of formData.entries()) {
      formValues[key] = value;
    }
    
    console.log('🚀 Form submitted with data:', formValues);
    
    // Handle navigation after successful validation
    const handleSuccessNavigation = () => {
      if (navigateOnSuccess && targetPageId && targetPage) {
        console.log(`🔗 Navigating to page after form success: ${targetPage.name}`);
        setCurrentPageId(targetPageId);
      }
    };
    
    if (onSubmit) {
      onSubmit(formValues);
      handleSuccessNavigation();
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
        handleSuccessNavigation();
      }).catch(error => {
        console.error('❌ Form submission error:', error);
      });
    } else {
      alert('✅ Form submitted successfully!\nData: ' + JSON.stringify(formValues, null, 2));
      handleSuccessNavigation();
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
