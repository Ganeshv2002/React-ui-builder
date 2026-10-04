import React, { useRef, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';
import CustomComponentRenderer from '../../components/CustomComponentRenderer/CustomComponentRenderer';
import DropZone from '../DropZone/DropZone';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGripVertical, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ensureComponentRegistry, getComponentRenderer } from '../componentRegistry';
import { findComponentById, insertComponentIntoParent, isDescendant, removeComponentById } from '../../utils/layoutTree';
import { telemetry, TELEMETRY_EVENTS } from '../../utils/telemetry';
import { usePages } from '../../contexts/PageContext';
import { resolveValue } from '../../runtime/engine';
import { registry as runtimeRegistry } from '../../runtime/registry';
import useEditorStore from '../../store/editorStore';
import useFreeTransform from '../Canvas/useFreeTransform';
import { freeStyle, localPoint, paletteBox } from '../Canvas/geometry';
import './DroppableComponent.css';

ensureComponentRegistry();

const VIEWPORT_UNITS = /(-?\d*\.?\d+)[dsl]?(vh|vw|vmin|vmax)\b/g;
const noop = () => {};

// On the canvas, viewport units must measure the artboard rather than the editor window.
// Preview needs no conversion because its iframe is exactly the artboard size.
const toArtboardUnits = (style, { width, height }) => {
  if (!style || typeof style !== 'object') return style;
  const unit = { vh: height, vw: width, vmin: Math.min(width, height), vmax: Math.max(width, height) };
  return Object.fromEntries(Object.entries(style).map(([key, value]) => [
    key,
    typeof value === 'string'
      ? value.replace(VIEWPORT_UNITS, (_, amount, name) => `${+(Number(amount) * unit[name] / 100).toFixed(2)}px`)
      : value,
  ]));
};

// The canvas wraps each component for selection, while Preview renders it directly.
// Sizing, spacing and flex/grid placement move to the wrapper so the parent lays it out the same way.
const WRAPPER_KEYS = [
  'width', 'minWidth', 'maxWidth', 'height', 'minHeight', 'maxHeight',
  'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf', 'justifySelf', 'order',
  'gridColumn', 'gridRow', 'gridArea',
  'position', 'inset', 'top', 'right', 'bottom', 'left', 'zIndex',
];
const splitWrapperStyle = (style = {}) => {
  const wrapper = {};
  const inner = { ...style };
  for (const key of WRAPPER_KEYS) {
    if (inner[key] !== undefined && inner[key] !== '') wrapper[key] = inner[key];
    delete inner[key];
  }
  // The component fills the box its wrapper now takes.
  if (wrapper.width !== undefined || wrapper.minWidth !== undefined) inner.width = '100%';
  if (wrapper.height !== undefined) inner.height = '100%';
  if (wrapper.minHeight !== undefined) inner.minHeight = 'inherit';
  return { wrapper, inner };
};

const DroppableComponent = ({
  component,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onLayoutChange,
  layout,
  selectedComponentId,
  onSelectComponent,
  isPreviewMode = false,
  isDragActive = false,
}) => {
  // Render with the same adapters as Preview and the exported app so markup matches.
  const runtimeAdapter = runtimeRegistry[component.type];
  const Component = runtimeAdapter?.component ?? getComponentRenderer(component.type);
  const { theme, getCurrentPage, pages } = usePages();
  const canvasDimensions = useEditorStore((state) => state.canvasDimensions);
  const free = useEditorStore(state => state.canvasPlacement === 'free');
  const zoom = useEditorStore(state => state.canvasZoom);
  let renderProps;
  try { renderProps = resolveValue({ ...component.props, ...component.bindings }, { theme, state: getCurrentPage()?.logic?.state || {} }); }
  catch { renderProps = { ...component.props, style: {} }; }
  renderProps = { ...renderProps, style: toArtboardUnits(renderProps.style, canvasDimensions) };
  for (const key of Object.keys(renderProps)) if (/^on[A-Z]|^dangerouslySetInnerHTML$/.test(key)) delete renderProps[key];
  const placement = isPreviewMode ? { wrapper: undefined, inner: renderProps.style } : splitWrapperStyle(renderProps.style);
  if (!isPreviewMode && component.children !== undefined) placement.inner = { ...placement.inner, position: 'relative' };
  const componentProps = runtimeAdapter
    ? { ...renderProps, style: placement.inner, runtime: { navigate: noop, pages, editor: !isPreviewMode } }
    : { ...renderProps, style: placement.inner, isPreview: isPreviewMode };
  const componentRef = useRef(null);
  const clickTimeoutRef = useRef(null);
  const transform = useFreeTransform({ component, elementRef: componentRef, enabled: free && !isPreviewMode,
    zoom, layout, onLayoutChange, onSelect });

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'component',
    item: { 
      type: 'existing',
      componentId: component.id,
      component: component
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: (monitor) => {
      return !isPreviewMode && !free;
    },
    end: (item, monitor) => {
      // Reset any drag state when drag ends
      if (monitor.didDrop()) {
        // Drag was successful
      }
    }
  }), [isPreviewMode, component, free]);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'component',
    drop: (item, monitor) => {
      if (isPreviewMode) return;
      
      if (monitor.didDrop()) {
        return;
      }
      
      // Only handle drops for containers (components that can have children)
      if (item.type === 'component' && component.children !== undefined) {
        // Adding new component to container
        const newComponent = {
          id: uuidv4(),
          type: item.componentType,
          props: { ...item.component.defaultProps },
          children: item.component.canContainChildren ? [] : undefined
        };
        
        if (free && monitor.getClientOffset()) {
          const host = componentRef.current.firstElementChild;
          newComponent.props.style = freeStyle(newComponent.props.style, paletteBox(item.componentType,
            localPoint(monitor.getClientOffset(), host.getBoundingClientRect(), zoom, { x: host.clientLeft, y: host.clientTop })));
        }
        onUpdate(component.id, {
          ...(free ? { props: { ...component.props, style: { ...component.props?.style,
            position: component.props?.style?.position === 'absolute' ? 'absolute' : 'relative' } } } : {}),
          children: [...(component.children || []), newComponent]
        });
        onSelectComponent(newComponent.id);
      }
      // Note: Repositioning is now handled by DropZone components
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  }), [component, isPreviewMode, free, zoom, onUpdate, onSelectComponent]);

  const handleClick = (e) => {
    if (!isPreviewMode) {
      e.stopPropagation();
      // Selecting must not activate the component (label focus, link follow, checkbox toggle).
      e.preventDefault();
      
      // Clear any existing timeout
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      
      // Use a small delay to ensure drag operations don't interfere
      clickTimeoutRef.current = setTimeout(() => {
        onSelect();
      }, 10);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  const handleDelete = (e) => {
    if (!isPreviewMode) {
      e.stopPropagation();
      onDelete(component.id);
    }
  };

  // Check if this is a custom AI-generated component
  // Portable JSON can retain old source metadata, but only registered components execute.
  const isCustomComponent = false;
  
  if (!Component && !isCustomComponent) {
    return <div>Unknown component type: {component.type}</div>;
  }

  const handleChildDropZoneDrop = (item, insertIndex) => {
    if (item.type === 'component') {
      // Adding new component at specific position within children
      const newComponent = {
        id: uuidv4(),
        type: item.componentType,
        props: { ...item.component.defaultProps },
        children: item.component.canContainChildren ? [] : undefined
      };
      
    const newChildren = [...(component.children || [])];
    newChildren.splice(insertIndex, 0, newComponent);
    
    onUpdate(component.id, { children: newChildren });
    telemetry.track(TELEMETRY_EVENTS.COMPONENT_ADDED, {
      componentType: item.componentType,
      parentId: component.id,
      index: insertIndex,
    });
  } else if (item.type === 'existing') {
      // Repositioning existing component within children
      const componentId = item.componentId;
      const children = component.children || [];
      const componentToMove = children.find(child => child.id === componentId);
      
      if (componentToMove) {
        const currentIndex = children.findIndex(child => child.id === componentId);
        const newChildren = [...children];
        
        // Remove from current position
        newChildren.splice(currentIndex, 1);
        
        // Adjust insert index if we're moving from before the target position
        const adjustedIndex = currentIndex < insertIndex ? insertIndex - 1 : insertIndex;
        
        // Insert at new position
        newChildren.splice(adjustedIndex, 0, componentToMove);
        onUpdate(component.id, { children: newChildren });
        telemetry.track(TELEMETRY_EVENTS.COMPONENT_MOVED, {
          componentId,
          targetParentId: component.id,
          index: adjustedIndex,
        });
        return;
      }

      const componentFromLayout = findComponentById(layout, componentId);

      if (!componentFromLayout || componentFromLayout.id === component.id || isDescendant(componentFromLayout, component.id)) {
        return;
      }

      const layoutWithoutComponent = removeComponentById(layout, componentId);
      if (layoutWithoutComponent === layout) {
        return;
      }

      const nextLayout = insertComponentIntoParent(layoutWithoutComponent, component.id, componentFromLayout, insertIndex);
      if (nextLayout !== layoutWithoutComponent) {
        onLayoutChange(nextLayout);
        telemetry.track(TELEMETRY_EVENTS.COMPONENT_MOVED, {
          componentId,
          targetParentId: component.id,
          index: insertIndex,
        });
      }
    }
  };

  const renderChildren = () => {
    if (!component.children?.length && component.children === undefined) return renderProps.children;
    
    const children = component.children;
    const canAcceptChildren = component.type === 'container' || component.type === 'form';
    
    if (!canAcceptChildren) {
      // For components that can't accept new children, render normally
      return children.map((child) => (
        <DroppableComponent
          key={child.id}
          component={child}
          isSelected={!isPreviewMode && selectedComponentId === child.id}
          onSelect={() => !isPreviewMode && onSelectComponent(child.id)}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onLayoutChange={onLayoutChange}
          layout={layout}
          selectedComponentId={selectedComponentId}
          onSelectComponent={onSelectComponent}
          isPreviewMode={isPreviewMode}
          isDragActive={isDragActive}
        />
      ));
    }

    // For containers and forms, add DropZones between children
    return (
      <>
        {/* Drop zone at the beginning */}
        {!isPreviewMode && (
          <DropZone 
            onDrop={handleChildDropZoneDrop} 
            index={0} 
            isVisible={true}
          />
        )}
        
        {children.map((child, index) => (
          <React.Fragment key={child.id}>
            <DroppableComponent
              component={child}
              isSelected={!isPreviewMode && selectedComponentId === child.id}
              onSelect={() => !isPreviewMode && onSelectComponent(child.id)}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onLayoutChange={onLayoutChange}
              layout={layout}
              selectedComponentId={selectedComponentId}
              onSelectComponent={onSelectComponent}
              isPreviewMode={isPreviewMode}
              isDragActive={isDragActive}
            />
            
            {/* Drop zone after each child */}
            {!isPreviewMode && (
              <DropZone 
                onDrop={handleChildDropZoneDrop} 
                index={index + 1} 
                isVisible={true}
              />
            )}
          </React.Fragment>
        ))}
      </>
    );
  };

  // Get current dimensions from component style or set defaults
  const currentWidth = parseInt(component.props.style?.width) || 200;
  const currentHeight = parseInt(component.props.style?.height) || 100;

  // In preview mode, render without resize functionality
  if (isPreviewMode) {
    return (
      <div
        ref={(node) => {
          if (node) {
            componentRef.current = node;
            if (component.children !== undefined) {
              drop(node);
            }
          }
        }}
        className={`droppable-component preview-mode`}
        onClick={handleClick}
        style={renderProps.style}
      >
        {isCustomComponent ? (
          <CustomComponentRenderer 
            component={component} 
            props={component.props}
          >
            {renderChildren()}
          </CustomComponentRenderer>
        ) : (
          <Component {...componentProps}>
            {renderChildren()}
          </Component>
        )}
      </div>
    );
  }

  return (
    <div
      ref={(node) => {
        if (node && !isPreviewMode) {
          componentRef.current = node;
          if (component.children !== undefined) {
            drop(node);
          }
        }
      }}
      data-component-id={component.id}
      tabIndex={0}
      aria-label={`${component.type} component`}
      onPointerDown={transform.begin}
      onKeyDown={transform.onKeyDown}
      onDragStart={free ? event => event.preventDefault() : undefined}
      className={`droppable-component ${free ? 'free-positionable' : ''} ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isOver ? 'drop-over' : ''} ${isDragActive ? 'canvas--dragging' : ''}`}
      style={placement.wrapper}
      onClick={handleClick}
    >
      {isCustomComponent ? (
        <CustomComponentRenderer 
          component={component} 
          props={component.props}
        >
          {renderChildren()}
        </CustomComponentRenderer>
      ) : (
        <Component {...componentProps}>
          {renderChildren()}
        </Component>
      )}
      {isSelected && free && <>
        {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(handle => <span key={handle}
          className={`canvas-resize-handle canvas-resize-handle--${handle}`} title={`Resize ${handle}`}
          onPointerDown={event => transform.begin(event, handle)} />)}
        <div className="canvas-position-label">{Math.round(parseFloat(component.props.style?.left) || 0)}, {Math.round(parseFloat(component.props.style?.top) || 0)} · Drag to move</div>
      </>}
      {isSelected && !isPreviewMode && (
        <div className="component-controls" onClick={(event) => event.stopPropagation()}>
          {free && component.props.style?.position === 'absolute' && <button type="button" className="return-to-flow"
            title="Return to responsive layout flow" onClick={() => {
              const style = { ...component.props.style };
              for (const key of ['position', 'left', 'top', 'right', 'bottom', 'inset', 'flex']) delete style[key];
              onUpdate(component.id, { props: { ...component.props, style } });
            }}>Flow</button>}
          <button
            type="button"
            ref={(node) => {
              if (node && !isPreviewMode) {
                drag(node);
              }
            }}
            className="drag-handle"
            hidden={free}
            title="Drag to move"
          >
            <FontAwesomeIcon icon={faGripVertical} />
          </button>
          <button
            type="button"
            className="delete-btn"
            onClick={(event) => {
              event.stopPropagation();
              handleDelete(event);
            }}
            title="Delete component"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      )}
    </div>
  );
};

export default DroppableComponent;

