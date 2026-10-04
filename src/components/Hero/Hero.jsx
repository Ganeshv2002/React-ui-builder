import React from 'react';
import './Hero.css';
export default function Hero({ eyebrow='EXPERIENCES WORTH SHARING', title='Make your next memory.', description='Discover something extraordinary, right around the corner.', detail='A little anticipation. A lot to look forward to.', children, style }) {
  return <section className="fw-hero" style={style}><div className="fw-hero-copy"><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p>{children}</div><div className="fw-hero-art" aria-hidden="true"><div className="fw-hero-orbit"/><div className="fw-hero-ticket"><span>ADMIT ONE</span><strong>GOOD<br/>TIMES.</strong><div>|||| ||| || ||||| ||||</div></div><small>{detail}</small></div></section>;
}
