import React, { useState } from 'react';
import { generateReactCode, generateCSSCode, generateCompleteProject } from '../utils/codeGenerator';
import './CodeViewer.css';

const CodeViewer = ({ layout, isVisible, onClose }) => {
  const [activeTab, setActiveTab] = useState('jsx');
  
  if (!isVisible) return null;
  
  const project = generateCompleteProject(layout);
  const jsxCode = project['GeneratedLayout.jsx'];
  const cssCode = project['GeneratedLayout.css'];
  const packageJsonCode = project['package.json'];
  
  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      alert('Code copied to clipboard!');
    });
  };

  const downloadProject = () => {
    // Create a downloadable zip-like structure info
    const projectInfo = `
# Generated React Project

## Files to create:

### 1. GeneratedLayout.jsx
${jsxCode}

### 2. GeneratedLayout.css  
${cssCode}

### 3. package.json
${packageJsonCode}

## Component files needed:
${project.componentImports.map(comp => `- components/${comp}.jsx`).join('\n')}

## Setup Instructions:
1. Create a new React project: npx create-vite@latest my-project --template react
2. Replace the generated files with the code above
3. Copy the component files from your UI builder project
4. Run: npm install && npm run dev
`;
    
    const blob = new Blob([projectInfo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-project-setup.txt';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="code-viewer-overlay">
      <div className="code-viewer">
        <div className="code-viewer-header">
          <h3>Generated React Project</h3>
          <div className="header-actions">
            <button className="download-btn" onClick={downloadProject}>
              Download Setup
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>
        
        <div className="code-tabs">
          <button 
            className={`tab ${activeTab === 'jsx' ? 'active' : ''}`}
            onClick={() => setActiveTab('jsx')}
          >
            JSX Component
          </button>
          <button 
            className={`tab ${activeTab === 'css' ? 'active' : ''}`}
            onClick={() => setActiveTab('css')}
          >
            CSS Styles
          </button>
          <button 
            className={`tab ${activeTab === 'package' ? 'active' : ''}`}
            onClick={() => setActiveTab('package')}
          >
            package.json
          </button>
        </div>
        
        <div className="code-content">
          {activeTab === 'jsx' && (
            <div className="code-section">
              <div className="code-header">
                <span>GeneratedLayout.jsx</span>
                <button 
                  className="copy-btn"
                  onClick={() => copyToClipboard(jsxCode)}
                >
                  Copy
                </button>
              </div>
              <pre className="code-block">
                <code>{jsxCode}</code>
              </pre>
            </div>
          )}
          
          {activeTab === 'css' && (
            <div className="code-section">
              <div className="code-header">
                <span>GeneratedLayout.css</span>
                <button 
                  className="copy-btn"
                  onClick={() => copyToClipboard(cssCode)}
                >
                  Copy
                </button>
              </div>
              <pre className="code-block">
                <code>{cssCode}</code>
              </pre>
            </div>
          )}
          
          {activeTab === 'package' && (
            <div className="code-section">
              <div className="code-header">
                <span>package.json</span>
                <button 
                  className="copy-btn"
                  onClick={() => copyToClipboard(packageJsonCode)}
                >
                  Copy
                </button>
              </div>
              <pre className="code-block">
                <code>{packageJsonCode}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeViewer;
