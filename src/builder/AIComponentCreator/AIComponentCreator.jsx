import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUpload, faImage, faFileText, faSpinner } from '@fortawesome/free-solid-svg-icons';
import aiComponentService from '../../services/aiComponentService';
import './AIComponentCreator.css';

const AIComponentCreator = ({ isOpen, onClose, onComponentCreated }) => {
  const [mode, setMode] = useState('description'); // 'description' or 'image'
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedComponent, setGeneratedComponent] = useState(null);
  const [componentName, setComponentName] = useState('');
  const [componentCategory, setComponentCategory] = useState('Custom');
  const fileInputRef = useRef(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage({
          file,
          preview: e.target.result,
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const generateComponentFromDescription = async (prompt) => {
    try {
      return await aiComponentService.generateFromDescription(prompt);
    } catch (error) {
      console.error('Error generating component from description:', error);
      throw error;
    }
  };

  const generateComponentFromImage = async (imageData) => {
    try {
      return await aiComponentService.generateFromImage(imageData.file);
    } catch (error) {
      console.error('Error generating component from image:', error);
      throw error;
    }
  };

  const handleGenerate = async () => {
    if (!description && !image) return;
    
    setIsGenerating(true);
    try {
      let result;
      if (mode === 'description') {
        result = await generateComponentFromDescription(description);
      } else {
        result = await generateComponentFromImage(image);
      }
      
      setGeneratedComponent(result);
      setComponentName(result.name);
    } catch (error) {
      console.error('Error generating component:', error);
      alert('Error generating component. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveComponent = () => {
    if (!generatedComponent || !componentName) return;

    const newComponent = {
      id: componentName.toLowerCase().replace(/\s+/g, '-'),
      name: componentName,
      category: componentCategory,
      icon: '🤖',
      defaultProps: {
        ...generatedComponent.props.reduce((acc, prop) => {
          acc[prop] = `Sample ${prop}`;
          return acc;
        }, {})
      },
      jsx: generatedComponent.jsx,
      css: generatedComponent.css,
      isCustom: true,
      aiGenerated: true
    };

    onComponentCreated(newComponent);
    handleClose();
  };

  const handleClose = () => {
    setMode('description');
    setDescription('');
    setImage(null);
    setGeneratedComponent(null);
    setComponentName('');
    setComponentCategory('Custom');
    setIsGenerating(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="ai-component-creator-overlay">
      <div className="ai-component-creator">
        <div className="creator-header">
          <h3>🤖 AI Component Creator</h3>
          <button className="close-btn" onClick={handleClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="creator-body">
          {!generatedComponent ? (
            <>
              {/* Mode Selection */}
              <div className="mode-selection">
                <button 
                  className={`mode-btn ${mode === 'description' ? 'active' : ''}`}
                  onClick={() => setMode('description')}
                >
                  <FontAwesomeIcon icon={faFileText} />
                  <span>From Description</span>
                </button>
                <button 
                  className={`mode-btn ${mode === 'image' ? 'active' : ''}`}
                  onClick={() => setMode('image')}
                >
                  <FontAwesomeIcon icon={faImage} />
                  <span>From Image</span>
                </button>
              </div>

              {/* Input Section */}
              {mode === 'description' ? (
                <div className="input-section">
                  <label>Describe the component you want to create:</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., A modern card component with a title, description, and action button..."
                    rows={4}
                  />
                </div>
              ) : (
                <div className="input-section">
                  <label>Upload an image to generate component from:</label>
                  <div className="image-upload">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <button 
                      className="upload-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FontAwesomeIcon icon={faUpload} />
                      <span>Choose Image</span>
                    </button>
                    {image && (
                      <div className="image-preview">
                        <img src={image.preview} alt="Preview" />
                        <p>{image.name}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <div className="generate-section">
                <button 
                  className="generate-btn"
                  onClick={handleGenerate}
                  disabled={isGenerating || (!description && !image)}
                >
                  {isGenerating ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      {/* <FontAwesomeIcon icon={faPlus} /> */}
                      <span>Generate Component</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="result-section">
              <h4>Generated Component Preview</h4>
              
              {/* Component Details */}
              <div className="component-details">
                <div className="detail-group">
                  <label>Component Name:</label>
                  <input
                    type="text"
                    value={componentName}
                    onChange={(e) => setComponentName(e.target.value)}
                    placeholder="Enter component name"
                  />
                </div>
                <div className="detail-group">
                  <label>Category:</label>
                  <select
                    value={componentCategory}
                    onChange={(e) => setComponentCategory(e.target.value)}
                  >
                    <option value="Custom">Custom</option>
                    <option value="Interactive">Interactive</option>
                    <option value="Layout">Layout</option>
                    <option value="Form">Form</option>
                    <option value="Display">Display</option>
                  </select>
                </div>
              </div>

              {/* Code Preview */}
              <div className="code-preview">
                <div className="code-section">
                  <h5>JSX Code:</h5>
                  <pre><code>{generatedComponent.jsx}</code></pre>
                </div>
                <div className="code-section">
                  <h5>CSS Code:</h5>
                  <pre><code>{generatedComponent.css}</code></pre>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="result-actions">
                <button className="secondary-btn" onClick={() => setGeneratedComponent(null)}>
                  ← Back to Editor
                </button>
                <button 
                  className="primary-btn"
                  onClick={handleSaveComponent}
                  disabled={!componentName}
                >
                  Save Component
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIComponentCreator;
