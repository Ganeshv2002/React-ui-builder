import React from 'react';

const CustomComponentRenderer = ({ component, props = {}, children }) => {
  if (!component.jsx || !component.css) {
    return <div>Invalid custom component</div>;
  }

  // Create a unique class name for this component
  const componentClassName = `custom-${component.id}`;

  // Inject the CSS styles dynamically
  React.useEffect(() => {
    const styleId = `style-${component.id}`;
    let styleElement = document.getElementById(styleId);
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    // Replace generic class names with our component-specific class
    const processedCSS = component.css.replace(/\.([\w-]+)/g, `.${componentClassName}`);
    styleElement.textContent = processedCSS;

    return () => {
      // Cleanup: remove style when component unmounts
      const element = document.getElementById(styleId);
      if (element) {
        element.remove();
      }
    };
  }, [component.css, component.id, componentClassName]);

  // Process the JSX template
  const processJSX = (jsx, props) => {
    let processedJSX = jsx;
    
    // Replace class names with our component-specific class
    processedJSX = processedJSX.replace(/className="([^"]+)"/g, (match, className) => {
      // Add our component prefix to each class
      const classes = className.split(' ').map(cls => 
        cls.startsWith('custom-') ? cls : `${componentClassName}-${cls}`
      ).join(' ');
      return `className="${classes}"`;
    });

    // Replace prop placeholders with actual values
    Object.keys(props).forEach(prop => {
      const propRegex = new RegExp(`\\{${prop}\\s*\\|\\|\\s*['"]([^'"]+)['"]\\}`, 'g');
      processedJSX = processedJSX.replace(propRegex, props[prop] || '$1');
      
      // Handle simple prop references
      const simplePropRegex = new RegExp(`\\{${prop}\\}`, 'g');
      processedJSX = processedJSX.replace(simplePropRegex, props[prop] || '');
    });

    return processedJSX;
  };

  // Convert JSX string to React elements
  const renderFromJSX = (jsx) => {
    try {
      // This is a simplified JSX parser for basic components
      // In a production app, you'd want to use a proper JSX parser/compiler
      
      // For now, we'll use dangerouslySetInnerHTML as a fallback
      // but this should be replaced with a proper JSX parser
      return (
        <div 
          className={componentClassName}
          dangerouslySetInnerHTML={{ __html: jsx.replace(/<(\w+)/g, '<$1').replace(/className="/g, 'class="') }}
        />
      );
    } catch (error) {
      console.error('Error rendering custom component:', error);
      return <div>Error rendering component</div>;
    }
  };

  const processedJSX = processJSX(component.jsx, props);
  
  return renderFromJSX(processedJSX);
};

export default CustomComponentRenderer;
