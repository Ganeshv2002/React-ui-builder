import React, { useState, useEffect, useMemo } from 'react';
import { Resizable } from 'react-resizable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCogs } from '@fortawesome/free-solid-svg-icons';
import { usePages } from '../../contexts/PageContext';
import VisualConditionBuilder from '../VisualConditionBuilder/VisualConditionBuilder';
import VisualValidationBuilder from '../VisualValidationBuilder/VisualValidationBuilder';
import variantPersistence from '../../services/variantPersistence';
import { getComponentDefinition } from '../componentRegistry';
import './PropertiesPanel.css';
import 'react-resizable/css/styles.css';

const PropertiesPanel = ({
  selectedComponent,
  onUpdateComponent,
  components = [],
  width,
  minWidth = 260,
  maxWidth = 520,
  onWidthChange,
}) => {
  const defaultWidth = Math.min(Math.max(320, minWidth), maxWidth);
  const isControlledWidth = typeof width === 'number';
  const [uncontrolledWidth, setUncontrolledWidth] = useState(width ?? defaultWidth);
  const panelWidth = isControlledWidth ? width : uncontrolledWidth;
  const [variants, setVariants] = useState([]);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [variantError, setVariantError] = useState(null);
  const { pages } = usePages();

  useEffect(() => {
    if (!isControlledWidth && typeof width === 'number' && !Number.isNaN(width)) {
      const bounded = Math.min(Math.max(Math.round(width), minWidth), maxWidth);
      setUncontrolledWidth(bounded);
    }
  }, [isControlledWidth, maxWidth, minWidth, width]);

  useEffect(() => {
    if (!isControlledWidth) {
      setUncontrolledWidth((current) => {
        const numeric = Number.isNaN(current) ? defaultWidth : Math.round(current);
        return Math.min(Math.max(numeric, minWidth), maxWidth);
      });
    }
  }, [defaultWidth, isControlledWidth, maxWidth, minWidth]);

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

  // Load variants for the selected component type
  useEffect(() => {
    if (selectedComponent?.type) {
      loadVariantsForComponent(selectedComponent.type);
    }
  }, [selectedComponent?.type]);

  const componentDef = useMemo(() => {
    if (!selectedComponent?.type) {
      return null;
    }
    return getComponentDefinition(selectedComponent.type);
  }, [selectedComponent?.type]);

  const loadVariantsForComponent = async (componentType) => {
    try {
      setIsLoadingVariants(true);
      setVariantError(null);
      const componentVariants = await variantPersistence.getVariantsForComponentType(componentType);
      setVariants(componentVariants);
    } catch (error) {
      console.error('Failed to load variants:', error);
      setVariantError('Failed to load variants');
      setVariants([]);
    } finally {
      setIsLoadingVariants(false);
    }
  };
  
  if (!selectedComponent) {
    return (
      <Resizable
        width={panelWidth}
        height={0}
        onResize={(e, { size }) => updateWidth(size.width)}
        onResizeStop={(e, { size }) => updateWidth(size.width)}
        resizeHandles={['w']}
        minConstraints={[minWidth, 0]}
        maxConstraints={[maxWidth, 0]}
      >
        <div className="properties-panel" style={{ width: panelWidth }}>
          <h3><FontAwesomeIcon icon={faCogs} /> Properties</h3>
          <p className="no-selection">Select a component to edit its properties</p>
        </div>
      </Resizable>
    );
  }

  if (!componentDef) {
    return (
      <div className="properties-panel">
        <h3>Properties</h3>
        <p>No properties available for this component</p>
      </div>
    );
  }

  // Note: Avoid hooks (useCallback) after conditional early returns to keep hook order stable.
  // Plain functions here prevent the 'Rendered more hooks than during the previous render' error.
  const handlePropChange = (propName, value) => {
    if (!selectedComponent) return;
    onUpdateComponent(selectedComponent.id, {
      props: {
        ...selectedComponent.props,
        [propName]: value // Always set the value, even if it's empty
      }
    });
  };

  const handleStyleChange = (styleProp, value) => {
    if (!selectedComponent) return;
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
    const currentVariantId = selectedComponent.props.variantId || '';

    const saveVariant = async () => {
      const variantName = prompt('Variant name:');
      if (!variantName) return;

      try {
        const variantData = variantPersistence.createVariantFromComponent(
          selectedComponent, 
          variantName, 
          false // not global by default
        );
        
        const savedVariant = await variantPersistence.createVariant(variantData);
        
        // Apply the new variant to the current component
        const updatedComponent = await variantPersistence.applyVariantToComponent(
          savedVariant.id, 
          selectedComponent.id, 
          selectedComponent
        );
        
        onUpdateComponent(selectedComponent.id, {
          props: updatedComponent.props
        });
        
        // Reload variants for this component type
        await loadVariantsForComponent(selectedComponent.type);
      } catch (error) {
        console.error('Failed to save variant:', error);
        alert('Failed to save variant: ' + error.message);
      }
    };

    const applyVariant = async (variantId) => {
      try {
        const updatedComponent = await variantPersistence.applyVariantToComponent(
          variantId, 
          selectedComponent.id, 
          selectedComponent
        );
        
        onUpdateComponent(selectedComponent.id, {
          props: updatedComponent.props
        });
      } catch (error) {
        console.error('Failed to apply variant:', error);
        alert('Failed to apply variant: ' + error.message);
      }
    };

    const deleteVariant = async (variantId) => {
      if (!confirm('Are you sure you want to delete this variant? This will affect all components using it.')) {
        return;
      }
      
      try {
        await variantPersistence.deleteVariant(variantId);
        
        // If the deleted variant was applied to this component, clear it
        if (currentVariantId === variantId) {
          onUpdateComponent(selectedComponent.id, {
            props: { 
              ...selectedComponent.props, 
              variantId: '', 
              variantName: '',
              variant: undefined
            }
          });
        }
        
        // Reload variants for this component type
        await loadVariantsForComponent(selectedComponent.type);
      } catch (error) {
        console.error('Failed to delete variant:', error);
        alert('Failed to delete variant: ' + error.message);
      }
    };

    const duplicateVariant = async (variantId) => {
      try {
        const duplicatedVariant = await variantPersistence.duplicateVariant(variantId);
        await loadVariantsForComponent(selectedComponent.type);
        
        // Optionally apply the duplicated variant
        await applyVariant(duplicatedVariant.id);
      } catch (error) {
        console.error('Failed to duplicate variant:', error);
        alert('Failed to duplicate variant: ' + error.message);
      }
    };

    const makeGlobalVariant = async (variantId) => {
      try {
        const variant = variantPersistence.getVariant(variantId);
        if (variant) {
          await variantPersistence.updateVariant(variantId, {
            ...variant,
            isGlobal: true,
            projectId: null
          });
          
          await loadVariantsForComponent(selectedComponent.type);
        }
      } catch (error) {
        console.error('Failed to make variant global:', error);
        alert('Failed to make variant global: ' + error.message);
      }
    };
    
    return (
      <div className="style-controls">
        <h4>Styling</h4>
        
        {/* Enhanced Variant Management */}
        <div className="variant-section">
          <div className="variant-header">
            <h5>Variants ({selectedComponent.type})</h5>
            <div className="variant-actions">
              <button type="button" className="add-item-btn" onClick={saveVariant}>
                Save Current Style
              </button>
            </div>
          </div>
          
          {isLoadingVariants && (
            <div className="variant-loading">Loading variants...</div>
          )}
          
          {variantError && (
            <div className="variant-error">{variantError}</div>
          )}
          
          {!isLoadingVariants && variants.length > 0 && (
            <div className="variant-list">
              {variants.map(variant => (
                <div 
                  key={variant.id} 
                  className={`variant-item ${currentVariantId === variant.id ? 'active' : ''}`}
                >
                  <div className="variant-info">
                    <button 
                      type="button" 
                      className="variant-apply-btn" 
                      onClick={() => applyVariant(variant.id)}
                      title={variant.description}
                    >
                      {variant.name}
                      {variant.isGlobal && <span className="global-badge">Global</span>}
                      {variant.isDefault && <span className="default-badge">Default</span>}
                    </button>
                    <div className="variant-meta">
                      {variant.tags && variant.tags.length > 0 && (
                        <span className="variant-tags">
                          {variant.tags.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="variant-controls">
                    <button 
                      type="button" 
                      className="variant-action-btn" 
                      onClick={() => duplicateVariant(variant.id)}
                      title="Duplicate variant"
                    >
                      📋
                    </button>
                    
                    {!variant.isGlobal && (
                      <button 
                        type="button" 
                        className="variant-action-btn" 
                        onClick={() => makeGlobalVariant(variant.id)}
                        title="Make global (available to all projects)"
                      >
                        🌐
                      </button>
                    )}
                    
                    <button 
                      type="button" 
                      className="remove-item-btn" 
                      onClick={() => deleteVariant(variant.id)}
                      title="Delete variant"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!isLoadingVariants && variants.length === 0 && (
            <div className="no-variants">
              No variants found for {selectedComponent.type} components.
              <br />
              <small>Style your component and click "Save Current Style" to create a variant.</small>
            </div>
          )}
        </div>

        {/* Layout & Dimensions */}
        <div className="style-section">
          <h5>Layout & Dimensions</h5>
          <div className="style-grid">
            <div className="style-item">
              <label>Width</label>
              <input
                type="text"
                value={currentStyle.width || ''}
                onChange={(e) => handleStyleChange('width', e.target.value)}
                className="prop-input"
                placeholder="auto, 100px, 50%"
              />
            </div>
            <div className="style-item">
              <label>Height</label>
              <input
                type="text"
                value={currentStyle.height || ''}
                onChange={(e) => handleStyleChange('height', e.target.value)}
                className="prop-input"
                placeholder="auto, 200px, 100vh"
              />
            </div>
            <div className="style-item">
              <label>Min Width</label>
              <input
                type="text"
                value={currentStyle.minWidth || ''}
                onChange={(e) => handleStyleChange('minWidth', e.target.value)}
                className="prop-input"
                placeholder="0, 200px"
              />
            </div>
            <div className="style-item">
              <label>Max Width</label>
              <input
                type="text"
                value={currentStyle.maxWidth || ''}
                onChange={(e) => handleStyleChange('maxWidth', e.target.value)}
                className="prop-input"
                placeholder="none, 500px"
              />
            </div>
            <div className="style-item">
              <label>Display</label>
              <select
                value={currentStyle.display || ''}
                onChange={(e) => handleStyleChange('display', e.target.value)}
                className="prop-select"
              >
                <option value="">default</option>
                <option value="block">block</option>
                <option value="inline">inline</option>
                <option value="inline-block">inline-block</option>
                <option value="flex">flex</option>
                <option value="inline-flex">inline-flex</option>
                <option value="grid">grid</option>
                <option value="none">none</option>
              </select>
            </div>
            <div className="style-item">
              <label>Position</label>
              <select
                value={currentStyle.position || ''}
                onChange={(e) => handleStyleChange('position', e.target.value)}
                className="prop-select"
              >
                <option value="">static</option>
                <option value="relative">relative</option>
                <option value="absolute">absolute</option>
                <option value="fixed">fixed</option>
                <option value="sticky">sticky</option>
              </select>
            </div>
          </div>
        </div>

        {/* Spacing */}
        <div className="style-section">
          <h5>Spacing</h5>
          <div className="style-grid">
            <div className="style-item">
              <label>Padding</label>
              <input
                type="text"
                value={currentStyle.padding || ''}
                onChange={(e) => handleStyleChange('padding', e.target.value)}
                className="prop-input"
                placeholder="8px, 1rem, 10px 20px"
              />
            </div>
            <div className="style-item">
              <label>Margin</label>
              <input
                type="text"
                value={currentStyle.margin || ''}
                onChange={(e) => handleStyleChange('margin', e.target.value)}
                className="prop-input"
                placeholder="8px, 1rem, auto"
              />
            </div>
            <div className="style-item">
              <label>Gap</label>
              <input
                type="text"
                value={currentStyle.gap || ''}
                onChange={(e) => handleStyleChange('gap', e.target.value)}
                className="prop-input"
                placeholder="10px, 1rem"
              />
            </div>
          </div>
        </div>

        {/* Colors & Background */}
        <div className="style-section">
          <h5>Colors & Background</h5>
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
              <label>Background Image</label>
              <input
                type="text"
                value={currentStyle.backgroundImage || ''}
                onChange={(e) => handleStyleChange('backgroundImage', e.target.value)}
                className="prop-input"
                placeholder="url('image.jpg')"
              />
            </div>
            <div className="style-item">
              <label>Background Size</label>
              <select
                value={currentStyle.backgroundSize || ''}
                onChange={(e) => handleStyleChange('backgroundSize', e.target.value)}
                className="prop-select"
              >
                <option value="">auto</option>
                <option value="cover">cover</option>
                <option value="contain">contain</option>
                <option value="100% 100%">stretch</option>
              </select>
            </div>
            <div className="style-item">
              <label>Opacity</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={currentStyle.opacity || '1'}
                onChange={(e) => handleStyleChange('opacity', e.target.value)}
                className="prop-range"
              />
              <span className="range-value">{currentStyle.opacity || '1'}</span>
            </div>
          </div>
        </div>

        {/* Border & Effects */}
        <div className="style-section">
          <h5>Border & Effects</h5>
          <div className="style-grid">
            <div className="style-item">
              <label>Border</label>
              <input
                type="text"
                value={currentStyle.border || ''}
                onChange={(e) => handleStyleChange('border', e.target.value)}
                className="prop-input"
                placeholder="1px solid #ccc"
              />
            </div>
            <div className="style-item">
              <label>Border Radius</label>
              <input
                type="text"
                value={currentStyle.borderRadius || ''}
                onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
                className="prop-input"
                placeholder="4px, 50%, 10px 5px"
              />
            </div>
            <div className="style-item">
              <label>Box Shadow</label>
              <input
                type="text"
                value={currentStyle.boxShadow || ''}
                onChange={(e) => handleStyleChange('boxShadow', e.target.value)}
                className="prop-input"
                placeholder="0 2px 4px rgba(0,0,0,0.1)"
              />
            </div>
            <div className="style-item">
              <label>Filter</label>
              <input
                type="text"
                value={currentStyle.filter || ''}
                onChange={(e) => handleStyleChange('filter', e.target.value)}
                className="prop-input"
                placeholder="blur(5px), brightness(0.8)"
              />
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="style-section">
          <h5>Typography</h5>
          <div className="style-grid">
            <div className="style-item">
              <label>Font Family</label>
              <input
                type="text"
                value={currentStyle.fontFamily || ''}
                onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                className="prop-input"
                placeholder="Arial, sans-serif"
              />
            </div>
            <div className="style-item">
              <label>Font Size</label>
              <input
                type="text"
                value={currentStyle.fontSize || ''}
                onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                className="prop-input"
                placeholder="16px, 1rem, 1.2em"
              />
            </div>
            <div className="style-item">
              <label>Font Weight</label>
              <select
                value={currentStyle.fontWeight || ''}
                onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                className="prop-select"
              >
                <option value="">normal</option>
                <option value="bold">bold</option>
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="300">300</option>
                <option value="400">400</option>
                <option value="500">500</option>
                <option value="600">600</option>
                <option value="700">700</option>
                <option value="800">800</option>
                <option value="900">900</option>
              </select>
            </div>
            <div className="style-item">
              <label>Text Align</label>
              <select
                value={currentStyle.textAlign || ''}
                onChange={(e) => handleStyleChange('textAlign', e.target.value)}
                className="prop-select"
              >
                <option value="">left</option>
                <option value="center">center</option>
                <option value="right">right</option>
                <option value="justify">justify</option>
              </select>
            </div>
            <div className="style-item">
              <label>Line Height</label>
              <input
                type="text"
                value={currentStyle.lineHeight || ''}
                onChange={(e) => handleStyleChange('lineHeight', e.target.value)}
                className="prop-input"
                placeholder="1.5, 24px"
              />
            </div>
            <div className="style-item">
              <label>Text Decoration</label>
              <select
                value={currentStyle.textDecoration || ''}
                onChange={(e) => handleStyleChange('textDecoration', e.target.value)}
                className="prop-select"
              >
                <option value="">none</option>
                <option value="underline">underline</option>
                <option value="overline">overline</option>
                <option value="line-through">line-through</option>
              </select>
            </div>
          </div>
        </div>

        {/* Flexbox */}
        <div className="style-section">
          <h5>Flexbox</h5>
          <div className="style-grid">
            <div className="style-item">
              <label>Flex Direction</label>
              <select
                value={currentStyle.flexDirection || ''}
                onChange={(e) => handleStyleChange('flexDirection', e.target.value)}
                className="prop-select"
              >
                <option value="">row</option>
                <option value="row-reverse">row-reverse</option>
                <option value="column">column</option>
                <option value="column-reverse">column-reverse</option>
              </select>
            </div>
            <div className="style-item">
              <label>Justify Content</label>
              <select
                value={currentStyle.justifyContent || ''}
                onChange={(e) => handleStyleChange('justifyContent', e.target.value)}
                className="prop-select"
              >
                <option value="">flex-start</option>
                <option value="flex-end">flex-end</option>
                <option value="center">center</option>
                <option value="space-between">space-between</option>
                <option value="space-around">space-around</option>
                <option value="space-evenly">space-evenly</option>
              </select>
            </div>
            <div className="style-item">
              <label>Align Items</label>
              <select
                value={currentStyle.alignItems || ''}
                onChange={(e) => handleStyleChange('alignItems', e.target.value)}
                className="prop-select"
              >
                <option value="">stretch</option>
                <option value="flex-start">flex-start</option>
                <option value="flex-end">flex-end</option>
                <option value="center">center</option>
                <option value="baseline">baseline</option>
              </select>
            </div>
            <div className="style-item">
              <label>Flex Wrap</label>
              <select
                value={currentStyle.flexWrap || ''}
                onChange={(e) => handleStyleChange('flexWrap', e.target.value)}
                className="prop-select"
              >
                <option value="">nowrap</option>
                <option value="wrap">wrap</option>
                <option value="wrap-reverse">wrap-reverse</option>
              </select>
            </div>
            <div className="style-item">
              <label>Flex Grow</label>
              <input
                type="number"
                min="0"
                value={currentStyle.flexGrow || ''}
                onChange={(e) => handleStyleChange('flexGrow', e.target.value)}
                className="prop-input"
                placeholder="0"
              />
            </div>
            <div className="style-item">
              <label>Flex Shrink</label>
              <input
                type="number"
                min="0"
                value={currentStyle.flexShrink || ''}
                onChange={(e) => handleStyleChange('flexShrink', e.target.value)}
                className="prop-input"
                placeholder="1"
              />
            </div>
          </div>
        </div>

        {/* Positioning */}
        <div className="style-section">
          <h5>Positioning</h5>
          <div className="style-grid">
            <div className="style-item">
              <label>Top</label>
              <input
                type="text"
                value={currentStyle.top || ''}
                onChange={(e) => handleStyleChange('top', e.target.value)}
                className="prop-input"
                placeholder="0, 10px, auto"
              />
            </div>
            <div className="style-item">
              <label>Right</label>
              <input
                type="text"
                value={currentStyle.right || ''}
                onChange={(e) => handleStyleChange('right', e.target.value)}
                className="prop-input"
                placeholder="0, 10px, auto"
              />
            </div>
            <div className="style-item">
              <label>Bottom</label>
              <input
                type="text"
                value={currentStyle.bottom || ''}
                onChange={(e) => handleStyleChange('bottom', e.target.value)}
                className="prop-input"
                placeholder="0, 10px, auto"
              />
            </div>
            <div className="style-item">
              <label>Left</label>
              <input
                type="text"
                value={currentStyle.left || ''}
                onChange={(e) => handleStyleChange('left', e.target.value)}
                className="prop-input"
                placeholder="0, 10px, auto"
              />
            </div>
            <div className="style-item">
              <label>Z-Index</label>
              <input
                type="number"
                value={currentStyle.zIndex || ''}
                onChange={(e) => handleStyleChange('zIndex', e.target.value)}
                className="prop-input"
                placeholder="auto, 1, 999"
              />
            </div>
          </div>
        </div>

        {/* Transform & Animation */}
        <div className="style-section">
          <h5>Transform & Animation</h5>
          <div className="style-grid">
            <div className="style-item">
              <label>Transform</label>
              <input
                type="text"
                value={currentStyle.transform || ''}
                onChange={(e) => handleStyleChange('transform', e.target.value)}
                className="prop-input"
                placeholder="rotate(45deg), scale(1.2)"
              />
            </div>
            <div className="style-item">
              <label>Transition</label>
              <input
                type="text"
                value={currentStyle.transition || ''}
                onChange={(e) => handleStyleChange('transition', e.target.value)}
                className="prop-input"
                placeholder="all 0.3s ease"
              />
            </div>
            <div className="style-item">
              <label>Animation</label>
              <input
                type="text"
                value={currentStyle.animation || ''}
                onChange={(e) => handleStyleChange('animation', e.target.value)}
                className="prop-input"
                placeholder="fadeIn 1s ease-in"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Resizable
      width={panelWidth}
      height={0}
      onResize={(e, { size }) => updateWidth(size.width)}
      onResizeStop={(e, { size }) => updateWidth(size.width)}
      resizeHandles={['w']}
      minConstraints={[minWidth, 0]}
      maxConstraints={[maxWidth, 0]}
    >
      <div className="properties-panel" style={{ width: panelWidth }}>
        <h3><FontAwesomeIcon icon={faCogs} /> Properties</h3>
        <div className="component-info">
          <strong>{componentDef.name}</strong>
          <span className="component-id">#{selectedComponent.id.slice(0, 8)}</span>
        </div>
        
        <div className="properties-list">
          {(componentDef.props || []).map(prop => (
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
