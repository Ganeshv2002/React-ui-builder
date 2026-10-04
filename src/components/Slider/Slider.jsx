import React from 'react';
import { InputAdapter } from '../../runtime/adapters.jsx';
export default function Slider({ label='Volume', min=0, max=100, step=1, value=50, style, ...props }) {
  return <div style={style}><InputAdapter {...{label, min, max, step, value}} {...props} type="range" /></div>;
}
