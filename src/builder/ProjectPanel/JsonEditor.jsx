import React, { useState } from 'react';

export default function JsonEditor({ label, value, onApply, validate = v => v, hint }) {
  const [draft, setDraft] = useState(JSON.stringify(value, null, 2));
  const [message, setMessage] = useState('');
  return <div className="config-editor">
    <label>{label}<textarea spellCheck="false" value={draft} onChange={e => { setDraft(e.target.value); setMessage(''); }} /></label>
    {hint && <p>{hint}</p>}
    <div className="config-actions"><button type="button" className="editor-button editor-button--primary" onClick={() => {
      try { const parsed = validate(JSON.parse(draft)); onApply(parsed); setDraft(JSON.stringify(parsed, null, 2)); setMessage('Applied.'); }
      catch (error) { setMessage(error.issues ? error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n') : error.message); }
    }}>Apply changes</button><button type="button" className="editor-button" onClick={() => { setDraft(JSON.stringify(value, null, 2)); setMessage(''); }}>Reset draft</button></div>
    {message && <p role="status" className="config-message">{message}</p>}
  </div>;
}
