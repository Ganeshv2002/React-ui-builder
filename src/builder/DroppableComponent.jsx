import React, { useState, useRef, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import Text from '../components/Text';
import Container from '../components/Container';
import Form from '../components/Form';
import Image from '../components/Image';
import Link from '../components/Link';
import Heading from '../components/Heading';
import Paragraph from '../components/Paragraph';
import List from '../components/List';
import Divider from '../components/Divider';
import Checkbox from '../components/Checkbox';
import './DroppableComponent.css';

const componentMap = {
  button: Button,
  input: Input,
  card: Card,
  text: Text,
  container: Container,
  form: Form,
  image: Image,
  link: Link,
  heading: Heading,
  paragraph: Paragraph,
  list: List,
  divider: Divider,
  checkbox: Checkbox
};

const DroppableComponent = ({ 
  component, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onDelete,
  onLayoutChange,
  layout,
  selectedComponent,
  onSelectComponent,
  isPreviewMode = false
}) => {
  const Component = componentMap[component.type];
  const componentRef = useRef(null);
  const clickTimeoutRef = useRef(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'component',
    item: { 
      type: 'existing',
      componentId: component.id 
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
  }), [isPreviewMode]);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'component',
    drop: (item, monitor) => {
      if (isPreviewMode) return;
      
      if (monitor.didDrop()) {
        return;
      }
      
      if (item.type === 'component' && component.children !== undefined) {
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
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  }), [component.id, component.children, onUpdate]);

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

  if (!Component) {
    return <div>Unknown component type: {component.type}</div>;
  }

  const renderChildren = () => {
    if (!component.children) return component.props.children;
    
    return component.children.map((child) => (
      <DroppableComponent
        key={child.id}
        component={child}
        isSelected={!isPreviewMode && selectedComponent?.id === child.id}
        onSelect={() => !isPreviewMode && onSelectComponent(child)}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onLayoutChange={onLayoutChange}
        layout={layout}
        selectedComponent={selectedComponent}
        onSelectComponent={onSelectComponent}
        isPreviewMode={isPreviewMode}
      />
    ));
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
        <Component {...component.props} style={component.props.style} isPreview={isPreviewMode}>
          {renderChildren()}
        </Component>
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
      className={`droppable-component ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isOver ? 'drop-over' : ''}`}
      onClick={handleClick}
    >
      <Component {...component.props} style={component.props.style} isPreview={isPreviewMode}>
        {renderChildren()}
      </Component>
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
