import React, { useEffect, useMemo, useState } from 'react';
import { useDrag } from 'react-dnd';
import { Resizable } from 'react-resizable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagic } from '@fortawesome/free-solid-svg-icons';
import { v4 as uuidv4 } from 'uuid';
import CreateComponentModal from '../../components/CreateComponentModal';
import './ComponentPalette.css';
import 'react-resizable/css/styles.css';

const DraggableComponent = ({ component, onInsert }) => {
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
      onDoubleClick={() => onInsert?.(component)}
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

const ComponentPalette = ({
  components = [],
  onAddCustomComponent,
  onComponentClick,
  searchValue = '',
  onSearchChange,
  width,
  minWidth = 260,
  maxWidth = 420,
  onWidthChange,
}) => {
  const defaultWidth = Math.min(Math.max(300, minWidth), maxWidth);
  const isControlledWidth = typeof width === 'number';
  const [uncontrolledWidth, setUncontrolledWidth] = useState(width ?? defaultWidth);
  const paletteWidth = isControlledWidth ? width : uncontrolledWidth;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchValue);

  useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);

  useEffect(() => {
    if (!isControlledWidth && typeof width === 'number' && !Number.isNaN(width)) {
      const bounded = Math.min(Math.max(Math.round(width), minWidth), maxWidth);
      setUncontrolledWidth(bounded);
    }
  }, [isControlledWidth, maxWidth, minWidth, width]);

  const updateWidth = (nextWidth) => {
    const numeric = typeof nextWidth === 'number' ? nextWidth : Number(nextWidth);
    if (Number.isNaN(numeric)) {
      return;
    }
    const bounded = Math.min(Math.max(Math.round(numeric), minWidth), maxWidth);
    if (typeof onWidthChange === 'function') {
      onWidthChange(bounded);
    }
    if (!isControlledWidth) {
      setUncontrolledWidth(bounded);
    }
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setLocalSearch(value);
    onSearchChange?.(value);
  };

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
        items
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name)),
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
      onResize={(event, { size }) => updateWidth(size.width)}
      onResizeStop={(event, { size }) => updateWidth(size.width)}
      resizeHandles={['e']}
      minConstraints={[minWidth, 0]}
      maxConstraints={[maxWidth, 0]}
    >
      <div className="component-palette" style={{ width: paletteWidth }}>
        <div className="component-palette__header">
          <div className="component-palette__header-meta">
            <h3>Components</h3>
            <p>Browse the library and drag to canvas</p>
          </div>
          <span className="component-palette__count">{components.length}</span>
        </div>

        <div className="component-palette__search">
          <input
            type="search"
            value={localSearch}
            onChange={handleSearchChange}
            placeholder="Search components..."
            aria-label="Search components"
          />
        </div>

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

        <div className="component-palette__scroll">
          {groupedComponents.length === 0 ? (
            <div className="component-palette__empty">
              <p>No components match "{localSearch.trim()}".</p>
            </div>
          ) : (
            groupedComponents.map(([category, categoryComponents]) => (
              <div key={category} className="component-category">
                <header className="component-category__header">
                  <h4>{category}</h4>
                  <span>{categoryComponents.length}</span>
                </header>
                <div className="component-list">
                  {categoryComponents.map((component) => (
                    <DraggableComponent
                      key={component.id}
                      component={component}
                      onInsert={(item) => onComponentClick?.(item.id)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

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
