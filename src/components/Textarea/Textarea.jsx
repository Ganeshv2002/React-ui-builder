import React from 'react';
import { InputAdapter } from '../../runtime/adapters.jsx';
export default function Textarea({ label='Message', rows=4, placeholder='Write your message…', style, ...props }) {
  return <div style={style}><InputAdapter {...{label, rows, placeholder}} {...props} type="textarea" /></div>;
}
