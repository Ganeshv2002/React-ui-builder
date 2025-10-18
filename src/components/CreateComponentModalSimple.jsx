import React, { useState } from 'react';
import './CreateComponentModal.css';

const CreateComponentModalSimple = ({ isOpen, onClose, onComponentCreate }) => {
  const [description, setDescription] = useState('');

  const handleCreateTest = () => {
    // Create a simple test component
    const testComponent = {
      id: `test-${Date.now()}`,
      type: 'button',
      props: {
        children: description || 'AI Generated Button',
        variant: 'primary',
        size: 'medium'
      }
    };

    onComponentCreate(testComponent);
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="create-component-modal-overlay" onClick={onClose}>
      <div className="create-component-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Test Component</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <div className="description-section">
            <label htmlFor="description">Button Text</label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Enter button text..."
              rows={3}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="generate-button" onClick={handleCreateTest}>
            Create Test Component
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateComponentModalSimple;
