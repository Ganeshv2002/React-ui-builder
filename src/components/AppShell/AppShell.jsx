import React from 'react';
import './AppShell.css';
export default function AppShell({ children, background='#f8f7fb', accent='#6842e8', maxWidth=1180, style }) {
  return <main className="fw-app-shell" style={{background,'--primary':accent,'--fw-shell-width':maxWidth+'px',...style}}><div className="fw-app-shell-content">{children}</div></main>;
}
