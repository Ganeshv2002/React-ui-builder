import React from 'react';
import './Checkbox.css';

const Checkbox = ({ 
  label = 'Checkbox label',
  checked = false,
  disabled = false,
  name,
  value,
  onChange,
  style, 
  ...props 
}) => {
  return (
    <label className="ui-checkbox" style={style}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        name={name}
        value={value}
        onChange={onChange}
        className="ui-checkbox-input"
        {...props}
      />
      <span className="ui-checkbox-checkmark"></span>
      <span className="ui-checkbox-label">{label}</span>
    </label>
  );
};

export default Checkbox;
