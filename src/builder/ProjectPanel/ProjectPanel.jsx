import React, { useEffect, useRef, useState } from 'react';
import { IconX, IconFileCode, IconPalette, IconArrowDown, IconArrowUp, IconBraces } from '@tabler/icons-react';
import { usePages } from '../../contexts/PageContext';
import { parseProject, logicSchema } from '../../runtime/project';
import { parseThemeFile, resolveToken, defaultTheme } from '../../runtime/theme';
import { registry } from '../../runtime/registry';
import { generateConfigApp } from '../../utils/configAppGenerator';
import { createAndDownloadZip, downloadSingleFile } from '../../utils/downloadUtils';
import JsonEditor from './JsonEditor';
import './ProjectPanel.css';

export default function ProjectPanel({ section, onClose }) {
  const { pages, theme, setTheme, metadata, setMetadata, getCurrentPage, updatePage, exportProject, importProject, previousProject, restorePreviousProject } = usePages();
  const [tab, setTab] = useState(section);
  const [candidate, setCandidate] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const dialog = useRef(null);
  const projectInput = useRef(null), themeInput = useRef(null);
  const page = getCurrentPage();
  useEffect(() => { dialog.current.showModal(); }, []);
  const report = error => setMessage(error.issues ? error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n') : error.message);
  const downloadJSON = () => { try { downloadSingleFile(JSON.stringify(exportProject(), null, 2), 'app.config.json', 'application/json'); setMessage('Project JSON exported.'); } catch (error) { report(error); } };
  const importFile = async (event, kind) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      if (file.size > 5_000_000) throw new Error('File exceeds 5 MB.');
      const text = await file.text();
      if (kind === 'theme') { setCandidate({ kind, value: parseThemeFile(text, file.name) }); }
      else setCandidate({ kind, value: parseProject(text) });
      setMessage('File validated. Review the summary below before applying.');
    } catch (error) { setCandidate(null); report(error); }
  };
  const unknown = [];
  function collect(nodes) { for (const node of nodes) { if (!registry[node.type] && !unknown.includes(node.type)) unknown.push(node.type); collect(node.children || []); } }
  if (candidate?.kind === 'project') candidate.value.pages.forEach(p => collect(p.layout));
  return <dialog ref={dialog} className="project-dialog" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <header><div><span className="editor-eyebrow">FRAMEWRIGHT WORKSPACE</span><h2>Project settings</h2></div><button className="editor-tool" aria-label="Close project settings" onClick={onClose}><IconX size={20} /></button></header>
    <nav>{[['project', IconFileCode, 'Project files'], ['theme', IconPalette, 'Theme tokens'], ['logic', IconBraces, 'Page behavior']].map(([id, Icon, name]) => <button key={id} className={tab === id ? 'is-active' : ''} onClick={() => { setTab(id); setMessage(''); }}>{React.createElement(Icon, { size: 17 })}{name}</button>)}</nav>
    <div className="project-dialog-body">
      {tab === 'project' && <>
        <h3>Your app, in one configuration.</h3><p>Download the React boilerplate once. After editing pages, replace its <code>src/app.config.json</code> with your latest JSON export.</p>
        <label className="project-name">Project name<input value={metadata.name || ''} onChange={e => setMetadata({ ...metadata, name: e.target.value })} /></label>
        <div className="project-file-cards">
          <button onClick={downloadJSON}><IconArrowDown /><strong>Export JSON</strong><span>{pages.length} pages · routes, theme and behavior</span></button>
          <button onClick={() => projectInput.current.click()}><IconArrowUp /><strong>Import JSON</strong><span>Reopen and edit a saved project</span></button>
          <button disabled={busy} onClick={async () => { setBusy(true); try { const ok = await createAndDownloadZip(generateConfigApp(exportProject()), 'framewright-app.zip'); if (!ok) throw new Error('Could not create ZIP.'); setMessage('React boilerplate downloaded.'); } catch (error) { report(error); } finally { setBusy(false); } }}><IconFileCode /><strong>{busy ? 'Preparing…' : 'React boilerplate'}</strong><span>Components, adapters, runtime and JSON</span></button>
        </div>
        <input hidden ref={projectInput} aria-label="Import project JSON file" type="file" accept=".json,application/json" onChange={e => importFile(e, 'project')} />
        {previousProject && <button className="editor-button" onClick={() => { restorePreviousProject(); setMessage('Previous project restored.'); }}>Undo last project import</button>}
        <p className="project-note">Component implementations live in the adapter registry. Keep that code when replacing your JSON. Unknown component IDs are preserved and shown as placeholders until an adapter is registered.</p>
      </>}
      {tab === 'theme' && <>
        <h3>One theme. Every component.</h3><p>Import a JSON token file or a CSS file with a single <code>:root</code> block. Choose tokens beside color, size, spacing and font controls in the inspector.</p>
        <div className="config-actions"><button className="editor-button editor-button--primary" onClick={() => themeInput.current.click()}><IconArrowUp size={16} />Import theme</button><button className="editor-button" onClick={() => downloadSingleFile(JSON.stringify(theme, null, 2), 'theme.tokens.json', 'application/json')}>Export theme</button><button className="editor-button" onClick={() => downloadSingleFile(JSON.stringify(defaultTheme, null, 2), 'example.tokens.json', 'application/json')}>Example file</button></div>
        <input hidden ref={themeInput} aria-label="Import theme file" type="file" accept=".json,.css" onChange={e => importFile(e, 'theme')} />
        <h4>{theme.name} <span className="token-count">{Object.keys(theme.tokens).length} tokens</span></h4>
        <div className="theme-token-list">{Object.entries(theme.tokens).map(([name, token]) => <div key={name}>{token.type === 'color' ? <i style={{ background: resolveToken(theme, name) }} /> : <IconBraces size={16} />}<strong>{name}</strong><span>{String(resolveToken(theme, name))}</span><small>{token.type}</small></div>)}</div>
      </>}
      {tab === 'logic' && <>
        <h3>{page.name} · Page behavior</h3><p>Configure initial state, API resources, named actions, validation groups and mount/change effects. Components refer to action IDs in their Behavior tab.</p>
        <details><summary>Binding and action reference</summary><p><code>{'{"$state":"email"}'}</code> reads state; <code>{'{"$event":"value"}'}</code> reads an input event. Actions support setState, validate, request, navigate and custom handlers. Effects run on mount or changes to explicit state paths.</p><pre>{JSON.stringify({ state: { email: '' }, resources: {}, actions: { updateEmail: [{ type: 'setState', path: 'email', value: { $event: 'value' } }] }, effects: [], validation: {} }, null, 2)}</pre></details>
        <JsonEditor key={page.id} label="Page behavior JSON" value={page.logic || logicSchema.parse({})} validate={v => {
          const logic = logicSchema.parse(v);
          parseProject({ ...exportProject(), pages: pages.map(p => p.id === page.id ? { ...p, logic } : p) });
          return logic;
        }} onApply={logic => updatePage(page.id, { logic })} hint="Requests are disabled by default in Preview. Custom handlers are registered in the exported boilerplate." />
      </>}
      {candidate && <section className="import-review"><h3>Review import</h3><p>{candidate.kind === 'project' ? `${candidate.value.name}: ${candidate.value.pages.length} pages. This replaces the current project; you can undo the import while this session is open.` : `${candidate.value.name}: ${Object.keys(candidate.value.tokens).length} tokens. Matching token names will update existing components.`}</p>{unknown.length > 0 && <p>Adapters to register: {unknown.join(', ')}</p>}<div className="config-actions"><button className="editor-button editor-button--primary" onClick={() => { try {
        if (candidate.kind === 'project') { importProject(candidate.value); }
        else setTheme({ ...candidate.value, tokens: { ...theme.tokens, ...candidate.value.tokens } });
        setCandidate(null); setMessage('Import applied.');
      } catch (error) { report(error); } }}>Apply import</button><button className="editor-button" onClick={() => setCandidate(null)}>Cancel</button></div></section>}
      {message && <p role="status" className="config-message">{message}</p>}
    </div>
  </dialog>;
}
