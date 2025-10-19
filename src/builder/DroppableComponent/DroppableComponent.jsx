import React, { useRef, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';
import CustomComponentRenderer from '../../components/CustomComponentRenderer/CustomComponentRenderer';
import DropZone from '../DropZone/DropZone';
import { ensureComponentRegistry, getComponentRenderer } from '../componentRegistry';
import { findComponentById, insertComponentIntoParent, isDescendant, removeComponentById } from '../../utils/layoutTree';
import { telemetry, TELEMETRY_EVENTS } from '../../utils/telemetry';
import './DroppableComponent.css';

ensureComponentRegistry();

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
  const Component = getComponentRenderer(component.type);
  const componentRef = useRef(null);
  const clickTimeoutRef = useRef(null);

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
      return !isPreviewMode;
    },
    end: (item, monitor) => {
      // Reset any drag state when drag ends
      if (monitor.didDrop()) {
        // Drag was successful
      }
    }
  }), [isPreviewMode, component]);

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
        
        onUpdate(component.id, {
          children: [...(component.children || []), newComponent]
        });
      }
      // Note: Repositioning is now handled by DropZone components
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  }), [component.id, component.children, isPreviewMode]);

  const handleClick = (e) => {
    if (!isPreviewMode) {
      e.stopPropagation();
      
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
  const isCustomComponent = !Component && component.jsx && component.css;
  
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
    if (!component.children) return component.props.children;
    
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
        style={component.props.style}
      >
        {isCustomComponent ? (
          <CustomComponentRenderer 
            component={component} 
            props={component.props}
          >
            {renderChildren()}
          </CustomComponentRenderer>
        ) : (
          <Component {...component.props} style={component.props.style} isPreview={isPreviewMode}>
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
      className={`droppable-component ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isOver ? 'drop-over' : ''} ${isDragActive ? 'canvas--dragging' : ''}`}
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
        <Component {...component.props} style={component.props.style} isPreview={isPreviewMode}>
          {renderChildren()}
        </Component>
      )}
      {isSelected && !isPreviewMode && (
        <div className="component-controls">
          <div 
            ref={(node) => {
              if (node && !isPreviewMode) {
                drag(node);
              }
            }}
            className="drag-handle"
            title="Drag to move"
            onClick={(e) => e.stopPropagation()}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <circle cx="3" cy="3" r="1"/>
              <circle cx="9" cy="3" r="1"/>
              <circle cx="3" cy="9" r="1"/>
              <circle cx="9" cy="9" r="1"/>
              <circle cx="6" cy="3" r="1"/>
              <circle cx="3" cy="6" r="1"/>
              <circle cx="9" cy="6" r="1"/>
              <circle cx="6" cy="9" r="1"/>
              <circle cx="6" cy="6" r="1"/>
            </svg>
          </div>
          <button 
            className="delete-btn"
            onClick={handleDelete}
            title="Delete component"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default DroppableComponent;
