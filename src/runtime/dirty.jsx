import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';

export const DirtyContext = createContext(null);

export function DirtyProvider({ children }) {
  const forms = useRef(new Map());
  const confirmation = useRef(null), answer = useRef(null);
  const [asking, setAsking] = useState(false);
  const [isDirty, setDirty] = useState(false);
  const refresh = useCallback(() => setDirty([...forms.current.values()].some(form => form.dirty)), []);
  const register = useCallback((id, entry) => {
    if (entry) forms.current.set(id, entry); else forms.current.delete(id);
    refresh();
  }, [refresh]);
  const markClean = useCallback(id => {
    for (const [key, form] of forms.current) if (!id || id === key) form.reset();
    refresh();
  }, [refresh]);
  const confirmLeave = useCallback(() => {
    if (![...forms.current.values()].some(form => form.dirty)) return Promise.resolve(true);
    if (answer.current) return Promise.resolve(false);
    return new Promise(resolve => { answer.current = resolve; setAsking(true); });
  }, []);
  const settle = value => {
    confirmation.current?.close?.();
    setAsking(false);
    answer.current?.(value); answer.current = null;
  };
  useEffect(() => {
    if (asking && confirmation.current && !confirmation.current.open) {
      if (confirmation.current.showModal) confirmation.current.showModal();
      else confirmation.current.setAttribute('open', '');
    }
  }, [asking]);
  useEffect(() => () => { answer.current?.(false); }, []);
  useEffect(() => {
    const warn = event => {
      if (![...forms.current.values()].some(form => form.dirty)) return;
      event.preventDefault(); event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);
  return <DirtyContext.Provider value={{ register, markClean, confirmLeave, isDirty }}>{children}
    {asking && <dialog ref={confirmation} className="fw-overlay" aria-labelledby="fw-unsaved-title" onCancel={event => { event.preventDefault(); settle(false); }}>
      <header><h2 id="fw-unsaved-title">Leave without saving?</h2></header>
      <div className="fw-overlay-body"><p>You have unsaved changes. Keep editing to save your changes, or discard them and leave.</p>
        <div style={{display:'flex',gap:12,justifyContent:'flex-end'}}>
          <button type="button" className="ui-button ui-button--secondary" onClick={() => settle(false)}>Keep editing</button>
          <button type="button" className="ui-button ui-button--primary" onClick={() => settle(true)}>Discard changes</button>
        </div>
      </div>
    </dialog>}
  </DirtyContext.Provider>;
}
