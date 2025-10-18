import React, { useState, useRef, useCallback } from 'react';
import { aiService, type ComponentSpec, type RegistryComponent } from '../ai';
import './CreateComponentModal.css';

interface CreateComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComponentCreate: (component: ComponentSpec) => void;
}

type GenerationMode = 'text' | 'image';
type GenerationStatus = 'idle' | 'initializing' | 'processing' | 'success' | 'error';

export const CreateComponentModal: React.FC<CreateComponentModalProps> = ({
  isOpen,
  onClose,
  onComponentCreate
}) => {
  const [mode, setMode] = useState<GenerationMode>('text');
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<RegistryComponent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [imageAnalysis, setImageAnalysis] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize AI service when modal opens
  React.useEffect(() => {
    if (isOpen && !aiService.isReady()) {
      initializeAI();
    }
  }, [isOpen]);

  const initializeAI = async () => {
    setStatus('initializing');
    setError(null);
    
    try {
      await aiService.initialize();
      setStatus('idle');
    } catch (err) {
      setError(`Failed to initialize AI: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setStatus('error');
    }
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image file too large. Please select a file under 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Analyze the image
    analyzeImage(file);
  }, []);

  const analyzeImage = async (file: File) => {
    try {
      setStatus('processing');
      const analysis = await aiService.analyzeImage(file);
      if (analysis) {
        setImageAnalysis(analysis);
        setDescription(analysis.caption);
        // Get suggestions based on the analysis
        const componentSuggestions = await aiService.getSuggestions(
          `${analysis.caption} ${analysis.suggestions.join(' ')}`,
          5
        );
        setSuggestions(componentSuggestions);
      }
      setStatus('idle');
    } catch (err) {
      setError(`Failed to analyze image: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setStatus('error');
    }
  };

  const handleTextSuggestions = async (text: string) => {
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const componentSuggestions = await aiService.getSuggestions(text, 5);
      setSuggestions(componentSuggestions);
    } catch (err) {
      console.error('Error getting suggestions:', err);
    }
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    if (mode === 'text') {
      // Debounce suggestions
      const timeoutId = setTimeout(() => {
        handleTextSuggestions(value);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  };

  const generateComponent = async () => {
    if (!description.trim()) {
      setError('Please provide a description');
      return;
    }

    setStatus('processing');
    setError(null);

    try {
      let component: ComponentSpec | null = null;

      if (mode === 'image' && selectedFile) {
        component = await aiService.generateFromImage(selectedFile);
      } else {
        component = await aiService.generateFromText(description);
      }

      if (component) {
        setStatus('success');
        onComponentCreate(component);
        handleClose();
      } else {
        setError('Failed to generate component. Please try a different description.');
        setStatus('error');
      }
    } catch (err) {
      setError(`Generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setStatus('error');
    }
  };

  const handleClose = () => {
    // Cleanup
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    // Reset state
    setMode('text');
    setStatus('idle');
    setDescription('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setSuggestions([]);
    setError(null);
    setImageAnalysis(null);
    
    onClose();
  };

  const isProcessing = status === 'initializing' || status === 'processing';
  const canGenerate = description.trim() && !isProcessing && (mode === 'text' || selectedFile);

  if (!isOpen) return null;

  return (
    <div className="create-component-modal-overlay" onClick={handleClose}>
      <div className="create-component-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Component with AI</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>

        <div className="modal-content">
          {/* Mode Selection */}
          <div className="mode-selection">
            <button
              className={`mode-button ${mode === 'text' ? 'active' : ''}`}
              onClick={() => setMode('text')}
              disabled={isProcessing}
            >
              📝 Text Description
            </button>
            <button
              className={`mode-button ${mode === 'image' ? 'active' : ''}`}
              onClick={() => setMode('image')}
              disabled={isProcessing}
            >
              🖼️ Image Upload
            </button>
          </div>

          {/* AI Service Status */}
          {status === 'initializing' && (
            <div className="status-banner initializing">
              🔄 Initializing AI models... This may take a moment.
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="status-banner error">
              ❌ {error}
            </div>
          )}

          {/* Image Upload Mode */}
          {mode === 'image' && (
            <div className="image-section">
              <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
                {previewUrl ? (
                  <div className="image-preview">
                    <img src={previewUrl} alt="Upload preview" />
                    <div className="upload-overlay">
                      <span>Click to change image</span>
                    </div>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <div className="upload-icon">📁</div>
                    <p>Click to upload an image</p>
                    <small>Supports JPG, PNG, GIF (max 10MB)</small>
                  </div>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {/* Image Analysis Results */}
              {imageAnalysis && (
                <div className="analysis-results">
                  <h4>Image Analysis</h4>
                  <p><strong>Description:</strong> {imageAnalysis.caption}</p>
                  {imageAnalysis.suggestions.length > 0 && (
                    <p><strong>Detected Elements:</strong> {imageAnalysis.suggestions.join(', ')}</p>
                  )}
                  <p><strong>Confidence:</strong> 
                    <span className={`confidence ${imageAnalysis.confidence}`}>
                      {imageAnalysis.confidence}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Description Input */}
          <div className="description-section">
            <label htmlFor="description">
              {mode === 'image' ? 'Refine Description (Optional)' : 'Component Description'}
            </label>
            <textarea
              id="description"
              value={description}
              onChange={e => handleDescriptionChange(e.target.value)}
              placeholder={
                mode === 'image' 
                  ? "The AI will analyze your image, but you can refine the description here..."
                  : "Describe the component you want to create. e.g., 'A blue button with rounded corners' or 'A card with user profile information'"
              }
              rows={4}
              disabled={isProcessing}
            />
          </div>

          {/* Component Suggestions */}
          {suggestions.length > 0 && (
            <div className="suggestions-section">
              <h4>Suggested Components</h4>
              <div className="suggestions-grid">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="suggestion-card">
                    <strong>{suggestion.type}</strong>
                    <p>{suggestion.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing Status */}
          {status === 'processing' && (
            <div className="processing-indicator">
              <div className="spinner"></div>
              <p>
                {mode === 'image' && !imageAnalysis ? 'Analyzing image...' : 'Generating component...'}
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="cancel-button"
            onClick={handleClose}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            className="generate-button"
            onClick={generateComponent}
            disabled={!canGenerate}
          >
            {isProcessing ? 'Processing...' : 'Generate Component'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateComponentModal;
