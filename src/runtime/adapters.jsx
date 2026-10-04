import React, { useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { FieldsContext } from './fields.js';
import { DirtyContext } from './dirty.jsx';
import { parseRuleList, validateValue } from './conditions.js';
import '../components/Button/Button.css';
import '../components/Input/Input.css';
import '../components/Form/Form.css';
import '../components/Checkbox/Checkbox.css';

export function ButtonAdapter({ runtime, targetPageId, navigateOnValidation, children, onClick, variant = 'primary', size = 'medium', type = 'button', ...props }) {
  const fields = useContext(FieldsContext);
  return <button {...props} type={type} className={`ui-button ui-button--${variant} ui-button--${size}`} onClick={e => {
    if (navigateOnValidation) fields?.revealErrors();
    if (navigateOnValidation && e.currentTarget.form && !e.currentTarget.form.checkValidity()) { e.preventDefault(); return; }
    onClick?.(e);
    if (!e.defaultPrevented && targetPageId && !onClick) { e.preventDefault(); runtime.navigate(targetPageId); }
  }}>{children || 'Button'}</button>;
}
export function InputAdapter({ runtime: RuntimeContext, label, value, onChange, onBlur, readonly, required, validationRules, options = [], type = 'text', children: Children, ...props }) {
  void RuntimeContext; void Children;
  const fields = useContext(FieldsContext);
  const element = useRef(null);
  const [local, setLocal] = useState(value ?? '');
  // Without a change binding, `value` is only the starting value; otherwise the field could never be edited.
  const [seed, setSeed] = useState(value);
  if (seed !== value) { setSeed(value); setLocal(value ?? ''); }
  const [touched, setTouched] = useState(false);
  const isCheck = ['checkbox', 'radio'].includes(type);
  const current = local;
  const fieldValue = isCheck ? Boolean(current) : current;
  const rules = parseRuleList(validationRules);
  if (required && !rules.some(rule => rule.type === 'required')) rules.unshift({ type: 'required' });
  const error = props.disabled ? null : validateValue(rules, fieldValue);
  const setField = fields?.setField;
  useEffect(() => { if (setField && props.name) setField(props.name, fieldValue); }, [setField, props.name, fieldValue]);
  // Form submission and "navigate after validation" buttons read this through reportValidity().
  useEffect(() => { element.current?.setCustomValidity(error || ''); }, [error]);
  const showError = Boolean(error) && (touched || fields?.showAllErrors);
  const Tag = type === 'textarea' ? 'textarea' : type === 'select' ? 'select' : 'input';
  const handleChange = e => {
    setLocal(isCheck ? e.target.checked : e.target.value);
    setTouched(true);
    onChange?.(e);
  };
  return <label className="ui-input-container">
    {label && <span className="ui-input-label">{label}{required && <span className="ui-input-required">*</span>}</span>}
    <Tag {...props} ref={element} {...(Tag === 'input' ? { type } : {})} required={required} readOnly={readonly} aria-invalid={showError || undefined} className={`ui-input${showError ? ' ui-input--error' : ''}`} {...(type === 'file' ? {} : isCheck ? { checked: Boolean(current) } : { value: current })} onChange={handleChange} onBlur={e => { setTouched(true); onBlur?.(e); }}>{Tag === 'select' ? <><option value="">{props.placeholder || 'Select an option'}</option>{options.map((option, index) => <option key={index} value={option}>{option}</option>)}</> : undefined}</Tag>
    {showError && <span className="ui-input-error" role="alert">{error}</span>}
  </label>;
}
export function CheckboxAdapter({ runtime: RuntimeContext, label, checked, onChange, style, children: Children, ...props }) {
  void RuntimeContext; void Children;
  const fields = useContext(FieldsContext);
  const [local, setLocal] = useState(Boolean(checked));
  const [seed, setSeed] = useState(checked);
  if (seed !== checked) { setSeed(checked); setLocal(Boolean(checked)); }
  const current = local;
  const setField = fields?.setField;
  useEffect(() => { if (setField && props.name) setField(props.name, current); }, [setField, props.name, current]);
  return <label className={props.role === 'switch' ? 'fw-library fw-library-switch' : 'ui-checkbox'} style={style}><input {...props} type="checkbox" checked={current} onChange={e => { setLocal(e.target.checked); onChange?.(e); }} />{label}</label>;
}
export function FormAdapter({ runtime, children, action: Action, method: Method, targetPageId, navigateOnSuccess, onSubmit, trackDirty = false, formId, ...props }) {
  void Action; void Method;
  const fields = useContext(FieldsContext);
  const dirty = useContext(DirtyContext);
  const generatedId = useId();
  const id = formId || generatedId;
  const form = useRef(null), baseline = useRef(''), submitting = useRef(false);
  const [changed, setChanged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const serialize = () => form.current ? JSON.stringify([...new FormData(form.current)].map(([key, value]) => [key, typeof value === 'string' ? value : {name:value.name,size:value.size,lastModified:value.lastModified}])) : '';
  const register = dirty?.register;
  const reset = useCallback(() => {
    baseline.current = serialize(); setChanged(false);
    register?.(id, {dirty:false, reset});
  }, [register, id]);
  useEffect(() => {
    if (!trackDirty || !register) return;
    reset();
    return () => register(id, null);
  }, [trackDirty, register, id, reset]);
  return <form {...props} ref={form} noValidate className="ui-form" aria-busy={busy} onChangeCapture={() => {
    setSubmitError('');
    if (!trackDirty) return;
    const next = serialize() !== baseline.current;
    setChanged(next); register?.(id, {dirty:next, reset});
  }} onSubmit={async e => {
    e.preventDefault();
    if (submitting.current) return;
    fields?.revealErrors();
    if (!e.currentTarget.checkValidity()) return;
    if (onSubmit) {
      submitting.current = true; setBusy(true);
      try { const result = await onSubmit(e); setSubmitError(result?.error || ''); }
      catch (error) { setSubmitError(error.message); }
      finally { submitting.current = false; setBusy(false); }
    }
    else if (navigateOnSuccess && targetPageId) runtime.navigate(targetPageId);
  }}>{children}{submitError && <p role="alert" className="ui-input-error">{submitError}</p>}{trackDirty && <span className="fw-form-dirty" role="status">{changed ? 'Unsaved changes' : 'All changes saved'}</span>}</form>;
}
export function NavigationAdapter({ runtime, targetPageId, children, onClick, ...props }) {
  const destination = runtime.pages.find(p => p.id === targetPageId);
  if (!destination) return <span>Missing destination</span>;
  return <a {...props} href={`#${destination.path}`} onClick={e => { e.preventDefault(); if (onClick) onClick(e); else runtime.navigate(targetPageId); }}>{children || destination.name}</a>;
}
