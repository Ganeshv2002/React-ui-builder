import React from 'react';
import { useDrag } from 'react-dnd';
import './ComponentPalette.css';

const DraggableComponent = ({ component }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'component',
    item: { 
      type: 'component',
      componentType: component.id,
      component: component
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`draggable-component ${isDragging ? 'dragging' : ''}`}
    >
      <span className="component-icon">{component.icon}</span>
      <span className="component-name">{component.name}</span>
    </div>
  );
};

const ComponentPalette = ({ components }) => {
  const groupedComponents = components.reduce((acc, component) => {
    if (!acc[component.category]) {
      acc[component.category] = [];
    }
    acc[component.category].push(component);
    return acc;
  }, {});

  return (
    <div className="component-palette">
      <h3>Components</h3>
      {Object.entries(groupedComponents).map(([category, categoryComponents]) => (
        <div key={category} className="component-category">
          <h4>{category}</h4>
          <div className="component-list">
            {categoryComponents.map((component) => (
              <DraggableComponent key={component.id} component={component} />
            ))}
          </div>
        </div>
      ))}
      
      <div className="palette-footer">
        <p className="help-text">
          💡 Drag components to the canvas to start building your layout
        </p>
      </div>
    </div>
  );
};

export default ComponentPalette;
