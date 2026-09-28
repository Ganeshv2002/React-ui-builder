import React, { useState } from 'react';
import { FormProvider, useFormContext } from '../contexts/FormContext';
import '../components/Button/Button.css';
import '../components/Input/Input.css';
import '../components/Form/Form.css';
import '../components/Checkbox/Checkbox.css';

export function ButtonAdapter({ runtime, targetPageId, navigateOnValidation, children, onClick, variant = 'primary', size = 'medium', type = 'button', ...props }) {
  return <button {...props} type={type} className={`ui-button ui-button--${variant} ui-button--${size}`} onClick={e => {
    if (navigateOnValidation && e.currentTarget.form && !e.currentTarget.form.reportValidity()) { e.preventDefault(); return; }
    onClick?.(e);
    if (!e.defaultPrevented && targetPageId && !onClick) { e.preventDefault(); runtime.navigate(targetPageId); }
  }}>{children || 'Button'}</button>;
}
export function InputAdapter({ runtime: RuntimeContext, label, value, onChange, readonly, showConditions, disableConditions, validationRules, type = 'text', children: Children, ...props }) {
  void RuntimeContext; void Children;
  const [local, setLocal] = useState(value ?? '');
  // Without a change binding, `value` is only the starting value; otherwise the field could never be edited.
  const [seed, setSeed] = useState(value);
  if (seed !== value) { setSeed(value); setLocal(value ?? ''); }
  const form = useFormContext();
  const parse = input => { try { return typeof input === 'string' ? JSON.parse(input || '[]') : input || []; } catch { return []; } };
  const shown = parse(showConditions), disabled = parse(disableConditions), rules = parse(validationRules);
  if (shown.length && form && !form.checkConditions(shown)) return null;
  const Tag = type === 'textarea' ? 'textarea' : type === 'select' ? 'select' : 'input';
  const current = onChange ? (value ?? '') : local;
  const handleChange = e => {
    const next = ['checkbox', 'radio'].includes(type) ? e.target.checked : e.target.value;
    setLocal(next); onChange?.(e);
    if (form && props.name) form.updateField(props.name, next);
    e.target.setCustomValidity(form?.validateField(props.name, next, rules) || '');
  };
  return <label className="ui-input-container">{label && <span className="ui-input-label">{label}</span>}<Tag {...props} {...(Tag === 'input' ? { type } : {})} readOnly={readonly} disabled={props.disabled || (disabled.length > 0 && form?.checkConditions(disabled))} className="ui-input" {...(type === 'file' ? {} : ['checkbox', 'radio'].includes(type) ? { checked: Boolean(current) } : { value: current })} onChange={handleChange}>{Tag === 'select' ? <option value="">Select an option</option> : undefined}</Tag></label>;
}
export function CheckboxAdapter({ runtime: RuntimeContext, label, checked, onChange, style, children: Children, ...props }) {
  void RuntimeContext; void Children;
  const [local, setLocal] = useState(Boolean(checked));
  return <label className="ui-checkbox" style={style}><input {...props} type="checkbox" checked={onChange ? Boolean(checked) : local} onChange={e => { setLocal(e.target.checked); onChange?.(e); }} />{label}</label>;
}
export function FormAdapter({ runtime, children, action: Action, method: Method, targetPageId, navigateOnSuccess, onSubmit, ...props }) {
  void Action; void Method;
  return <FormProvider><form {...props} className="ui-form" onSubmit={e => {
    e.preventDefault();
    if (!e.currentTarget.reportValidity()) return;
    if (onSubmit) onSubmit(e);
    else if (navigateOnSuccess && targetPageId) runtime.navigate(targetPageId);
  }}>{children}</form></FormProvider>;
}
export function NavigationAdapter({ runtime, targetPageId, children, onClick, ...props }) {
  const destination = runtime.pages.find(p => p.id === targetPageId);
  if (!destination) return <span>Missing destination</span>;
  return <a {...props} href={`#${destination.path}`} onClick={e => { e.preventDefault(); if (onClick) onClick(e); else runtime.navigate(targetPageId); }}>{children || destination.name}</a>;
}
