import React from 'react';
import './Footer.css';
export default function Footer({ brand='Your brand', description='Thoughtfully made for you.', copyright='© 2026 Your brand', children, style }) {
  return <footer className="fw-footer" style={style}><div><strong>{brand}</strong><p>{description}</p></div><div className="fw-footer-links">{children}</div><small>{copyright}</small></footer>;
}
