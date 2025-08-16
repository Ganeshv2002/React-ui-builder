import React, { useCallback, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPlay, faTrash, faFileCode, faCube, faDownload } from '@fortawesome/free-solid-svg-icons';
import ComponentPalette from '../ComponentPalette/ComponentPalette';
import Canvas from '../Canvas/Canvas';
import PropertiesPanel from '../PropertiesPanel/PropertiesPanel';
import CodeViewer from '../CodeViewer/CodeViewer';
import PageManager from '../PageManager/PageManager';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';
import { NotificationSystem, useNotifications } from '../NotificationSystem/NotificationSystem';
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS } from '../../utils/keyboard';
import { PageProvider, usePages } from '../../contexts/PageContext';
import { componentDefinitions } from '../../data/componentDefinitions';
import './UIBuilder.css';

const UIBuilderContent = () => {
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [showCodeViewer, setShowCodeViewer] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const notifications = useNotifications();
  const { getCurrentPage, updatePageLayout } = usePages();
  
  const currentPage = getCurrentPage();
  const layout = currentPage?.layout || [];

  const handleLayoutChange = useCallback((newLayout) => {
    const page = getCurrentPage();
    if (page) {
      updatePageLayout(page.id, newLayout);
    }
  }, [getCurrentPage, updatePageLayout]);

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

  const handleSelectComponent = useCallback((component) => {
    setSelectedComponent(component);
  }, []);

  const handleUpdateComponent = useCallback((componentId, updates) => {
    const updateComponent = (components) => {
      return components.map(component => {
        if (component.id === componentId) {
          return { ...component, ...updates };
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
    
    const currentPage = getCurrentPage();
    if (currentPage) {
      const newLayout = updateComponent(currentPage.layout || []);
      updatePageLayout(currentPage.id, newLayout);
    }
    
    // Update selectedComponent only if it's the one being updated
    setSelectedComponent(prevSelected => {
      if (prevSelected?.id === componentId) {
        return { ...prevSelected, ...updates };
      }
      return prevSelected;
    });
  }, [getCurrentPage, updatePageLayout]);

  const clearLayout = () => {
    const currentPage = getCurrentPage();
    if (currentPage) {
      updatePageLayout(currentPage.id, []);
    }
    setSelectedComponent(null);
    notifications.success('Canvas cleared successfully');
  };

  const exportCode = useCallback(() => {
    setShowCodeViewer(true);
    notifications.success('Code exported successfully');
  }, [notifications]);

  return (
    <div className="ui-builder">
      <header className="ui-builder-header">
        <div className="header-left">
          <h1><FontAwesomeIcon icon={faCube} /> React UI Builder</h1>
          <span className="version-badge">v1.0</span>
          <div className="page-info">
            <span>Editing: <strong>{currentPage?.name || 'No Page'}</strong></span>
            <code>{currentPage?.path || '/'}</code>
          </div>
        </div>
        <div className="header-controls">
          <ThemeToggle />
          {/* <div className="control-group"> */}
            <button 
              className={`btn btn-primary`}
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              disabled={layout.length === 0 && !isPreviewMode}
              title={isPreviewMode ? 'Exit Preview Mode' : 'Preview Mode - Test your layout'}
            >
              <FontAwesomeIcon icon={isPreviewMode ? faEdit : faPlay} /> {isPreviewMode ? 'Edit' : 'Preview'}
            </button>
            <button 
              className="btn btn-primary"
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
              <FontAwesomeIcon icon={faDownload} /> Export
            </button>
          {/* </div> */}
        </div>
      </header>

      <div className="ui-builder-content">
        <PageManager />
        
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
  );
};

const UIBuilder = () => {
  return (
    <PageProvider>
      <DndProvider backend={HTML5Backend}>
        <UIBuilderContent />
      </DndProvider>
    </PageProvider>
  );
};

export default UIBuilder;
