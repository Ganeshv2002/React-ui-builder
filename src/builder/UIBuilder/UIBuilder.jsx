import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { v4 as uuidv4 } from 'uuid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCube,
  faRotateLeft,
  faRotateRight,
  faDesktop,
  faTabletScreenButton,
  faMobileScreen,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus,
  faMaximize,
  faLayerGroup,
  faCode,
  faTrash,
  faPlay,
  faDownload,
  faRulerCombined,
} from '@fortawesome/free-solid-svg-icons';
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
import { ZOOM_LEVELS, MIN_ZOOM_PERCENT, MAX_ZOOM_PERCENT } from '../constants/zoomLevels';
import './UIBuilder.css';

ensureComponentRegistry();

const clampWidth = (value, min, max) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return min;
  }
  return Math.min(Math.max(Math.round(value), min), max);
};

const dimensionPresets = [
  { id: 'desktop', label: 'Desktop', width: 1440, height: 900, icon: faDesktop },
  { id: 'tablet', label: 'Tablet', width: 1024, height: 768, icon: faTabletScreenButton },
  { id: 'mobile', label: 'Mobile', width: 375, height: 667, icon: faMobileScreen },
];

const zoomLevels = ZOOM_LEVELS;

const createComponentInstance = (definition) => ({
  id: uuidv4(),
  type: definition.id,
  props: { ...(definition.defaultProps || {}) },
  children: definition.canContainChildren ? [] : undefined,
});

const UIBuilderContent = () => {
  const notifications = useNotifications();
  const {
    pages,
    currentPageId,
    setCurrentPageId,
    getCurrentPage,
    updatePageLayout,
    undoPageLayout,
    redoPageLayout,
    layoutHistory,
  } = usePages();

  const [activeSidebarTab, setActiveSidebarTab] = useState('pages');
  const [isLayersPanelVisible, setLayersPanelVisible] = useState(false);
  const [componentSearch, setComponentSearch] = useState('');
  const [paletteWidth, setPaletteWidth] = useState(300);
  const [propertiesWidth, setPropertiesWidth] = useState(320);

  const selectedIds = useEditorStore((state) => {
    if (Array.isArray(state.selectedComponentIds) && state.selectedComponentIds.length > 0) {
      return state.selectedComponentIds;
    }
    return state.selectedComponentId ? [state.selectedComponentId] : [];
  });
  const primarySelectedId = selectedIds[0] ?? null;

  const selectComponent = useEditorStore((state) => state.selectComponent);
  const toggleComponentSelection = useEditorStore((state) => state.toggleComponentSelection);
  const clearSelection = useEditorStore((state) => state.clearSelection);
  const isPreviewMode = useEditorStore((state) => state.isPreviewMode);
  const setPreviewMode = useEditorStore((state) => state.setPreviewMode);
  const isCodeViewerVisible = useEditorStore((state) => state.isCodeViewerVisible);
  const openCodeViewer = useEditorStore((state) => state.openCodeViewer);
  const closeCodeViewer = useEditorStore((state) => state.closeCodeViewer);
  const addCustomComponent = useEditorStore((state) => state.addCustomComponent);
  const customComponents = useEditorStore((state) => state.customComponents);
  const canvasDimensions = useEditorStore((state) => state.canvasDimensions);
  const setCanvasDimensions = useEditorStore((state) => state.setCanvasDimensions);
  const canvasZoom = useEditorStore((state) => state.canvasZoom);
  const setCanvasZoom = useEditorStore((state) => state.setCanvasZoom);
  const zoomCanvasIn = useEditorStore((state) => state.zoomCanvasIn);
  const zoomCanvasOut = useEditorStore((state) => state.zoomCanvasOut);

  const zoomValue = Math.round(canvasZoom * 100);
  const [zoomInputValue, setZoomInputValue] = useState(() => String(zoomValue));

  useEffect(() => {
    setZoomInputValue(String(zoomValue));
  }, [zoomValue]);

  const currentPage = getCurrentPage();
  const layout = currentPage?.layout || [];

  const historyEntry = layoutHistory[currentPageId] ?? { stack: [], pointer: -1 };
  const canUndo = historyEntry.pointer > 0;
  const canRedo =
    historyEntry.pointer >= 0 && historyEntry.pointer < historyEntry.stack.length - 1;

  const availableComponents = useMemo(() => getComponentDefinitions(), [customComponents]);

  const filteredComponents = useMemo(() => {
    if (!componentSearch.trim()) {
      return availableComponents;
    }
    const term = componentSearch.trim().toLowerCase();
    return availableComponents.filter((component) => {
      const name = component.name?.toLowerCase() ?? '';
      const category = component.category?.toLowerCase() ?? '';
      return name.includes(term) || category.includes(term);
    });
  }, [availableComponents, componentSearch]);

  const handlePaletteWidthChange = useCallback((nextWidth) => {
    setPaletteWidth((prev) => {
      const clamped = clampWidth(nextWidth, 260, 420);
      return prev === clamped ? prev : clamped;
    });
  }, []);

  const handlePropertiesWidthChange = useCallback((nextWidth) => {
    setPropertiesWidth((prev) => {
      const clamped = clampWidth(nextWidth, 260, 520);
      return prev === clamped ? prev : clamped;
    });
  }, []);

  const gridTemplateColumns = useMemo(() => {
    const columns = [`${paletteWidth}px`];
    if (isLayersPanelVisible) {
      columns.push('240px');
    }
    columns.push('minmax(0, 1fr)', `${propertiesWidth}px`);
    return columns.join(' ');
  }, [isLayersPanelVisible, paletteWidth, propertiesWidth]);

  const builderGridStyle = useMemo(
    () => ({ '--grid-template-columns': gridTemplateColumns }),
    [gridTemplateColumns],
  );

  const selectedComponent = useMemo(
    () => findComponentById(layout, primarySelectedId),
    [layout, primarySelectedId],
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
            return {
              ...component,
              children: updateComponentTree(component.children),
            };
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

  const handleClearLayout = useCallback(() => {
    const page = getCurrentPage();
    if (page) {
      updatePageLayout(page.id, []);
    }
    clearSelection();
    notifications.success('Canvas cleared successfully');
  }, [clearSelection, getCurrentPage, notifications, updatePageLayout]);

  const handleExport = useCallback(() => {
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

  const handleUndo = useCallback(() => {
    if (!currentPage?.id || !canUndo) {
      return;
    }
    undoPageLayout(currentPage.id);
    notifications.info('Reverted to previous layout state');
  }, [canUndo, currentPage?.id, notifications, undoPageLayout]);

  const handleRedo = useCallback(() => {
    if (!currentPage?.id || !canRedo) {
      return;
    }
    redoPageLayout(currentPage.id);
    notifications.info('Restored next layout state');
  }, [canRedo, currentPage?.id, notifications, redoPageLayout]);

  const handleDevicePreset = useCallback(
    (preset) => {
      setCanvasDimensions({ width: preset.width, height: preset.height });
    },
    [setCanvasDimensions],
  );

  const handleDimensionPresetChange = useCallback(
    (event) => {
      const value = event.target.value;
      const preset = dimensionPresets.find((item) => `${item.width}x${item.height}` === value);
      if (preset) {
        setCanvasDimensions({ width: preset.width, height: preset.height });
      }
    },
    [setCanvasDimensions],
  );

  const handleCustomDimensionChange = useCallback(
    (dimension, value) => {
      const numeric = Number(value);
      if (Number.isNaN(numeric) || numeric <= 0) {
        return;
      }
      setCanvasDimensions({ ...canvasDimensions, [dimension]: Math.round(numeric) });
    },
    [canvasDimensions, setCanvasDimensions],
  );

  const handleZoomInputChange = useCallback(
    (event) => {
      const { value } = event.target;
      setZoomInputValue(value);

      const numeric = Number(value);
      if (value !== '' && Number.isFinite(numeric) && zoomLevels.includes(numeric)) {
        setCanvasZoom(numeric / 100);
      }
    },
    [setCanvasZoom],
  );

  const commitZoomInput = useCallback(() => {
    const trimmed = zoomInputValue.trim();
    if (trimmed === '') {
      setZoomInputValue(String(zoomValue));
      return;
    }

    const numeric = Number(trimmed);
    if (!Number.isFinite(numeric)) {
      setZoomInputValue(String(zoomValue));
      return;
    }

    setCanvasZoom(numeric / 100);
  }, [setCanvasZoom, zoomInputValue, zoomValue]);

  const handleZoomInputBlur = useCallback(() => {
    commitZoomInput();
  }, [commitZoomInput]);

  const handleZoomInputKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        commitZoomInput();
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        setZoomInputValue(String(zoomValue));
      }
    },
    [commitZoomInput, zoomValue],
  );

  const handleFitToScreen = useCallback(() => {
    setCanvasZoom(1);
  }, [setCanvasZoom]);

  const handleAddComponentFromPalette = useCallback(
    (definitionId) => {
      const definition = availableComponents.find((item) => item.id === definitionId);
      const page = getCurrentPage();
      if (!definition || !page) {
        return;
      }

      const instance = createComponentInstance(definition);
      const nextLayout = [...(page.layout || []), instance];
      updatePageLayout(page.id, nextLayout);
      telemetry.track(TELEMETRY_EVENTS.COMPONENT_ADDED, {
        componentType: definition.id,
        parentId: null,
        index: nextLayout.length - 1,
        source: 'palette-click',
      });
      notifications.success(`${definition.name} added to canvas`);
    },
    [availableComponents, getCurrentPage, notifications, updatePageLayout],
  );

  const renderLayerTree = useCallback(
    (components, depth = 0) =>
      components.map((component) => {
        const isActive = component.id === primarySelectedId;
        const hasChildren = Array.isArray(component.children) && component.children.length > 0;

        return (
          <li key={component.id} className="layer-item">
            <button
              type="button"
              className={`layer-item__button ${isActive ? 'is-active' : ''}`}
              style={{ paddingLeft: depth * 16 + 12 }}
              onClick={() => selectComponent(component.id)}
            >
              <span className="layer-item__bullet" aria-hidden="true" />
              <span className="layer-item__label">{component.name || component.type}</span>
            </button>
            {hasChildren && (
              <ul className="layers-panel__list">{renderLayerTree(component.children, depth + 1)}</ul>
            )}
          </li>
        );
      }),
    [primarySelectedId, selectComponent],
  );

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
          handleExport();
        }
      },
    },
    {
      ...KEYBOARD_SHORTCUTS.CLEAR,
      action: () => {
        if (layout.length > 0) {
          handleClearLayout();
        }
      },
    },
    {
      key: 'z',
      ctrlKey: true,
      action: handleUndo,
      description: 'Undo last action',
    },
    {
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
      action: handleRedo,
      description: 'Redo last action',
    },
  ]);

  const dimensionValue = useMemo(() => {
    const preset = dimensionPresets.find(
      (item) => item.width === canvasDimensions.width && item.height === canvasDimensions.height,
    );
    return preset ? `${preset.width}x${preset.height}` : 'custom';
  }, [canvasDimensions.height, canvasDimensions.width]);

  const activeDeviceId = useMemo(() => {
    const preset = dimensionPresets.find(
      (item) => item.width === canvasDimensions.width && item.height === canvasDimensions.height,
    );
    return preset?.id ?? 'custom';
  }, [canvasDimensions.height, canvasDimensions.width]);

  const totalLayerCount = useMemo(() => countComponents(layout), [layout]);

  const autosaveLabel = 'Autosaved moments ago';

  const handleCanvasSelection = useCallback(
    (componentId, event) => {
      if (!componentId) {
        clearSelection();
        return;
      }

      if (event?.metaKey || event?.ctrlKey) {
        toggleComponentSelection(componentId);
      } else {
        selectComponent(componentId);
      }
    },
    [clearSelection, selectComponent, toggleComponentSelection],
  );

  return (
    <div className="ui-builder">
      <header className="ui-builder-header">
        <div className="header-brand">
          <div className="brand-icon">
            <FontAwesomeIcon icon={faCube} />
          </div>
          <div className="brand-meta">
            <span className="brand-title">React UI Builder</span>
            <span className="brand-badge">BETA</span>
          </div>
          <div className="page-context">
            <span className="page-context__label">Editing</span>
            <select
              value={currentPageId || ''}
              onChange={(event) => {
                setCurrentPageId(event.target.value);
                clearSelection();
              }}
            >
              {pages.map((page) => (
                <option value={page.id} key={page.id}>
                  {page.name}
                </option>
              ))}
            </select>
          </div>
          <span className="autosave-indicator">{autosaveLabel}</span>
        </div>
        <div className="header-controls">
          <div className="control-group">
            <button
              type="button"
              className="icon-button"
              onClick={handleUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <FontAwesomeIcon icon={faRotateLeft} />
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={handleRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
            >
              <FontAwesomeIcon icon={faRotateRight} />
            </button>
            <button
              type="button"
              className={`icon-button ${isLayersPanelVisible ? 'is-active' : ''}`}
              onClick={() => setLayersPanelVisible((value) => !value)}
              title="Toggle layers"
            >
              <FontAwesomeIcon icon={faLayerGroup} />
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={handleExport}
              disabled={layout.length === 0}
              title="View generated code"
            >
              <FontAwesomeIcon icon={faCode} />
            </button>
            <ThemeToggle />
          </div>
          <div className="action-group">
            <button
              type="button"
              className={`header-action header-action--primary ${isPreviewMode ? 'is-active' : ''}`}
              onClick={handlePreviewToggle}
              disabled={layout.length === 0 && !isPreviewMode}
              title={isPreviewMode ? 'Return to editing' : 'Preview layout'}
            >
              <FontAwesomeIcon icon={faPlay} />
              <span>{isPreviewMode ? 'Back to Edit' : 'Preview'}</span>
            </button>
            <button
              type="button"
              className="header-action header-action--ghost"
              onClick={handleClearLayout}
              disabled={layout.length === 0}
              title="Clear canvas"
            >
              <FontAwesomeIcon icon={faTrash} />
              <span>Clear</span>
            </button>
            <button
              type="button"
              className="header-action header-action--outline"
              onClick={handleExport}
              disabled={layout.length === 0}
              title="Export React code"
            >
              <FontAwesomeIcon icon={faDownload} />
              <span>Export</span>
            </button>
          </div>
        </div>
      </header>

      <div className="ui-builder-body" style={builderGridStyle}>
        <aside className="builder-sidebar">
          <div className="sidebar-tabs">
            <button
              type="button"
              className={`sidebar-tab ${activeSidebarTab === 'pages' ? 'is-active' : ''}`}
              onClick={() => setActiveSidebarTab('pages')}
            >
              Pages
            </button>
            <button
              type="button"
              className={`sidebar-tab ${activeSidebarTab === 'components' ? 'is-active' : ''}`}
              onClick={() => setActiveSidebarTab('components')}
            >
              Components
            </button>
          </div>
          <div className="sidebar-content">
            {activeSidebarTab === 'pages' ? (
              <PageManager />
            ) : (
              <ComponentPalette
                components={filteredComponents}
                onAddCustomComponent={handleAddCustomComponent}
                onComponentClick={handleAddComponentFromPalette}
                searchValue={componentSearch}
                onSearchChange={setComponentSearch}
                width={paletteWidth}
                onWidthChange={handlePaletteWidthChange}
              />
            )}
          </div>
        </aside>

        {isLayersPanelVisible && (
          <aside className="layers-panel">
            <div className="layers-panel__header">
              <FontAwesomeIcon icon={faLayerGroup} />
              <span>Layers</span>
              <span className="layers-panel__count">{totalLayerCount}</span>
            </div>
            <div className="layers-panel__body">
              {layout.length === 0 ? (
                <div className="layers-panel__empty">
                  <FontAwesomeIcon icon={faLayerGroup} />
                  <p>No layers yet. Drop components on the canvas to get started.</p>
                </div>
              ) : (
                <ul className="layers-panel__tree">{renderLayerTree(layout)}</ul>
              )}
            </div>
          </aside>
        )}

        <main className="builder-canvas-area">
          <div className="canvas-toolbar">
            <div className="device-switcher">
              {dimensionPresets.map((preset) => (
                <button
                  type="button"
                  key={preset.id}
                  className={`icon-button ${activeDeviceId === preset.id ? 'is-active' : ''}`}
                  onClick={() => handleDevicePreset(preset)}
                  title={preset.label}
                >
                  <FontAwesomeIcon icon={preset.icon} />
                </button>
              ))}
            </div>
            <div className="dimension-select">
              <FontAwesomeIcon icon={faRulerCombined} aria-hidden="true" />
              <select value={dimensionValue} onChange={handleDimensionPresetChange}>
                {dimensionPresets.map((preset) => (
                  <option key={preset.id} value={`${preset.width}x${preset.height}`}>
                    {preset.width} x {preset.height} - {preset.label}
                  </option>
                ))}
                <option value="custom">Custom size</option>
              </select>
              {dimensionValue === 'custom' && (
                <div className="dimension-inputs">
                  <input
                    type="number"
                    min="100"
                    value={canvasDimensions.width}
                    onChange={(event) => handleCustomDimensionChange('width', event.target.value)}
                  />
                  <span>x</span>
                  <input
                    type="number"
                    min="100"
                    value={canvasDimensions.height}
                    onChange={(event) => handleCustomDimensionChange('height', event.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="canvas-zoom">
              <button
                type="button"
                className="icon-button"
                onClick={zoomCanvasOut}
                title="Zoom out (Ctrl+-)"
              >
                <FontAwesomeIcon icon={faMagnifyingGlassMinus} />
              </button>
              <div className="canvas-zoom__field">
                <input
                  type="number"
                  inputMode="decimal"
                  min={MIN_ZOOM_PERCENT}
                  max={MAX_ZOOM_PERCENT}
                  step="1"
                  list="canvas-zoom-options"
                  value={zoomInputValue}
                  onChange={handleZoomInputChange}
                  onBlur={handleZoomInputBlur}
                  onKeyDown={handleZoomInputKeyDown}
                  aria-label="Canvas zoom percentage"
                />
                <span className="canvas-zoom__suffix">%</span>
                {/* <datalist id="canvas-zoom-options">
                  {zoomLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </datalist> */}
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={zoomCanvasIn}
                title="Zoom in (Ctrl+=)"
              >
                <FontAwesomeIcon icon={faMagnifyingGlassPlus} />
              </button>
              <button
                type="button"
                className="icon-button"
                title="Reset zoom"
                onClick={handleFitToScreen}
              >
                <FontAwesomeIcon icon={faMaximize} />
              </button>
            </div>
          </div>

          <div className="canvas-wrapper">
            {isPreviewMode ? (
              <PreviewFrame layout={layout} />
            ) : (
              <Canvas
                layout={layout}
                onLayoutChange={handleLayoutChange}
                selectedComponentId={primarySelectedId}
                onSelectComponent={handleCanvasSelection}
                isPreviewMode={isPreviewMode}
                canvasDimensions={canvasDimensions}
                canvasZoom={canvasZoom}
              />
            )}
          </div>
        </main>

        <aside className="builder-properties">
          <PropertiesPanel
            selectedComponent={selectedComponent}
            onUpdateComponent={handleUpdateComponent}
            components={layout}
            width={propertiesWidth}
            onWidthChange={handlePropertiesWidthChange}
          />
        </aside>
      </div>

      <CodeViewer layout={layout} isVisible={isCodeViewerVisible} onClose={closeCodeViewer} />

      <NotificationSystem
        notifications={notifications.notifications}
        onRemove={notifications.removeNotification}
      />
    </div>
  );
};

const UIBuilder = () => (
  <PageProvider>
    <DndProvider backend={HTML5Backend}>
      <UIBuilderContent />
    </DndProvider>
  </PageProvider>
);

export default UIBuilder;
