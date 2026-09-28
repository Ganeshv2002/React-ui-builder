import React, { useContext, useEffect, useRef, useState } from 'react';
import { FieldsContext } from './fields.js';
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
export function InputAdapter({ runtime: RuntimeContext, label, value, onChange, onBlur, readonly, required, validationRules, type = 'text', children: Children, ...props }) {
  void RuntimeContext; void Children;
  const fields = useContext(FieldsContext);
  const element = useRef(null);
  const [local, setLocal] = useState(value ?? '');
  // Without a change binding, `value` is only the starting value; otherwise the field could never be edited.
  const [seed, setSeed] = useState(value);
  if (seed !== value) { setSeed(value); setLocal(value ?? ''); }
  const [touched, setTouched] = useState(false);
  const isCheck = ['checkbox', 'radio'].includes(type);
  const current = onChange ? (value ?? '') : local;
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
    <Tag {...props} ref={element} {...(Tag === 'input' ? { type } : {})} required={required} readOnly={readonly} aria-invalid={showError || undefined} className={`ui-input${showError ? ' ui-input--error' : ''}`} {...(type === 'file' ? {} : isCheck ? { checked: Boolean(current) } : { value: current })} onChange={handleChange} onBlur={e => { setTouched(true); onBlur?.(e); }}>{Tag === 'select' ? <option value="">Select an option</option> : undefined}</Tag>
    {showError && <span className="ui-input-error" role="alert">{error}</span>}
  </label>;
}
export function CheckboxAdapter({ runtime: RuntimeContext, label, checked, onChange, style, children: Children, ...props }) {
  void RuntimeContext; void Children;
  const fields = useContext(FieldsContext);
  const [local, setLocal] = useState(Boolean(checked));
  const current = onChange ? Boolean(checked) : local;
  const setField = fields?.setField;
  useEffect(() => { if (setField && props.name) setField(props.name, current); }, [setField, props.name, current]);
  return <label className="ui-checkbox" style={style}><input {...props} type="checkbox" checked={current} onChange={e => { setLocal(e.target.checked); onChange?.(e); }} />{label}</label>;
}
export function FormAdapter({ runtime, children, action: Action, method: Method, targetPageId, navigateOnSuccess, onSubmit, ...props }) {
  void Action; void Method;
  const fields = useContext(FieldsContext);
  return <form {...props} noValidate className="ui-form" onSubmit={e => {
    e.preventDefault();
    fields?.revealErrors();
    if (!e.currentTarget.checkValidity()) return;
    if (onSubmit) onSubmit(e);
    else if (navigateOnSuccess && targetPageId) runtime.navigate(targetPageId);
  }}>{children}</form>;
}
export function NavigationAdapter({ runtime, targetPageId, children, onClick, ...props }) {
  const destination = runtime.pages.find(p => p.id === targetPageId);
  if (!destination) return <span>Missing destination</span>;
  return <a {...props} href={`#${destination.path}`} onClick={e => { e.preventDefault(); if (onClick) onClick(e); else runtime.navigate(targetPageId); }}>{children || destination.name}</a>;
}
