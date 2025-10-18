import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { Resizable } from 'react-resizable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { v4 as uuidv4 } from 'uuid';
import CreateComponentModal from '../../components/CreateComponentModal';
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

const ComponentPalette = ({ components, onAddCustomComponent }) => {
  const [paletteWidth, setPaletteWidth] = useState(280);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const groupedComponents = components.reduce((acc, component) => {
    if (!acc[component.category]) {
      acc[component.category] = [];
    }
    acc[component.category].push(component);
    return acc;
  }, {});

  const handleComponentCreated = (componentSpec) => {
    // Convert AI ComponentSpec to component definition format
    const newComponent = {
      id: componentSpec.id || `custom-${uuidv4().slice(0, 8)}`,
      name: componentSpec.type.charAt(0).toUpperCase() + componentSpec.type.slice(1),
      category: 'AI Generated',
      icon: '🤖',
      defaultProps: {
        ...componentSpec.props,
        children: componentSpec.children || componentSpec.props.children || componentSpec.props.text || 'AI Generated Content'
      },
      props: Object.keys(componentSpec.props).map(key => ({
        name: key,
        type: typeof componentSpec.props[key] === 'boolean' ? 'boolean' : 
              typeof componentSpec.props[key] === 'number' ? 'number' : 'string',
        defaultValue: componentSpec.props[key],
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
      })),
      canContainChildren: componentSpec.children !== undefined,
      isCustom: true,
      aiGenerated: true
    };

    if (onAddCustomComponent) {
      onAddCustomComponent(newComponent);
    }
  };

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
        
        {/* Create New Component Button */}
        <div className="create-component-section">
          <button 
            className="create-component-btn"
            onClick={() => setShowCreateModal(true)}
            title="Generate custom components using AI"
          >
            <span className="create-icon">✨</span>
            <span>Create with AI</span>
          </button>
          <p className="create-component-subtitle">
            Generate custom components with AI assistance
          </p>
        </div>

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

        {/* AI Component Creator Modal */}
        <CreateComponentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onComponentCreate={handleComponentCreated}
        />
      </div>
    </Resizable>
  );
};

export default ComponentPalette;
