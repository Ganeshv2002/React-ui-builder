import React from 'react';
import { CheckboxAdapter } from '../../runtime/adapters.jsx';
import '../Library/Library.css';
export default function Switch({ label='Enable notifications', ...props }) {
  return <CheckboxAdapter {...props} label={label} role="switch" />;
}
