export const generateReactCode = (layout) => {
  const imports = new Set();
  let hasForm = false;
  
  const generateComponentCode = (component, depth = 0) => {
    const indent = '  '.repeat(depth);
    const componentName = component.type.charAt(0).toUpperCase() + component.type.slice(1);
    
    // Check if we have a form
    if (component.type === 'form') {
      hasForm = true;
    }
    
    // Add import
    imports.add(componentName);
    
    // Generate props
    const props = Object.entries(component.props || {})
      .filter(([key, value]) => key !== 'children' && value !== undefined && value !== '')
      .map(([key, value]) => {
        if (key === 'style' && typeof value === 'object') {
          return `style={${JSON.stringify(value)}}`;
        }
        if (typeof value === 'string') {
          return `${key}="${value}"`;
        }
        return `${key}={${JSON.stringify(value)}}`;
      });
    
    const propsString = props.length > 0 ? ' ' + props.join(' ') : '';
    
    // Handle children
    if (component.children && Array.isArray(component.children)) {
      if (component.children.length === 0) {
        // Self-closing tag for empty containers
        return `${indent}<${componentName}${propsString}>
${indent}  {/* Add components here */}
${indent}</${componentName}>`;
      }
      
      const childrenCode = component.children
        .map(child => generateComponentCode(child, depth + 1))
        .join('\n');
      
      return `${indent}<${componentName}${propsString}>
${childrenCode}
${indent}</${componentName}>`;
    } else if (component.props.children) {
      // Handle text content
      if (typeof component.props.children === 'string') {
        return `${indent}<${componentName}${propsString}>
${indent}  ${component.props.children}
${indent}</${componentName}>`;
      }
      return `${indent}<${componentName}${propsString}>
${indent}  {${JSON.stringify(component.props.children)}}
${indent}</${componentName}>`;
    }
    
    return `${indent}<${componentName}${propsString} />`;
  };
  
  const componentCode = layout.map(component => generateComponentCode(component, 2)).join('\n');
  
  const importStatements = Array.from(imports)
    .map(comp => `import ${comp} from './components/${comp}';`)
    .join('\n');

  const formHandler = hasForm ? `
  const handleFormSubmit = (formData) => {
    console.log('Form submitted with data:', formData);
    // Add your form submission logic here
    // Example: send to API, validate data, etc.
  };
` : '';
  
  return `import React from 'react';
${importStatements}
import './GeneratedLayout.css';

const GeneratedLayout = () => {${formHandler}
  return (
    <div className="generated-layout">
${componentCode}
    </div>
  );
};

export default GeneratedLayout;`;
};

export const generateComponentImports = (layout) => {
  const imports = new Set();
  
  const collectImports = (component) => {
    imports.add(component.type);
    if (component.children && Array.isArray(component.children)) {
      component.children.forEach(collectImports);
    }
  };
  
  layout.forEach(collectImports);
  return Array.from(imports);
};

export const generateCSSCode = (layout) => {
  return `.generated-layout {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

.generated-layout > * {
  margin-bottom: 16px;
}

.generated-layout > *:last-child {
  margin-bottom: 0;
}

/* Responsive layout */
@media (max-width: 768px) {
  .generated-layout {
    padding: 16px;
  }
}

/* Print styles */
@media print {
  .generated-layout {
    padding: 0;
    max-width: none;
    margin: 0;
  }
}`;
};

export const generateCompleteProject = (layout) => {
  const jsxCode = generateReactCode(layout);
  const cssCode = generateCSSCode(layout);
  const componentImports = generateComponentImports(layout);
  
  // Generate package.json dependencies
  const dependencies = {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  };
  
  const packageJson = {
    name: "generated-layout",
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview"
    },
    dependencies,
    devDependencies: {
      "@vitejs/plugin-react": "^4.0.3",
      "vite": "^4.4.5"
    }
  };
  
  return {
    'GeneratedLayout.jsx': jsxCode,
    'GeneratedLayout.css': cssCode,
    'package.json': JSON.stringify(packageJson, null, 2),
    componentImports
  };
};
