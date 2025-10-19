import React from 'react';
import { useDrop, useDragDropManager } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCogs, faCode, faGridVertical, faCubes } from '@fortawesome/free-solid-svg-icons';
import DroppableComponent from '../DroppableComponent/DroppableComponent';
import DropZone from '../DropZone/DropZone';
import './Canvas.css';

const findComponentById = (components, id) => {
  if (!Array.isArray(components)) {
    return null;
  }

  for (const component of components) {
    if (component?.id === id) {
      return component;
    }

    if (Array.isArray(component?.children)) {
      const match = findComponentById(component.children, id);
      if (match) {
        return match;
      }
    }
  }

  return null;
};

const removeComponentById = (components, id) => {
  if (!Array.isArray(components) || components.length === 0) {
    return components;
  }

  let hasChanges = false;

  const nextComponents = components.reduce((acc, component) => {
    if (component?.id === id) {
      hasChanges = true;
      return acc;
    }

    if (!Array.isArray(component?.children) || component.children.length === 0) {
      acc.push(component);
      return acc;
    }

    const nextChildren = removeComponentById(component.children, id);
    if (nextChildren !== component.children) {
      hasChanges = true;
      acc.push({ ...component, children: nextChildren });
      return acc;
    }

    acc.push(component);
    return acc;
  }, []);

  return hasChanges ? nextComponents : components;
};

const Canvas = ({
  layout,
  onLayoutChange,
  selectedComponent,
  onSelectComponent,
  isPreviewMode = false,
}) => {
  const manager = useDragDropManager();
  const monitor = manager.getMonitor();
  const isGlobalDragging = monitor.isDragging();

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: 'component',
      drop: (item, dropMonitor) => {
        if (dropMonitor.didDrop()) {
          return;
        }

        if (item.type === 'component') {
          const newComponent = {
            id: uuidv4(),
            type: item.componentType,
            props: { ...item.component.defaultProps },
            children: item.component.canContainChildren ? [] : undefined,
          };

          onLayoutChange([...layout, newComponent]);
          return;
        }

        if (item.type === 'existing') {
          const componentToMove = findComponentById(layout, item.componentId);

          if (!componentToMove) {
            return;
          }

          const layoutWithoutComponent = removeComponentById(layout, item.componentId);
          if (layoutWithoutComponent === layout) {
            return;
          }

          onLayoutChange([...layoutWithoutComponent, componentToMove]);
        }
      },
      collect: (dropMonitor) => ({
        isOver: dropMonitor.isOver({ shallow: true }),
      }),
    }),
    [layout, onLayoutChange],
  );

  const handleDropZoneDrop = (item, insertIndex) => {
    if (item.type === 'component') {
      const newComponent = {
        id: uuidv4(),
        type: item.componentType,
        props: { ...item.component.defaultProps },
        children: item.component.canContainChildren ? [] : undefined,
      };

      const nextLayout = [...layout];
      nextLayout.splice(insertIndex, 0, newComponent);
      onLayoutChange(nextLayout);
      return;
    }

    if (item.type === 'existing') {
      const componentToMove = findComponentById(layout, item.componentId);

      if (!componentToMove) {
        return;
      }

      const currentIndex = layout.findIndex((component) => component.id === item.componentId);
      if (currentIndex === -1) {
        return;
      }

      const nextLayout = [...layout];
      nextLayout.splice(currentIndex, 1);

      const targetIndex = currentIndex < insertIndex ? insertIndex - 1 : insertIndex;
      nextLayout.splice(targetIndex, 0, componentToMove);
      onLayoutChange(nextLayout);
    }
  };

  const handleComponentUpdate = (componentId, updates) => {
    const updateComponentTree = (components) =>
      components.map((component) => {
        if (component.id === componentId) {
          return { ...component, ...updates };
        }

        if (Array.isArray(component.children) && component.children.length > 0) {
          const nextChildren = updateComponentTree(component.children);
          if (nextChildren !== component.children) {
            return { ...component, children: nextChildren };
          }
        }

        return component;
      });

    onLayoutChange(updateComponentTree(layout));
  };

  const handleComponentDelete = (componentId) => {
    if (selectedComponent?.id === componentId) {
      onSelectComponent(null);
    }

    const nextLayout = removeComponentById(layout, componentId);
    if (nextLayout !== layout) {
      onLayoutChange(nextLayout);
    }
  };

  return (
    <div className="canvas-container">
      <div
        ref={!isPreviewMode ? drop : null}
        className={`canvas ${isPreviewMode ? 'canvas--preview' : ''} ${isOver ? 'canvas--over' : ''} ${
          layout.length === 0 ? 'canvas--empty' : ''
        } ${isGlobalDragging ? 'canvas--dragging' : ''}`}
        onClick={(event) => {
          if (!isPreviewMode && event.target === event.currentTarget) {
            onSelectComponent(null);
          }
        }}
      >
        {layout.length === 0 ? (
          !isPreviewMode && (
            <div className="canvas-placeholder">
              <div className="placeholder-icon">
                <FontAwesomeIcon icon={faCubes} />
              </div>
              <p>Start Building Your UI</p>
              <small>Drag components from the left panel to create your layout</small>
              <div className="placeholder-features">
                <span>
                  <FontAwesomeIcon icon={faGridVertical} /> Drag & Drop
                </span>
                <span>
                  <FontAwesomeIcon icon={faCogs} /> Live Preview
                </span>
                <span>
                  <FontAwesomeIcon icon={faCode} /> Code Export
                </span>
              </div>
            </div>
          )
        ) : (
          <div className="canvas-components">
            {!isPreviewMode && <DropZone onDrop={handleDropZoneDrop} index={0} isVisible />}

            {layout.map((component, index) => (
              <React.Fragment key={component.id}>
                <DroppableComponent
                  component={component}
                  isSelected={!isPreviewMode && selectedComponent?.id === component.id}
                  onSelect={() => {
                    if (!isPreviewMode) {
                      onSelectComponent(component);
                    }
                  }}
                  onUpdate={handleComponentUpdate}
                  onDelete={handleComponentDelete}
                  onLayoutChange={onLayoutChange}
                  layout={layout}
                  selectedComponent={selectedComponent}
                  onSelectComponent={onSelectComponent}
                  isPreviewMode={isPreviewMode}
                  isDragActive={isGlobalDragging}
                />

                {!isPreviewMode && (
                  <DropZone onDrop={handleDropZoneDrop} index={index + 1} isVisible />
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
