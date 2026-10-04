import React from 'react';
import { useDrop } from 'react-dnd';
import './DropZone.css';
import useEditorStore from '../../store/editorStore';

const DropZone = ({ onDrop, index, isVisible = false }) => {
  const free = useEditorStore(state => state.canvasPlacement === 'free');
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'component',
    drop: (item, monitor) => {
      if (!monitor.didDrop()) {
        onDrop(item, index);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  }), [onDrop, index]);

  if (free) return null;
  return (
    <div
      ref={drop}
      className={`drop-zone ${isOver ? 'drop-zone--over' : ''} ${isVisible ? 'drop-zone--visible' : ''}`}
    >
      {isOver && (
        <div className="drop-zone-indicator">
          <span>Drop here to insert</span>
        </div>
      )}
    </div>
  );
};

export default DropZone;
