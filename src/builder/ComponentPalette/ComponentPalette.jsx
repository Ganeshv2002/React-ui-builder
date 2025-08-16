import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { Resizable } from 'react-resizable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './ComponentPalette.css';
import 'react-resizable/css/styles.css';

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
      <span className="component-icon">
        {typeof component.icon === 'string' ? component.icon : <FontAwesomeIcon icon={component.icon} />}
      </span>
      <span className="component-name">{component.name}</span>
    </div>
  );
};

const ComponentPalette = ({ components }) => {
  const [paletteWidth, setPaletteWidth] = useState(280);
  
  const groupedComponents = components.reduce((acc, component) => {
    if (!acc[component.category]) {
      acc[component.category] = [];
    }
    acc[component.category].push(component);
    return acc;
  }, {});

  return (
    <Resizable
      width={paletteWidth}
      height={0}
      onResize={(e, { size }) => setPaletteWidth(size.width)}
      resizeHandles={['e']}
      minConstraints={[200, 0]}
      maxConstraints={[400, 0]}
    >
      <div className="component-palette" style={{ width: paletteWidth }}>
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
    </Resizable>
  );
};

export default ComponentPalette;
