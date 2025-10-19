/**
 * Full App Generator - Creates complete React apps with routing and all pages
 * For "Download Setup" functionality
 */

import { generateReactCode, generateCSSCode } from './codeGenerator';
import { generateAllComponents } from './componentTemplates';

// Generate React Router setup
export const generateRouterSetup = (pages) => {
  const imports = `import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';`;

  const pageImports = pages.map(page => 
    `import ${page.name.replace(/\s+/g, '')}Page from './pages/${page.name.replace(/\s+/g, '')}Page';`
  ).join('\n');

  const routes = pages.map(page => 
    `        <Route path="${page.path}" element={<${page.name.replace(/\s+/g, '')}Page />} />`
  ).join('\n');

  const homePage = pages.find(p => p.isHome);
  const homeRedirect = homePage && homePage.path !== '/' ? 
    `        <Route path="/" element={<Navigate to="${homePage.path}" replace />} />` : '';

  return `${imports}
${pageImports}

const App = () => {
  return (
    <Router>
      <Routes>
${routes}
${homeRedirect}
        <Route path="*" element={<Navigate to="${homePage?.path || '/'}" replace />} />
      </Routes>
    </Router>
  );
};

export default App;`;
};

// Generate individual page component
export const generatePageComponent = (page) => {
  const pageName = page.name.replace(/\s+/g, '');
  
  if (!page.layout || page.layout.length === 0) {
    return `import React from 'react';
import '../styles/${pageName}Page.css';

const ${pageName}Page = () => {
  return (
    <div className="${pageName.toLowerCase()}-page">
      <h1>Welcome to ${page.name}</h1>
      <p>This page is empty. Add some components in the UI builder to see them here.</p>
    </div>
  );
};

export default ${pageName}Page;`;
  }

  // Generate the component code for this page
  const generateComponentCode = (component, depth = 2) => {
    const indent = '  '.repeat(depth);
    const componentName = component.type.charAt(0).toUpperCase() + component.type.slice(1);
    
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
        return `${indent}<${componentName}${propsString} />`;
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

  const componentCode = page.layout.map(component => generateComponentCode(component, 2)).join('\n');
  
  // Collect unique component types for imports
  const imports = new Set();
  const collectImports = (component) => {
    imports.add(component.type);
    if (component.children && Array.isArray(component.children)) {
      component.children.forEach(collectImports);
    }
  };
  page.layout.forEach(collectImports);
  
  const importStatements = Array.from(imports)
    .map(comp => `import ${comp.charAt(0).toUpperCase() + comp.slice(1)} from '../components/${comp.charAt(0).toUpperCase() + comp.slice(1)}/${comp.charAt(0).toUpperCase() + comp.slice(1)}';`)
    .join('\n');

  return `import React from 'react';
${importStatements}
import '../styles/${pageName}Page.css';

const ${pageName}Page = () => {
  return (
    <div className="${pageName.toLowerCase()}-page">
${componentCode}
    </div>
  );
};

export default ${pageName}Page;`;
};

// Generate page-specific CSS
export const generatePageCSS = (page) => {
  const pageName = page.name.replace(/\s+/g, '');
  const baseCss = generateCSSCode();
  
  return `.${pageName.toLowerCase()}-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

.${pageName.toLowerCase()}-page > * {
  margin-bottom: 16px;
}

.${pageName.toLowerCase()}-page > *:last-child {
  margin-bottom: 0;
}

/* Responsive layout */
@media (max-width: 768px) {
  .${pageName.toLowerCase()}-page {
    padding: 16px;
  }
}

/* Print styles */
@media print {
  .${pageName.toLowerCase()}-page {
    padding: 0;
    max-width: none;
    margin: 0;
  }
}`;
};

// Generate package.json for full app
export const generateFullAppPackageJson = () => {
  return {
    name: "generated-react-app",
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview",
      lint: "eslint src --ext js,jsx --report-unused-disable-directives --max-warnings 0"
    },
    dependencies: {
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "react-router-dom": "^6.8.1",
      "@fortawesome/react-fontawesome": "^0.2.0",
      "@fortawesome/free-solid-svg-icons": "^6.4.0",
      "@fortawesome/fontawesome-svg-core": "^6.4.0"
    },
    devDependencies: {
      "@types/react": "^18.0.28",
      "@types/react-dom": "^18.0.11",
      "@vitejs/plugin-react": "^4.0.0",
      "eslint": "^8.38.0",
      "eslint-plugin-react": "^7.32.2",
      "eslint-plugin-react-hooks": "^4.6.0",
      "eslint-plugin-react-refresh": "^0.3.4",
      "vite": "^4.3.0"
    }
  };
};

// Generate vite.config.js
export const generateViteConfig = () => {
  return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})`;
};

// Generate index.html
export const generateIndexHtml = () => {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Generated React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;
};

// Generate main.jsx
export const generateMainJsx = () => {
  return `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;
};

// Generate global CSS
export const generateGlobalCSS = () => {
  return `* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  line-height: 1.6;
  color: #333;
}

#root {
  min-height: 100vh;
}

/* Common component styles */
.btn {
  display: inline-block;
  padding: 8px 16px;
  margin: 4px;
  border: none;
  border-radius: 4px;
  background: #007bff;
  color: white;
  text-decoration: none;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
}

.btn-secondary:hover {
  background: #545b62;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
}

.card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.container.vertical {
  flex-direction: column;
}

.container.horizontal {
  flex-direction: row;
}`;
};

// Generate README.md
export const generateReadme = (pages) => {
  const pageList = pages.map(page => `- **${page.name}** - \`${page.path}\``).join('\n');
  
  return `# Generated React App

This is a React application generated by the React UI Builder.

## Pages

${pageList}

## Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Extract the downloaded files
2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open your browser and navigate to \`http://localhost:3000\`

## Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run preview\` - Preview production build
- \`npm run lint\` - Run ESLint

## Project Structure

\`\`\`
src/
├── components/     # Reusable UI components (organized in folders)
│   ├── Button/     # Button component
│   │   ├── Button.jsx
│   │   └── Button.css
│   ├── Input/      # Input component
│   │   ├── Input.jsx
│   │   └── Input.css
│   └── ...         # Other components
├── pages/         # Page components
├── styles/        # CSS files
├── App.jsx        # Main app with routing
├── main.jsx       # React entry point
└── index.css      # Global styles
\`\`\`

## Customization

You can customize this app by:
- Editing page components in \`src/pages/\`
- Modifying styles in \`src/styles/\`
- Adding new routes in \`src/App.jsx\`
- Creating new components in \`src/components/\` (each in its own folder)

## Deployment

To deploy this app:

1. Build the project:
\`\`\`bash
npm run build
\`\`\`

2. Upload the \`dist\` folder to your hosting provider

## Built With

- React 18
- React Router
- Vite
- Font Awesome Icons

Generated with ❤️ by React UI Builder
`;
};

// Main function to generate complete app
export const generateCompleteApp = (pages) => {
  const files = {};
  
  // Root files
  files['package.json'] = JSON.stringify(generateFullAppPackageJson(), null, 2);
  files['vite.config.js'] = generateViteConfig();
  files['index.html'] = generateIndexHtml();
  files['README.md'] = generateReadme(pages);
  
  // Source files
  files['src/main.jsx'] = generateMainJsx();
  files['src/App.jsx'] = generateRouterSetup(pages);
  files['src/index.css'] = generateGlobalCSS();
  
  // Generate page components and styles
  pages.forEach(page => {
    const pageName = page.name.replace(/\s+/g, '');
    files[`src/pages/${pageName}Page.jsx`] = generatePageComponent(page);
    files[`src/styles/${pageName}Page.css`] = generatePageCSS(page);
  });
  
  // Add all component templates
  const componentFiles = generateAllComponents();
  Object.assign(files, componentFiles);
  
  return files;
};
