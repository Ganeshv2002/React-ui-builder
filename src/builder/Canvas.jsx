import React from 'react';
import { useDrop } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCogs, faCode, faGridVertical, faBullseye } from '@fortawesome/free-solid-svg-icons';
import DroppableComponent from './DroppableComponent';
import './Canvas.css';

const Canvas = ({ layout, onLayoutChange, selectedComponent, onSelectComponent, isPreviewMode = false }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'component',
    drop: (item, monitor) => {
      if (!monitor.didDrop() && item.type === 'component') {
        // Only handle drop if it wasn't handled by a nested drop target
        const newComponent = {
          id: uuidv4(),
          type: item.componentType,
          props: { ...item.component.defaultProps },
          children: item.component.canContainChildren ? [] : undefined
        };
        // Create new array with existing components plus the new one
        const updatedLayout = [...layout, newComponent];
        onLayoutChange(updatedLayout);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  }), [layout, onLayoutChange]); // Add dependencies

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
        className={`canvas ${isPreviewMode ? 'canvas--preview' : ''} ${isOver ? 'canvas--over' : ''} ${layout.length === 0 ? 'canvas--empty' : ''}`}
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
              <div className="placeholder-icon"><FontAwesomeIcon icon={faBullseye} /></div>
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
            {layout.map((component) => (
              <DroppableComponent
                key={component.id}
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Canvas;
