import React, { useState } from 'react';
import { useDrop, useDragDropManager } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCogs, faCode, faGridVertical, faBullseye, faCube, faCubesStacked } from '@fortawesome/free-solid-svg-icons';
import DroppableComponent from '../DroppableComponent/DroppableComponent';
import DropZone from '../DropZone/DropZone';
import './Canvas.css';
import { FaCubesStacked } from 'react-icons/fa6';
import { faCubes } from '@fortawesome/free-solid-svg-icons/faCubes';

const Canvas = ({ layout, onLayoutChange, selectedComponent, onSelectComponent, isPreviewMode = false }) => {
  const manager = useDragDropManager();
  const monitor = manager.getMonitor();
  const isGlobalDragging = monitor.isDragging();
  
  const [{ isOver, isDragActive }, drop] = useDrop(() => ({
    accept: 'component',
    drop: (item, monitor) => {
      if (!monitor.didDrop()) {
        if (item.type === 'component') {
          // Adding new component from palette to end of layout
          const newComponent = {
            id: uuidv4(),
            type: item.componentType,
            props: { ...item.component.defaultProps },
            children: item.component.canContainChildren ? [] : undefined
          };
          const updatedLayout = [...layout, newComponent];
          onLayoutChange(updatedLayout);
        } else if (item.type === 'existing') {
          // Move existing component to end of layout
          const componentId = item.componentId;
          const componentToMove = findComponentById(layout, componentId);
          
          if (componentToMove) {
            const layoutWithoutComponent = removeComponentById(layout, componentId);
            const updatedLayout = [...layoutWithoutComponent, componentToMove];
            onLayoutChange(updatedLayout);
          }
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      isDragActive: monitor.canDrop() && monitor.isOver(),
    }),
  }), [layout]);

  const handleDropZoneDrop = (item, insertIndex) => {
    if (item.type === 'component') {
      // Adding new component at specific position
      const newComponent = {
        id: uuidv4(),
        type: item.componentType,
        props: { ...item.component.defaultProps },
        children: item.component.canContainChildren ? [] : undefined
      };
      
      const newLayout = [...layout];
      newLayout.splice(insertIndex, 0, newComponent);
      onLayoutChange(newLayout);
    } else if (item.type === 'existing') {
      // Repositioning existing component at specific position
      const componentId = item.componentId;
      const componentToMove = findComponentById(layout, componentId);
      
      if (componentToMove) {
        const currentIndex = layout.findIndex(comp => comp.id === componentId);
        const newLayout = [...layout];
        
        // Remove from current position
        newLayout.splice(currentIndex, 1);
        
        // Adjust insert index if we're moving from before the target position
        const adjustedIndex = currentIndex < insertIndex ? insertIndex - 1 : insertIndex;
        
        // Insert at new position
        newLayout.splice(adjustedIndex, 0, componentToMove);
        onLayoutChange(newLayout);
      }
    }
  };

  // Helper function to find a component by ID in the layout tree
  const findComponentById = (components, id) => {
    for (const component of components) {
      if (component.id === id) {
        return component;
      }
      if (component.children) {
        const found = findComponentById(component.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper function to remove a component by ID from the layout tree
  const removeComponentById = (components, id) => {
    return components.filter(component => {
      if (component.id === id) {
        return false;
      }
      if (component.children) {
        component.children = removeComponentById(component.children, id);
      }
      return true;
    });
  };

  const handleCanvasClick = (e) => {
    // Deselect components when clicking on empty canvas area
    if (e.target.classList.contains('canvas') && !isPreviewMode) {
      onSelectComponent(null);
    }
  };

  const handleComponentUpdate = (componentId, updates) => {
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
    
    onLayoutChange(updateComponent(layout));
  };

  const handleComponentDelete = (componentId) => {
    // Clear selection if we're deleting the selected component
    if (selectedComponent?.id === componentId) {
      onSelectComponent(null);
    }
    
    const deleteComponent = (components) => {
      return components.filter(component => {
        if (component.id === componentId) {
          return false;
        }
        if (component.children) {
          component.children = deleteComponent(component.children);
        }
        return true;
      });
    };
    
    onLayoutChange(deleteComponent(layout));
  };

  return (
    <div className="canvas-container">
      <div 
        ref={!isPreviewMode ? drop : null} 
        className={`canvas ${isPreviewMode ? 'canvas--preview' : ''} ${isOver ? 'canvas--over' : ''} ${layout.length === 0 ? 'canvas--empty' : ''} ${isGlobalDragging ? 'canvas--dragging' : ''}`}
        onClick={(e) => {
          // Deselect component when clicking on empty canvas (only in edit mode)
          if (!isPreviewMode && e.target === e.currentTarget) {
            onSelectComponent(null);
          }
        }}
      >
        {layout.length === 0 ? (
          !isPreviewMode && (
            <div className="canvas-placeholder">
              <div className="placeholder-icon"><FontAwesomeIcon icon={faCubes} /></div>
              <p>Start Building Your UI</p>
              <small>Drag components from the left panel to create your layout</small>
              <div className="placeholder-features">
                <span><FontAwesomeIcon icon={faGridVertical} /> Drag & Drop</span>
                <span><FontAwesomeIcon icon={faCogs} /> Live Preview</span>
                <span><FontAwesomeIcon icon={faCode} /> Code Export</span>
              </div>
            </div>
          )
        ) : (
          <div className="canvas-components">
            {/* Drop zone at the beginning */}
            {!isPreviewMode && (
              <DropZone 
                onDrop={handleDropZoneDrop} 
                index={0} 
                isVisible={true}
              />
            )}
            
            {layout.map((component, index) => (
              <React.Fragment key={component.id}>
                <DroppableComponent
                  component={component}
                  isSelected={!isPreviewMode && selectedComponent?.id === component.id}
                  onSelect={() => !isPreviewMode && onSelectComponent(component)}
                  onUpdate={handleComponentUpdate}
                  onDelete={handleComponentDelete}
                  onLayoutChange={onLayoutChange}
                  layout={layout}
                  selectedComponent={selectedComponent}
                  onSelectComponent={onSelectComponent}
                  isPreviewMode={isPreviewMode}
                  isDragActive={isGlobalDragging}
                />
                
                {/* Drop zone after each component */}
                {!isPreviewMode && (
                  <DropZone 
                    onDrop={handleDropZoneDrop} 
                    index={index + 1} 
                    isVisible={true}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Canvas;
