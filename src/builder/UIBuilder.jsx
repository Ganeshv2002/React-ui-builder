import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPlay, faTrash, faFileCode, faCube } from '@fortawesome/free-solid-svg-icons';
import ComponentPalette from './ComponentPalette';
import Canvas from './Canvas';
import PropertiesPanel from './PropertiesPanel';
import CodeViewer from './CodeViewer';
import { ThemeToggle } from './ThemeToggle';
import { NotificationSystem, useNotifications } from './NotificationSystem';
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS } from '../utils/keyboard';
import { componentDefinitions } from '../data/componentDefinitions';
import './UIBuilder.css';

const UIBuilder = () => {
  const [layout, setLayout] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [showCodeViewer, setShowCodeViewer] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const notifications = useNotifications();

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...KEYBOARD_SHORTCUTS.PREVIEW,
      action: () => {
        if (layout.length > 0 || isPreviewMode) {
          setIsPreviewMode(!isPreviewMode);
          notifications.info(`${isPreviewMode ? 'Exited' : 'Entered'} preview mode`);
        }
      }
    },
    {
      ...KEYBOARD_SHORTCUTS.EXPORT,
      action: () => {
        if (layout.length > 0) {
          exportCode();
        }
      }
    },
    {
      ...KEYBOARD_SHORTCUTS.CLEAR,
      action: () => {
        if (layout.length > 0) {
          clearLayout();
        }
      }
    }
  ]);

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
    notifications.success('Canvas cleared successfully');
  };

  const exportCode = () => {
    setShowCodeViewer(true);
    notifications.success('Code exported successfully');
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="ui-builder">
        <header className="ui-builder-header">
          <div className="header-left">
            <h1><FontAwesomeIcon icon={faCube} /> React UI Builder</h1>
            <span className="version-badge">v1.0</span>
          </div>
          <div className="header-controls">
            <ThemeToggle />
            <div className="control-group">
              <button 
                className={`btn ${isPreviewMode ? 'btn-secondary' : 'btn-success'}`}
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                disabled={layout.length === 0 && !isPreviewMode}
                title={isPreviewMode ? 'Exit Preview Mode' : 'Preview Mode - Test your layout'}
              >
                <FontAwesomeIcon icon={isPreviewMode ? faEdit : faPlay} /> {isPreviewMode ? 'Edit' : 'Preview'}
              </button>
              <button 
                className="btn btn-secondary"
                onClick={clearLayout}
                disabled={layout.length === 0}
                title="Clear all components from canvas"
              >
                <FontAwesomeIcon icon={faTrash} /> Clear
              </button>
              <button 
                className="btn btn-primary"
                onClick={exportCode}
                disabled={layout.length === 0}
                title="Export React code"
              >
                <FontAwesomeIcon icon={faFileCode} /> Export
              </button>
            </div>
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

        <NotificationSystem
          notifications={notifications.notifications}
          onRemove={notifications.removeNotification}
        />
      </div>
    </DndProvider>
  );
};

export default UIBuilder;
