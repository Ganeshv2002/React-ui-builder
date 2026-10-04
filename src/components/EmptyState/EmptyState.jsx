import React from 'react';
import '../Library/Library.css';
export default function EmptyState({ title='Nothing here yet', description='Your content will appear here when you add it.', style }) {
return <section className="fw-library fw-library-empty" style={style}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 7h16v13H4zM8 7V4h8v3M9 12h6"/></svg><h3>{title}</h3><p>{description}</p></section>;
}
