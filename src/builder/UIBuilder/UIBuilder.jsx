import React, { useCallback, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPlay, faTrash, faCube, faDownload } from '@fortawesome/free-solid-svg-icons';
import ComponentPalette from '../ComponentPalette/ComponentPalette';
import Canvas from '../Canvas/Canvas';
import PropertiesPanel from '../PropertiesPanel/PropertiesPanel';
import CodeViewer from '../CodeViewer/CodeViewer';
import PageManager from '../PageManager/PageManager';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';
import { NotificationSystem, useNotifications } from '../NotificationSystem/NotificationSystem';
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS } from '../../utils/keyboard';
import { PageProvider, usePages } from '../../contexts/PageContext';
import useEditorStore from '../../store/editorStore';
import { ensureComponentRegistry, getComponentDefinitions } from '../componentRegistry';
import { findComponentById, countComponents } from '../../utils/layoutTree';
import { telemetry, TELEMETRY_EVENTS } from '../../utils/telemetry';
import PreviewFrame from '../Preview/PreviewFrame';
import './UIBuilder.css';

ensureComponentRegistry();

const UIBuilderContent = () => {
  const notifications = useNotifications();
  const { getCurrentPage, updatePageLayout } = usePages();

  const selectedComponentId = useEditorStore((state) => state.selectedComponentId);
  const isPreviewMode = useEditorStore((state) => state.isPreviewMode);
  const isCodeViewerVisible = useEditorStore((state) => state.isCodeViewerVisible);
  const addCustomComponent = useEditorStore((state) => state.addCustomComponent);
  const selectComponent = useEditorStore((state) => state.selectComponent);
  const clearSelection = useEditorStore((state) => state.clearSelection);
  const setPreviewMode = useEditorStore((state) => state.setPreviewMode);
  const openCodeViewer = useEditorStore((state) => state.openCodeViewer);
  const closeCodeViewer = useEditorStore((state) => state.closeCodeViewer);
  const customComponents = useEditorStore((state) => state.customComponents);

  const currentPage = getCurrentPage();
  const layout = currentPage?.layout || [];

  const availableComponents = useMemo(() => getComponentDefinitions(), [customComponents]);

  const selectedComponent = useMemo(
    () => findComponentById(layout, selectedComponentId),
    [layout, selectedComponentId],
  );

  const handleAddCustomComponent = useCallback(
    (definition) => {
      if (!definition) {
        return;
      }

      addCustomComponent(definition);
      notifications.success(`Custom component "${definition.name}" created successfully!`);
    },
    [addCustomComponent, notifications],
  );

  const handleLayoutChange = useCallback(
    (newLayout) => {
      const page = getCurrentPage();
      if (page) {
        updatePageLayout(page.id, newLayout);
      }
    },
    [getCurrentPage, updatePageLayout],
  );

  const handleUpdateComponent = useCallback(
    (componentId, updates) => {
      const updateComponentTree = (components) =>
        components.map((component) => {
          if (component.id === componentId) {
            return { ...component, ...updates };
          }
          if (Array.isArray(component.children) && component.children.length > 0) {
            return { ...component, children: updateComponentTree(component.children) };
          }
          return component;
        });

      const page = getCurrentPage();
      if (page) {
        const nextLayout = updateComponentTree(page.layout || []);
        updatePageLayout(page.id, nextLayout);
      }
    },
    [getCurrentPage, updatePageLayout],
  );

  const clearLayout = useCallback(() => {
    const page = getCurrentPage();
    if (page) {
      updatePageLayout(page.id, []);
    }
    clearSelection();
    notifications.success('Canvas cleared successfully');
  }, [clearSelection, getCurrentPage, notifications, updatePageLayout]);

  const exportCode = useCallback(() => {
    openCodeViewer();
    telemetry.track(TELEMETRY_EVENTS.CODE_EXPORTED, {
      componentCount: countComponents(layout),
    });
    notifications.success('Code exported successfully');
  }, [layout, notifications, openCodeViewer]);

  const handlePreviewToggle = useCallback(() => {
    const nextMode = !isPreviewMode;
    setPreviewMode(nextMode);
    notifications.info(`${nextMode ? 'Entered' : 'Exited'} preview mode`);
  }, [isPreviewMode, notifications, setPreviewMode]);

  useKeyboardShortcuts([
    {
      ...KEYBOARD_SHORTCUTS.PREVIEW,
      action: () => {
        if (layout.length > 0 || isPreviewMode) {
          handlePreviewToggle();
        }
      },
    },
    {
      ...KEYBOARD_SHORTCUTS.EXPORT,
      action: () => {
        if (layout.length > 0) {
          exportCode();
        }
      },
    },
    {
      ...KEYBOARD_SHORTCUTS.CLEAR,
      action: () => {
        if (layout.length > 0) {
          clearLayout();
        }
      },
    },
  ]);

  return (
    <div className="ui-builder">
      <header className="ui-builder-header">
        <div className="header-left">
          <h1><FontAwesomeIcon icon={faCube} /> React UI Builder</h1>
          <span className="version-badge">v{import.meta.env.VITE_VERSION}</span>
          <div className="page-info">
            <span>Editing: <strong>{currentPage?.name || 'No Page'}</strong></span>
            <code>{currentPage?.path || '/'}</code>
          </div>
        </div>
        <div className="header-controls">
          <ThemeToggle />
          <button
            className="btn btn-primary"
            onClick={handlePreviewToggle}
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
        </div>
      </header>

      <div className="ui-builder-content">
        <PageManager />
        
        {!isPreviewMode && (
          <ComponentPalette components={availableComponents} onAddCustomComponent={handleAddCustomComponent} />
        )}
        
        {isPreviewMode ? (
          <PreviewFrame layout={layout} />
        ) : (
          <Canvas
            layout={layout}
            onLayoutChange={handleLayoutChange}
            selectedComponentId={selectedComponentId}
            onSelectComponent={(id) => {
              if (id) {
                selectComponent(id);
              } else {
                clearSelection();
              }
            }}
          />
        )}
        
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
        isVisible={isCodeViewerVisible}
        onClose={closeCodeViewer}
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
