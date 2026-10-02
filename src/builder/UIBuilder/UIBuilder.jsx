import React, { useCallback, useEffect, useRef, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { v4 as uuidv4 } from "uuid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCube,
  faRotateLeft,
  faRotateRight,
  faDesktop,
  faTabletScreenButton,
  faMobileScreen,
  faMinus,
  faPlus,
  faExpand,
  faLayerGroup,
  faCode,
  faTrash,
  faShapes,
  faFileLines,
  faChevronRight,
  faCircleQuestion,
} from "@fortawesome/free-solid-svg-icons";
import ComponentPalette from "../ComponentPalette/ComponentPalette";
import Canvas from "../Canvas/Canvas";
import PropertiesPanel from "../PropertiesPanel/PropertiesPanel";
import CodeViewer from "../CodeViewer/CodeViewer";
import PageManager from "../PageManager/PageManager";
import { ThemeToggle } from "../ThemeToggle/ThemeToggle";
import {
  NotificationSystem,
  useNotifications,
} from "../NotificationSystem/NotificationSystem";
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS } from "../../utils/keyboard";
import { usePages } from "../../contexts/PageContext";
import useEditorStore from "../../store/editorStore";
import {
  ensureComponentRegistry,
  getComponentDefinitions,
} from "../componentRegistry";
import { findComponentById, countComponents } from "../../utils/layoutTree";
import PreviewFrame from "../Preview/PreviewFrame";
import { MIN_ZOOM_PERCENT, MAX_ZOOM_PERCENT } from "../constants/zoomLevels";
import { IconPlayerPlay, IconDownload, IconSettings2, IconPalette, IconFolder } from '@tabler/icons-react';
import ProjectPanel from '../ProjectPanel/ProjectPanel';
import { themeVariables } from '../../runtime/theme';
import './UIBuilder.css';
import Brand from '../../ui/Brand';

ensureComponentRegistry();
const DEVICES = [
  {
    id: "desktop",
    label: "Desktop",
    width: 1440,
    height: 900,
    icon: faDesktop,
  },
  {
    id: "tablet",
    label: "Tablet",
    width: 1024,
    height: 768,
    icon: faTabletScreenButton,
  },
  {
    id: "mobile",
    label: "Mobile",
    width: 375,
    height: 667,
    icon: faMobileScreen,
  },
];
const TABS = [
  { id: "components", label: "Insert", icon: faShapes },
  { id: "pages", label: "Pages", icon: faFileLines },
  { id: "layers", label: "Layers", icon: faLayerGroup },
];
function ToolButton({ icon, label, active, children, ...props }) {
  return (
    <button
      type="button"
      className={`editor-tool ${active ? "is-active" : ""}`}
      title={label}
      aria-label={label}
      {...props}
    >
      <FontAwesomeIcon icon={icon} />
      {children}
    </button>
  );
}
function LayerTree({ nodes, selectedId, onSelect }) {
  return (
    <ul className="editor-layer-tree">
      {nodes.map((node) => (
        <li key={node.id}>
          <button
            type="button"
            className={selectedId === node.id ? "is-active" : ""}
            onClick={() => onSelect(node.id)}
          >
            <FontAwesomeIcon icon={node.children ? faLayerGroup : faCube} />
            <span>{node.name || node.type}</span>
            {node.children?.length > 0 && <small>{node.children.length}</small>}
          </button>
          {node.children?.length > 0 && (
            <LayerTree
              nodes={node.children}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
function UIBuilderContent({ onDashboard }) {
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
    saveStatus, theme, exportProject,
  } = usePages();
  const editor = useEditorStore();
  const { clearSelection, canvasDimensions, setCanvasZoom } = editor;
  const [tab, setTab] = useState("components");
  const [search, setSearch] = useState("");
  const [paletteWidth, setPaletteWidth] = useState(280);
  const [propertiesWidth, setPropertiesWidth] = useState(300);
  const [autoFit, setAutoFit] = useState(true);
  const [projectPanel, setProjectPanel] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const viewportRef = useRef(null);
  const helpRef = useRef(null);
  const page = getCurrentPage();
  const layout = page?.layout || [];
  const selectedId = editor.selectedComponentId;
  const selected = findComponentById(layout, selectedId);
  const total = countComponents(layout);
  const history = layoutHistory[currentPageId];
  const canUndo = history?.pointer > 0;
  const canRedo = history?.pointer < history?.stack.length - 1;
  const definitions = getComponentDefinitions();
  const filtered = definitions.filter((item) =>
    `${item.name} ${item.category}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  const device = DEVICES.find(
    (item) =>
      item.width === editor.canvasDimensions.width &&
      item.height === editor.canvasDimensions.height,
  );
  const [zoomText, setZoomText] = useState(
    String(Math.round(editor.canvasZoom * 100)),
  );
  useEffect(
    () => setZoomText(String(Math.round(editor.canvasZoom * 100))),
    [editor.canvasZoom],
  );
  useEffect(() => {
    clearSelection();
  }, [currentPageId, clearSelection]);
  useEffect(() => {
    if (showHelp) helpRef.current?.showModal();
    else helpRef.current?.close();
  }, [showHelp]);
  const fitCanvas = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const { width, height } = canvasDimensions;
    setCanvasZoom(
      Math.min(
        1,
        Math.max(0.1, (viewport.clientWidth - 80) / width),
        Math.max(0.1, (viewport.clientHeight - 96) / height),
      ),
    );
  }, [canvasDimensions, setCanvasZoom]);
  useEffect(() => {
    if (!autoFit || !viewportRef.current) return;
    const observer = new ResizeObserver(fitCanvas);
    observer.observe(viewportRef.current);
    fitCanvas();
    return () => observer.disconnect();
  }, [autoFit, fitCanvas]);
  const changeLayout = useCallback(
    (next) => {
      if (page) updatePageLayout(page.id, next);
    },
    [page, updatePageLayout],
  );
  const updateComponent = (id, updates) => {
    const visit = (nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, ...updates }
          : {
              ...node,
              ...(node.children ? { children: visit(node.children) } : {}),
            },
      );
    changeLayout(visit(layout));
  };
  const insertComponent = (id) => {
    const def = definitions.find((item) => item.id === id);
    if (!def || !page) return;
    const instance = {
      id: uuidv4(),
      type: def.id,
      props: structuredClone(def.defaultProps || {}),
      ...(def.canContainChildren ? { children: [] } : {}),
    };
    changeLayout([...layout, instance]);
    editor.selectComponent(instance.id);
  };
  const undo = () => {
    if (canUndo) undoPageLayout(currentPageId);
  };
  const redo = () => {
    if (canRedo) redoPageLayout(currentPageId);
  };
  const preview = () => {
    if (layout.length || editor.isPreviewMode) editor.togglePreviewMode();
  };
  const exportCode = () => {
    if (layout.length) editor.openCodeViewer();
  };
  const clear = () => {
    changeLayout([]);
    editor.clearSelection();
    notifications.info("Canvas cleared. Use Undo to restore it.");
  };
  useKeyboardShortcuts([
    { ...KEYBOARD_SHORTCUTS.PREVIEW, action: preview },
    { ...KEYBOARD_SHORTCUTS.EXPORT, action: exportCode },
    { key: "z", ctrlKey: true, action: undo, description: "Undo" },
    {
      key: "z",
      ctrlKey: true,
      shiftKey: true,
      action: redo,
      description: "Redo",
    },
    {
      key: "Escape",
      action: () => {
        editor.clearSelection();
        editor.closeCodeViewer();
        if (editor.isPreviewMode) editor.setPreviewMode(false);
      },
      description: "Close preview or selection",
    },
  ]);
  const commitZoom = () => {
    const value = Number(zoomText);
    if (Number.isFinite(value) && value > 0) {
      setAutoFit(false);
      editor.setCanvasZoom(value / 100);
    }
    setZoomText(String(Math.round(useEditorStore.getState().canvasZoom * 100)));
  };
  const statusText =
    saveStatus === "error"
      ? "Could not save locally"
      : saveStatus === "saving"
        ? "Saving…"
        : "Saved in this browser";
  return (
    <div className="ui-builder">
      <header className="editor-header">
        <Brand />
        <div className="editor-project">
          <button className="editor-dashboard-link" onClick={onDashboard}>Projects</button>
          <FontAwesomeIcon icon={faChevronRight} />
          <strong>{page?.name || "Untitled"}</strong>
        </div>
        <div className="editor-header-actions">
          <span
            className={`editor-save editor-save--${saveStatus || "saved"}`}
            role="status"
          >
            <i />
            {statusText}
          </span>
          <button className="editor-button editor-header-project" onClick={() => setProjectPanel('project')}><IconFolder size={17} />Project</button>
          <button className="editor-tool" title="Theme tokens" aria-label="Theme tokens" onClick={() => setProjectPanel('theme')}><IconPalette size={18} /></button>
          <ThemeToggle />
          <button
            type="button"
            className="editor-button"
            onClick={preview}
            disabled={!total && !editor.isPreviewMode}
          >
            <IconPlayerPlay size={16} />
            {editor.isPreviewMode ? "Back to editor" : "Preview"}
          </button>
          <button
            type="button"
            className="editor-button editor-button--primary"
            onClick={() => setProjectPanel("project")}
          >
            <IconDownload size={16} />
            Export
          </button>
        </div>
      </header>
      <div
        className="editor-workspace"
        style={{
          "--palette-width": `${paletteWidth}px`,
          "--inspector-width": `${propertiesWidth}px`,
        }}
      >
        <aside className="editor-sidebar" aria-label="Library and navigation">
          <div className="editor-sidebar-tabs" aria-label="Workspace panels">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={tab === item.id}
                className={tab === item.id ? "is-active" : ""}
                onClick={() => setTab(item.id)}
              >
                <FontAwesomeIcon icon={item.icon} />
                {item.label}
                {item.id === "pages" && <small>{pages.length}</small>}
              </button>
            ))}
          </div>
          <div className="editor-page-picker">
            <FontAwesomeIcon icon={faFileLines} />
            <select
              aria-label="Current page"
              value={currentPageId || ""}
              onChange={(e) => setCurrentPageId(e.target.value)}
            >
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <span>{page?.path}</span>
          </div>
          <div className="editor-sidebar-content">
            {tab === "components" && (
              <ComponentPalette
                components={filtered}
                onAddCustomComponent={(def) => {
                  editor.addCustomComponent(def);
                  notifications.success(`Added ${def.name} to your library`);
                }}
                onComponentClick={insertComponent}
                searchValue={search}
                onSearchChange={setSearch}
                width={paletteWidth}
                onWidthChange={setPaletteWidth}
              />
            )}
            {tab === "pages" && <PageManager />}
            {tab === "layers" && (
              <section className="editor-layers">
                <div className="editor-section-heading">
                  <h2>Layers</h2>
                  <span>{total}</span>
                </div>
                <p>Everything on {page?.name}.</p>
                {total ? (
                  <LayerTree
                    nodes={layout}
                    selectedId={selectedId}
                    onSelect={editor.selectComponent}
                  />
                ) : (
                  <div className="editor-panel-empty">
                    <FontAwesomeIcon icon={faLayerGroup} />
                    <h3>Your page starts here</h3>
                    <p>Add a component to see its place in the layer tree.</p>
                    <button
                      type="button"
                      className="editor-button"
                      onClick={() => setTab("components")}
                    >
                      Browse components
                    </button>
                  </div>
                )}
              </section>
            )}
          </div>
          <div className="editor-sidebar-bottom">
            <button type="button" onClick={() => setShowHelp(true)}>
              <FontAwesomeIcon icon={faCircleQuestion} />
              Quick guide & shortcuts<span>?</span>
            </button>
          </div>
        </aside>
        <main className="editor-main" aria-label="Design canvas">
          <div className="editor-toolbar">
            <div className="editor-tool-group">
              <ToolButton
                icon={faRotateLeft}
                label="Undo (Ctrl+Z)"
                onClick={undo}
                disabled={!canUndo}
              />
              <ToolButton
                icon={faRotateRight}
                label="Redo (Ctrl+Shift+Z)"
                onClick={redo}
                disabled={!canRedo}
              />
            </div>
            <div className="editor-device-group">
              {DEVICES.map((d) => (
                <ToolButton
                  key={d.id}
                  icon={d.icon}
                  label={d.label}
                  active={device?.id === d.id}
                  aria-pressed={device?.id === d.id}
                  onClick={() => {
                    editor.setCanvasDimensions({
                      width: d.width,
                      height: d.height,
                    });
                    setAutoFit(true);
                  }}
                >
                  <span>{d.label}</span>
                </ToolButton>
              ))}
            </div>
            <div className="editor-tool-group editor-zoom">
              <ToolButton
                icon={faMinus}
                label="Zoom out"
                onClick={() => {
                  setAutoFit(false);
                  editor.zoomCanvasOut();
                }}
              />
              <label>
                <input
                  aria-label="Canvas zoom percentage"
                  type="number"
                  min={MIN_ZOOM_PERCENT}
                  max={MAX_ZOOM_PERCENT}
                  value={zoomText}
                  onChange={(e) => setZoomText(e.target.value)}
                  onBlur={commitZoom}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                />
                <span>%</span>
              </label>
              <ToolButton
                icon={faPlus}
                label="Zoom in"
                onClick={() => {
                  setAutoFit(false);
                  editor.zoomCanvasIn();
                }}
              />
              <ToolButton
                icon={faExpand}
                label="Fit canvas to available space"
                active={autoFit}
                onClick={() => {
                  setAutoFit(true);
                  fitCanvas();
                }}
              >
                <span>Fit</span>
              </ToolButton>
            </div>
          </div>
          <div className="editor-canvas-viewport" ref={viewportRef}>
            <div className="editor-artboard-label">
              <span>
                <FontAwesomeIcon icon={faDesktop} />
                {page?.name}{" "}
                <span>
                  /{" "}
                  {editor.isPreviewMode ? "Preview" : device?.label || "Custom"}
                </span>
              </span>
              <span>
                {editor.canvasDimensions.width} ×{" "}
                {editor.canvasDimensions.height}
              </span>
            </div>
            {editor.isPreviewMode ? (
              <PreviewFrame
                layout={layout}
                project={exportProject()}
                currentPageId={currentPageId}
                onNavigate={setCurrentPageId}
                canvasDimensions={editor.canvasDimensions}
                canvasZoom={editor.canvasZoom}
              />
            ) : (
              <Canvas
                layout={layout}
                onLayoutChange={changeLayout}
                selectedComponentId={selectedId}
                onSelectComponent={(id, event) => {
                  if (!id) editor.clearSelection();
                  else if (event?.ctrlKey || event?.metaKey)
                    editor.toggleComponentSelection(id);
                  else editor.selectComponent(id);
                }}
                canvasDimensions={editor.canvasDimensions}
                canvasZoom={editor.canvasZoom}
                onQuickAdd={() => insertComponent("container")}
                themeStyle={themeVariables(theme)}
              />
            )}
          </div>
          <div className="editor-canvas-footer">
            <span>
              <i />
              {editor.isPreviewMode
                ? "Preview mode · Interact with your app"
                : "Design mode"}
            </span>
            <span>
              {total} {total === 1 ? "component" : "components"}
              <span className="editor-footer-divider">/</span>
              {selected
                ? `Selected: ${selected.type}`
                : "Click a component to edit"}
            </span>
            <ToolButton
              icon={faCode}
              label="View generated code"
              onClick={exportCode}
              disabled={!total}
            />
            <ToolButton
              icon={faTrash}
              label="Clear canvas (can be undone)"
              onClick={clear}
              disabled={!total}
            />
          </div>
        </main>
        <aside className="editor-inspector" aria-label="Component inspector">
          {selected ? (
            <PropertiesPanel
              selectedComponent={selected}
              onUpdateComponent={updateComponent}
              components={layout}
              width={propertiesWidth}
              onWidthChange={setPropertiesWidth}
            />
          ) : (
            <div className="editor-inspector-empty">
              <div className="editor-inspector-title">
                <IconSettings2 size={18} />
                <strong>Design</strong>
                <span>Page settings</span>
              </div>
              <section>
                <div className="editor-section-heading">
                  <h2>Canvas</h2>
                  <span>{device?.label || "Custom"}</span>
                </div>
                <p>Set the frame for your next idea.</p>
                <div className="editor-dimensions">
                  {["width", "height"].map((dimension, i) => (
                    <label key={dimension}>
                      <span>{i ? "H" : "W"}</span>
                      <input
                        aria-label={`Canvas ${dimension}`}
                        type="number"
                        min="100"
                        value={editor.canvasDimensions[dimension]}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (value >= 100) {
                            editor.setCanvasDimensions({ [dimension]: value });
                            setAutoFit(true);
                          }
                        }}
                      />
                    </label>
                  ))}
                </div>
              </section>
              <section className="editor-workflow">
                <span className="editor-eyebrow">FROM IDEA TO APP</span>
                <h2>Make it yours.</h2>
                <p>
                  Everything you need to build a real interface, in one
                  workspace.
                </p>
                <ol>
                  <li>
                    <strong>Add your building blocks</strong>
                    <span>Drag from the library or click to insert.</span>
                  </li>
                  <li>
                    <strong>Dial in the details</strong>
                    <span>Edit content, layout, styles and variants.</span>
                  </li>
                  <li>
                    <strong>Bring it to life</strong>
                    <span>Connect pages, forms and conditions.</span>
                  </li>
                  <li>
                    <strong>Take your code with you</strong>
                    <span>Preview and export your React app.</span>
                  </li>
                </ol>
              </section>
              <section className="editor-shortcuts">
                <h3>Work a little faster</h3>
                <p>
                  Undo <kbd>Ctrl Z</kbd>
                </p>
                <p>
                  Redo <kbd>Ctrl Shift Z</kbd>
                </p>
                <p>
                  Preview <kbd>Ctrl P</kbd>
                </p>
                <p>
                  Export <kbd>Ctrl E</kbd>
                </p>
              </section>
            </div>
          )}
        </aside>
      </div>
      {projectPanel && <ProjectPanel section={projectPanel} onClose={() => setProjectPanel(null)} />}
      <CodeViewer
        layout={layout}
        isVisible={editor.isCodeViewerVisible}
        onClose={editor.closeCodeViewer}
      />
      <NotificationSystem
        notifications={notifications.notifications}
        onRemove={notifications.removeNotification}
      />
      <dialog
        ref={helpRef}
        className="editor-help"
        onCancel={() => setShowHelp(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setShowHelp(false);
        }}
      >
        <h2>Your idea, built with React.</h2>
        <p>
          Use Insert to find components. Drag them into the canvas or a
          container, or click to add them to the page. Open Layers to select
          nested components and Pages to manage routes.
        </p>
        <p>
          The inspector includes content, styling, saved variants, form
          validation and conditional visibility. Preview lets you interact with
          the result. Export React opens your code and app download options.
        </p>
        <dl>
          <dt>Undo / Redo</dt>
          <dd>Ctrl Z / Ctrl Shift Z</dd>
          <dt>Preview / Export</dt>
          <dd>Ctrl P / Ctrl E</dd>
          <dt>Exit preview / Deselect</dt>
          <dd>Escape</dd>
        </dl>
        <p className="editor-help-note">
          On macOS, use Command instead of Ctrl. Your pages save in this
          browser. AI creation may download a model the first time you use it.
        </p>
        <button
          type="button"
          className="editor-button editor-button--primary"
          onClick={() => setShowHelp(false)}
        >
          Got it
        </button>
      </dialog>
    </div>
  );
}
export default function UIBuilder({ onDashboard }) {
  return (
      <DndProvider backend={HTML5Backend}>
        <UIBuilderContent onDashboard={onDashboard} />
      </DndProvider>
  );
}
