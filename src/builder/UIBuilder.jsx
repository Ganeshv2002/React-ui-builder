import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ComponentPalette from './ComponentPalette';
import Canvas from './Canvas';
import PropertiesPanel from './PropertiesPanel';
import CodeViewer from './CodeViewer';
import { componentDefinitions } from '../data/componentDefinitions';
import './UIBuilder.css';

const UIBuilder = () => {
  const [layout, setLayout] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [showCodeViewer, setShowCodeViewer] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout);
  };

  const handleSelectComponent = (component) => {
    setSelectedComponent(component);
  };

  const handleUpdateComponent = (componentId, updates) => {
    const updateComponent = (components) => {
      return components.map(component => {
        if (component.id === componentId) {
          const updated = { ...component, ...updates };
          if (component.id === selectedComponent?.id) {
            setSelectedComponent(updated);
          }
          return updated;
        }
        if (component.children) {
          return {
            ...component,
            children: updateComponent(component.children)
          };
        }
        return component;
      });
    };
    
    setLayout(updateComponent(layout));
  };

  const clearLayout = () => {
    setLayout([]);
    setSelectedComponent(null);
  };

  const exportCode = () => {
    setShowCodeViewer(true);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="ui-builder">
        <header className="ui-builder-header">
          <h1>React UI Builder</h1>
          <div className="header-controls">
            <button 
              className={`btn ${isPreviewMode ? 'btn-secondary' : 'btn-success'}`}
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              disabled={layout.length === 0 && !isPreviewMode}
              title={isPreviewMode ? 'Exit Preview Mode' : 'Preview Mode - Test your layout'}
            >
              {isPreviewMode ? '🛠️ Edit' : '▶️ Preview'}
            </button>
            <button 
              className="btn btn-secondary"
              onClick={clearLayout}
              disabled={layout.length === 0}
            >
              Clear
            </button>
            <button 
              className="btn btn-primary"
              onClick={exportCode}
              disabled={layout.length === 0}
            >
              Export Code
            </button>
          </div>
        </header>

        <div className="ui-builder-content">
          {!isPreviewMode && <ComponentPalette components={componentDefinitions} />}
          
          <Canvas
            layout={layout}
            onLayoutChange={handleLayoutChange}
            selectedComponent={selectedComponent}
            onSelectComponent={handleSelectComponent}
            isPreviewMode={isPreviewMode}
          />
          
          {!isPreviewMode && (
            <PropertiesPanel
              selectedComponent={selectedComponent}
              onUpdateComponent={handleUpdateComponent}
              components={layout}
            />
          )}
        </div>

        <CodeViewer
          layout={layout}
          isVisible={showCodeViewer}
          onClose={() => setShowCodeViewer(false)}
        />
      </div>
    </DndProvider>
  );
};

export default UIBuilder;
