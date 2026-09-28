import React from 'react';
import { usePages } from '../../contexts/PageContext';
import { resolveToken } from '../../runtime/theme';

export default function TokenField({ value, onChange, type = 'dimension', label = 'Value' }) {
  const { theme } = usePages();
  const token = value && typeof value === 'object' ? value.$token : '';
  const choices = Object.entries(theme.tokens).filter(([, t]) => t.type === type || (type === 'dimension' && t.type === 'number'));
  return <div className="token-field">
    <div className="token-field-value">
      {type === 'color' && <input aria-label={`${label} color`} type="color" value={typeof value === 'string' && /^#[\da-f]{6}$/i.test(value) ? value : '#000000'} onChange={e => onChange(e.target.value)} />}
      <input aria-label={`${label} value`} type="text" value={token ? String(resolveToken(theme, token)) : value ?? ''} disabled={Boolean(token)} placeholder={type === 'dimension' ? 'auto, 16px, 100%' : 'Custom value'} onChange={e => onChange(e.target.value)} />
    </div>
    <select aria-label={`${label} theme token`} value={token || ''} onChange={e => onChange(e.target.value ? { $token: e.target.value } : token ? resolveToken(theme, token) : value)}>
      <option value="">Custom value</option>
      {choices.map(([name]) => <option key={name} value={name}>{name}</option>)}
      {token && !choices.some(([name]) => name === token) && <option value={token}>{token}</option>}
    </select>
  </div>;
}
