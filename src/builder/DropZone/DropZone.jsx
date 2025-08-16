import React from 'react';
import { useDrop } from 'react-dnd';
import './DropZone.css';

const DropZone = ({ onDrop, index, isVisible = false }) => {
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
