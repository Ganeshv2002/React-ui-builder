import React, { useState } from 'react';
import { generateReactCode, generateCSSCode, generateCompleteProject } from '../../utils/codeGenerator';
import { generateCompleteApp } from '../../utils/fullAppGenerator';
import { createAndDownloadZip, createProjectStructureFile } from '../../utils/downloadUtils';
import { usePages } from '../../contexts/PageContext';
import './CodeViewer.css';

const CodeViewer = ({ layout, isVisible, onClose }) => {
  const [activeTab, setActiveTab] = useState('jsx');
  const [isDownloading, setIsDownloading] = useState(false);
  const { pages, getCurrentPage } = usePages();
  
  if (!isVisible) return null;
  
  const currentPage = getCurrentPage();
  const project = generateCompleteProject(layout);
  const jsxCode = project['GeneratedLayout.jsx'];
  const cssCode = project['GeneratedLayout.css'];
  const packageJsonCode = project['package.json'];
  
  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      alert('Code copied to clipboard!');
    });
  };

  // Download complete app with all pages and routing
  const downloadCompleteApp = async () => {
    setIsDownloading(true);
    try {
      const appFiles = generateCompleteApp(pages);
      
      // Try to create ZIP first, fallback to text file
      const zipSuccess = await createAndDownloadZip(appFiles, 'react-app-complete.zip');
      
      if (!zipSuccess) {
        // Fallback: Create structured text file
        createProjectStructureFile(appFiles, 'react-app-setup.txt');
        alert('Complete app structure downloaded as text file. Extract and follow the instructions to set up your React app.');
      } else {
        alert('Complete React app downloaded as ZIP file. Extract and run "npm install" to get started.');
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Download just the current page code
  const downloadPageCode = () => {
    const pageInfo = `
# ${currentPage?.name || 'Current Page'} - Code Snippet

## React Component (${currentPage?.name || 'Page'}.jsx)
\`\`\`jsx
${jsxCode}
\`\`\`

## CSS Styles (${currentPage?.name || 'Page'}.css)
\`\`\`css
${cssCode}
\`\`\`

## Package Dependencies
\`\`\`json
${packageJsonCode}
\`\`\`

## Usage Instructions
1. Copy the JSX code into a new React component file
2. Copy the CSS code into a corresponding CSS file
3. Import and use the component in your React app
4. Ensure all dependencies are installed

## Component Files Needed
${project.componentImports.map(comp => `- ${comp}.jsx & ${comp}.css`).join('\n')}

*Note: This is just the code for the current page. For a complete multi-page app, use "Download Complete App".*
`;
    
    const blob = new Blob([pageInfo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPage?.name?.replace(/\s+/g, '-') || 'page'}-code.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="code-viewer-overlay">
      <div className="code-viewer">
        <div className="code-viewer-header">
          <h3>Generated Code - {currentPage?.name || 'Current Page'}</h3>
          <div className="header-actions">
            <button 
              className="download-btn complete-app-btn" 
              onClick={downloadCompleteApp}
              disabled={isDownloading}
              title="Download complete React app with all pages and routing"
            >
              {isDownloading ? 'Creating...' : '📦 Download Complete App'}
            </button>
            <button 
              className="download-btn page-code-btn" 
              onClick={downloadPageCode}
              title="Download code snippet for current page only"
            >
              📄 Download Page Code
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
