import React from 'react';
import { InputAdapter } from '../../runtime/adapters.jsx';
export default function Select({ label='Choose an option', options=['Option one','Option two','Option three'], placeholder='Select an option', style, ...props }) {
  return <div style={style}><InputAdapter {...{label, options, placeholder}} {...props} type="select" /></div>;
}
