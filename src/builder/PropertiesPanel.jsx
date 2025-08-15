import React, { useState } from 'react';
import { Resizable } from 'react-resizable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCogs } from '@fortawesome/free-solid-svg-icons';
import { componentDefinitions } from '../data/componentDefinitions';
import { usePages } from '../contexts/PageContext';
import VisualConditionBuilder from './VisualConditionBuilder';
import VisualValidationBuilder from './VisualValidationBuilder';
import './PropertiesPanel.css';
import 'react-resizable/css/styles.css';

const PropertiesPanel = ({ selectedComponent, onUpdateComponent, components = [] }) => {
  const [panelWidth, setPanelWidth] = useState(300);
  const { pages } = usePages();
  
  if (!selectedComponent) {
    return (
      <Resizable
        width={panelWidth}
        height={0}
        onResize={(e, { size }) => setPanelWidth(size.width)}
        resizeHandles={['w']}
        minConstraints={[250, 0]}
        maxConstraints={[500, 0]}
      >
        <div className="properties-panel" style={{ width: panelWidth }}>
          <h3><FontAwesomeIcon icon={faCogs} /> Properties</h3>
          <p className="no-selection">Select a component to edit its properties</p>
        </div>
      </Resizable>
    );
  }

  const componentDef = componentDefinitions.find(def => def.id === selectedComponent.type);
  
  if (!componentDef) {
    return (
      <div className="properties-panel">
        <h3>Properties</h3>
        <p>No properties available for this component</p>
      </div>
    );
  }

  const handlePropChange = (propName, value) => {
    onUpdateComponent(selectedComponent.id, {
      props: {
        ...selectedComponent.props,
        [propName]: value // Always set the value, even if it's empty
      }
    });
  };

  const handleStyleChange = (styleProp, value) => {
    const currentStyle = selectedComponent.props.style || {};
    
    // If value is empty, remove the property instead of setting it to empty string
    const updatedStyle = { ...currentStyle };
    if (value === '' || value === null || value === undefined) {
      delete updatedStyle[styleProp];
    } else {
      updatedStyle[styleProp] = value;
    }
    
    onUpdateComponent(selectedComponent.id, {
      props: {
        ...selectedComponent.props,
        style: updatedStyle
      }
    });
  };

  const renderPropInput = (prop) => {
    // Use nullish coalescing and handle empty strings properly
    const currentValue = selectedComponent.props[prop.name] !== undefined 
      ? selectedComponent.props[prop.name] 
      : (prop.defaultValue || '');

    switch (prop.type) {
      case 'string':
        return (
          <div className="input-with-clear">
            <input
              type="text"
              value={currentValue}
              onChange={(e) => handlePropChange(prop.name, e.target.value)}
              className="prop-input"
              placeholder={prop.placeholder || `Enter ${prop.label.toLowerCase()}`}
            />
            {currentValue && (
              <button
                type="button"
                className="clear-btn"
                onClick={() => handlePropChange(prop.name, '')}
                title="Clear"
              >
                ×
              </button>
            )}
          </div>
        );
      case 'textarea':
        return (
          <div className="input-with-clear">
            <textarea
              value={currentValue}
              onChange={(e) => handlePropChange(prop.name, e.target.value)}
              className="prop-textarea"
              placeholder={prop.placeholder || `Enter ${prop.label.toLowerCase()}`}
              rows={3}
            />
            {currentValue && (
              <button
                type="button"
                className="clear-btn textarea-clear"
                onClick={() => handlePropChange(prop.name, '')}
                title="Clear"
              >
                ×
              </button>
            )}
          </div>
        );
      case 'select':
        return (
          <select
            value={currentValue}
            onChange={(e) => handlePropChange(prop.name, e.target.value)}
            className="prop-select"
          >
            {prop.options.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case 'page-select':
        return (
          <select
            value={currentValue}
            onChange={(e) => handlePropChange(prop.name, e.target.value)}
            className="prop-select"
          >
            <option value="">Select a page...</option>
            {pages.map(page => (
              <option key={page.id} value={page.id}>
                {page.name} ({page.path})
              </option>
            ))}
          </select>
        );
      case 'color':
        return (
          <input
            type="color"
            value={currentValue || '#000000'}
            onChange={(e) => handlePropChange(prop.name, e.target.value)}
            className="prop-color"
          />
        );
      case 'number':
        return (
          <div className="input-with-clear">
            <input
              type="number"
              value={currentValue}
              onChange={(e) => handlePropChange(prop.name, e.target.value)}
              className="prop-input"
              min={prop.min}
              max={prop.max}
              step={prop.step}
              placeholder={prop.placeholder || `Enter ${prop.label.toLowerCase()}`}
            />
            {currentValue && (
              <button
                type="button"
                className="clear-btn"
                onClick={() => handlePropChange(prop.name, '')}
                title="Clear"
              >
                ×
              </button>
            )}
          </div>
        );
      case 'boolean':
        return (
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={Boolean(currentValue)}
              onChange={(e) => handlePropChange(prop.name, e.target.checked)}
              className="prop-checkbox"
            />
            <span className="checkbox-label">{prop.label}</span>
          </label>
        );
      case 'conditions':
        return (
          <VisualConditionBuilder
            value={currentValue}
            onChange={(value) => handlePropChange(prop.name, value)}
            label={prop.label}
            formComponents={components}
          />
        );
      case 'validation':
        return (
          <VisualValidationBuilder
            value={currentValue}
            onChange={(value) => handlePropChange(prop.name, value)}
            label={prop.label}
          />
        );
      case 'array':
        const arrayValue = Array.isArray(currentValue) ? currentValue : [];
        return (
          <div className="array-input">
            {arrayValue.map((item, index) => (
              <div key={index} className="array-item">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const newArray = [...arrayValue];
                    newArray[index] = e.target.value;
                    handlePropChange(prop.name, newArray);
                  }}
                  className="prop-input"
                  placeholder={`Item ${index + 1}`}
                />
                <button
                  type="button"
                  className="remove-item-btn"
                  onClick={() => {
                    const newArray = arrayValue.filter((_, i) => i !== index);
                    handlePropChange(prop.name, newArray);
                  }}
                  title="Remove item"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              className="add-item-btn"
              onClick={() => {
                const newArray = [...arrayValue, `Item ${arrayValue.length + 1}`];
                handlePropChange(prop.name, newArray);
              }}
            >
              + Add Item
            </button>
          </div>
        );
      default:
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handlePropChange(prop.name, e.target.value)}
            className="prop-input"
            placeholder={prop.placeholder || `Enter ${prop.label.toLowerCase()}`}
          />
        );
    }
  };

  const renderStyleControls = () => {
    const currentStyle = selectedComponent.props.style || {};
    
    return (
      <div className="style-controls">
        <h4>Styling</h4>
        <div className="style-grid">
          <div className="style-item">
            <label>Background Color</label>
            <input
              type="color"
              value={currentStyle.backgroundColor || '#ffffff'}
              onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
              className="prop-color"
            />
          </div>
          <div className="style-item">
            <label>Text Color</label>
            <input
              type="color"
              value={currentStyle.color || '#000000'}
              onChange={(e) => handleStyleChange('color', e.target.value)}
              className="prop-color"
            />
          </div>
          <div className="style-item">
            <label>Padding</label>
            <input
              type="text"
              value={currentStyle.padding || ''}
              onChange={(e) => handleStyleChange('padding', e.target.value)}
              className="prop-input"
              placeholder="e.g., 8px, 1rem"
            />
          </div>
          <div className="style-item">
            <label>Margin</label>
            <input
              type="text"
              value={currentStyle.margin || ''}
              onChange={(e) => handleStyleChange('margin', e.target.value)}
              className="prop-input"
              placeholder="e.g., 8px, 1rem"
            />
          </div>
          <div className="style-item">
            <label>Border Radius</label>
            <input
              type="text"
              value={currentStyle.borderRadius || ''}
              onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
              className="prop-input"
              placeholder="e.g., 4px, 50%"
            />
          </div>
          <div className="style-item">
            <label>Width</label>
            <input
              type="text"
              value={currentStyle.width || ''}
              onChange={(e) => handleStyleChange('width', e.target.value)}
              className="prop-input"
              placeholder="e.g., 100px, 50%"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <Resizable
      width={panelWidth}
      height={0}
      onResize={(e, { size }) => setPanelWidth(size.width)}
      resizeHandles={['w']}
      minConstraints={[250, 0]}
      maxConstraints={[500, 0]}
    >
      <div className="properties-panel" style={{ width: panelWidth }}>
        <h3><FontAwesomeIcon icon={faCogs} /> Properties</h3>
        <div className="component-info">
          <strong>{componentDef.name}</strong>
          <span className="component-id">#{selectedComponent.id.slice(0, 8)}</span>
        </div>
        
        <div className="properties-list">
          {componentDef.props.map(prop => (
            <div key={prop.name} className="property-item">
              <label className="property-label">{prop.label}</label>
              {renderPropInput(prop)}
            </div>
          ))}
        </div>
        
        {renderStyleControls()}
      </div>
    </Resizable>
  );
};

export default PropertiesPanel;
