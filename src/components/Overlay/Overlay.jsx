import React, { useContext, useEffect, useId, useRef, useState } from 'react';
import { DirtyContext } from '../../runtime/dirty.jsx';
import './Overlay.css';

export default function Overlay({ title='Details', triggerLabel='Open', open=false, children, style, editor=false, kind='modal', side='right', onClose }) {
  const [visible, setVisible] = useState(open);
  const dialog = useRef(null);
  const titleId = useId();
  const dirty = useContext(DirtyContext);
  useEffect(() => setVisible(open), [open]);
  useEffect(() => {
    if (editor || !dialog.current) return;
    const element = dialog.current;
    const previous = element.ownerDocument.activeElement;
    if (visible && !element.open) element.showModal();
    if (!visible && element.open) element.close();
    return () => { if (element.open) element.close(); previous?.focus?.(); };
  }, [visible, editor]);
  const close = async () => {
    if (dirty && !await dirty.confirmLeave()) return;
    setVisible(false);
    onClose?.({ target: { value: false } });
  };
  const contents = <><header><h2 id={titleId}>{title}</h2>{!editor && <button type="button" aria-label={'Close '+title} onClick={close}>×</button>}</header><div className="fw-overlay-body">{(editor || visible) && (children || <p>Add content to this {kind}.</p>)}</div></>;
  if (editor) return <section className="fw-overlay fw-overlay-editor" style={style}>{contents}</section>;
  return <>{triggerLabel && <button className="ui-button ui-button--secondary" type="button" onClick={() => setVisible(true)}>{triggerLabel}</button>}<dialog ref={dialog} aria-labelledby={titleId} className={'fw-overlay fw-overlay-'+kind+' fw-overlay-'+side} style={style} onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) { const box=event.currentTarget.getBoundingClientRect(); if (event.clientX<box.left || event.clientX>box.right || event.clientY<box.top || event.clientY>box.bottom) close(); } }}>{contents}</dialog></>;
}
