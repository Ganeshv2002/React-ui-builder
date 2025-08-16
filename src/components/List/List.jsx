import React from 'react';
import './List.css';

const List = ({ 
  type = 'unordered',
  items = ['List item 1', 'List item 2', 'List item 3'],
  style, 
  ...props 
}) => {
  const ListTag = type === 'ordered' ? 'ol' : 'ul';
  
  return (
    <ListTag 
      className={`ui-list ui-list--${type}`}
      style={style}
      {...props}
    >
      {items.map((item, index) => (
        <li key={index} className="ui-list-item">
          {item}
        </li>
      ))}
    </ListTag>
  );
};

export default List;
