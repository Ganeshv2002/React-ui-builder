import React, { useMemo, useState } from 'react';
import { useDrag } from 'react-dnd';
import { Resizable } from 'react-resizable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagic } from '@fortawesome/free-solid-svg-icons';
import { v4 as uuidv4 } from 'uuid';
import CreateComponentModal from '../../components/CreateComponentModal';
import './ComponentPalette.css';
import 'react-resizable/css/styles.css';

const DraggableComponent = ({ component }) => {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: 'component',
      item: {
        type: 'component',
        componentType: component.id,
        component,
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [component],
  );

  return (
    <div
      ref={drag}
      className={`draggable-component ${isDragging ? 'dragging' : ''}`}
    >
      <span className="component-icon">
        {typeof component.icon === 'string' ? (
          component.icon
        ) : (
          <FontAwesomeIcon icon={component.icon} />
        )}
      </span>
      <span className="component-name">{component.name}</span>
    </div>
  );
};

const ComponentPalette = ({ components = [], onAddCustomComponent }) => {
  const [paletteWidth, setPaletteWidth] = useState(280);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const groupedComponents = useMemo(() => {
    const buckets = new Map();

    components.forEach((component) => {
      if (!component?.category) {
        return;
      }

      if (!buckets.has(component.category)) {
        buckets.set(component.category, []);
      }

      buckets.get(component.category).push(component);
    });

    return Array.from(buckets.entries())
      .sort(([categoryA], [categoryB]) => categoryA.localeCompare(categoryB))
      .map(([category, items]) => [
        category,
        items.slice().sort((a, b) => a.name.localeCompare(b.name)),
      ]);
  }, [components]);

  const handleComponentCreated = (componentSpec) => {
    if (!componentSpec) {
      return;
    }

    const componentType =
      typeof componentSpec.type === 'string' && componentSpec.type.length > 0
        ? componentSpec.type
        : 'component';
    const normalizedProps = componentSpec.props ?? {};
    const formatLabel = (value) =>
      value.charAt(0).toUpperCase() + value.slice(1).replace(/([A-Z])/g, ' $1');

    const newComponent = {
      id: componentSpec.id || `custom-${uuidv4().slice(0, 8)}`,
      name: formatLabel(componentType),
      category: 'AI Generated',
      icon: faMagic,
      defaultProps: {
        ...normalizedProps,
        children:
          componentSpec.children ??
          normalizedProps.children ??
          normalizedProps.text ??
          'AI Generated Content',
      },
      props: Object.keys(normalizedProps).map((key) => ({
        name: key,
        type:
          typeof normalizedProps[key] === 'boolean'
            ? 'boolean'
            : typeof normalizedProps[key] === 'number'
            ? 'number'
            : 'string',
        defaultValue: normalizedProps[key],
        label: formatLabel(key),
      })),
      canContainChildren: componentSpec.children !== undefined,
      isCustom: true,
      aiGenerated: true,
    };

    if (onAddCustomComponent) {
      onAddCustomComponent(newComponent);
    }
  };

  return (
    <Resizable
      width={paletteWidth}
      height={0}
      onResize={(event, { size }) => setPaletteWidth(size.width)}
      resizeHandles={['e']}
      minConstraints={[200, 0]}
      maxConstraints={[400, 0]}
    >
      <div className="component-palette" style={{ width: paletteWidth }}>
        <h3>Components</h3>

        <div className="create-component-section">
          <button
            type="button"
            className="create-component-btn"
            onClick={() => setShowCreateModal(true)}
            title="Generate custom components using AI"
          >
            <span className="create-icon" aria-hidden="true">
              <FontAwesomeIcon icon={faMagic} />
            </span>
            <span>Create with AI</span>
          </button>
          <p className="create-component-subtitle">
            Generate custom components with AI assistance
          </p>
        </div>

        {groupedComponents.map(([category, categoryComponents]) => (
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
            Drag components to the canvas to start building your layout.
          </p>
        </div>

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
