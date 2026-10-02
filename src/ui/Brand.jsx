import React from 'react';

export default function Brand({ compact = false }) {
  return <div className={compact ? 'fw-brand' : 'editor-brand'}>
    <span className={compact ? 'fw-brand-icon' : 'editor-logo'}>
      <svg viewBox="0 0 32 32" width="25" height="25" fill="none" aria-hidden="true"><path d="M7 25V7h18M7 16h13M16 25V16h9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" /></svg>
    </span>
    <div><strong>Framewright</strong>{!compact && <small>The visual React workspace.</small>}</div>
    <span className={compact ? 'fw-beta' : 'editor-beta'}>BETA</span>
  </div>;
}
