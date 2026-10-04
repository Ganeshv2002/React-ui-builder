import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  IconPlus, IconSearch, IconLayoutGrid, IconList, IconFolder, IconStar,
  IconArrowUpRight, IconArrowRight, IconUpload, IconDeviceDesktop,
  IconLayout, IconX, IconDots, IconCopy, IconDownload, IconCode,
} from '@tabler/icons-react';
import { usePages } from '../contexts/PageContext';
import { createProject, parseProject } from '../runtime/project';
import { downloadSingleFile } from '../utils/downloadUtils';
import { countComponents } from '../utils/layoutTree';
import { makeTemplate, templates } from './templates';
import './Dashboard.css';
import { useMediaQuery } from '@mantine/hooks';
import Brand from '../ui/Brand';
import { ThemeToggle } from '../builder/ThemeToggle/ThemeToggle';
import variantPersistence from '../services/variantPersistence';

const FAVORITES_KEY = 'framewright:favorite-projects';
const titleOf = project => project.metadata.name || 'Untitled project';
const toConfig = project => createProject(project.pages, project.theme, project.metadata);
function editedLabel(date) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000));
  if (minutes < 1) return 'Edited just now';
  if (minutes < 60) return `Edited ${minutes}m ago`;
  if (minutes < 1440) return `Edited ${Math.floor(minutes / 60)}h ago`;
  return `Edited ${Math.floor(minutes / 1440)}d ago`;
}

// A small schematic of the saved layout. It does not run page effects or requests.
function LayoutThumbnail({ kind = 'landing', project }) {
  const nodes = project?.pages.find(p => p.isHome)?.layout || project?.pages[0]?.layout || [];
  const count = project ? project.pages.reduce((n, p) => n + countComponents(p.layout), 0) : 1;
  const flatten = list => list.flatMap(n => [n, ...flatten(n.children || [])]);
  const all = flatten(nodes);
  const title = all.find(n => n.type === 'heading')?.props?.text;
  if (project && !count) return <div className="fw-thumb fw-thumb--empty"><IconLayout size={30} stroke={1} /><span>A fresh canvas</span></div>;
  const variant = project ? (all.some(n => n.type === 'form') ? 'contact' : all.some(n => n.type === 'statCard') ? 'dashboard' : 'landing') : kind;
  return <div className={`fw-thumb fw-thumb--${variant}`} aria-hidden="true">
    <div className="fw-mini-window"><div className="fw-mini-toolbar"><i /><i /><i /><span /></div>
      <div className="fw-mini-content"><div className="fw-mini-nav"><i /><i /><i /><i /></div>
        <div className="fw-mini-body"><div className="fw-mini-heading">{typeof title === 'string' ? title : ''}</div><div className="fw-mini-line" />
          <div className="fw-mini-blocks"><i /><i /><i /></div><div className="fw-mini-bottom"><i /><i /></div>
        </div>
      </div>
    </div>
  </div>;
}

function NewProjectDialog({ template, onClose, onCreate }) {
  const dialog = useRef(null);
  const [name, setName] = useState(template?.name || 'Untitled project');
  const [selected, setSelected] = useState(template?.id || 'blank');
  const [error, setError] = useState('');
  useEffect(() => { dialog.current.showModal(); }, []);
  return <dialog ref={dialog} className="fw-new-dialog" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }} aria-labelledby="fw-new-title">
    <header><div><span className="fw-eyebrow">A NEW BEGINNING</span><h2 id="fw-new-title">Create a project</h2></div><button className="fw-icon-button" onClick={onClose} aria-label="Close new project"><IconX size={20} /></button></header>
    <form onSubmit={e => { e.preventDefault(); try { onCreate(makeTemplate(selected, name.trim())); } catch (err) { setError(err.message); } }}>
      <label>Project name<input autoFocus required maxLength={120} value={name} onChange={e => setName(e.target.value)} placeholder="My next idea" /></label>
      <label>Starting point<select value={selected} onChange={e => setSelected(e.target.value)}><option value="blank">Blank canvas</option>{templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      <p>Your current work stays in Projects. Everything saves in this browser.</p>
      {error && <p role="alert" className="fw-error">{error}</p>}
      <footer><button type="button" className="fw-button" onClick={onClose}>Cancel</button><button className="fw-button fw-button--primary" disabled={!name.trim()}>Create project<IconArrowRight size={16} /></button></footer>
    </form>
  </dialog>;
}

export default function Dashboard({ onOpenEditor, user, onAccount }) {
  const { workspaceId, workspaceProjects, openWorkspace, createWorkspace, saveStatus, legacyWorkspaceAvailable, importLegacyWorkspace, storageKey } = usePages();
  const favoritesKey = `${storageKey}:${FAVORITES_KEY}`;
  const [section, setSection] = useState('projects');
  const mobile = useMediaQuery('(max-width: 600px)');
  const [query, setQuery] = useState('');
  const [view, setView] = useState('grid');
  const [sort, setSort] = useState('recent');
  const [dialog, setDialog] = useState(null);
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState('');
  const input = useRef(null);
  const menuRef = useRef(null);
  const [favorites, setFavorites] = useState(() => {
    try { const value = JSON.parse(localStorage.getItem(favoritesKey) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; }
  });
  useEffect(() => {
    if (!menu) return;
    const close = e => { if (e.key === 'Escape' || (e.type === 'pointerdown' && !menuRef.current?.contains(e.target))) setMenu(null); };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', close);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close); };
  }, [menu]);
  const filtered = useMemo(() => workspaceProjects
    .filter(p => (section !== 'starred' || favorites.includes(p.id)) && titleOf(p).toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => sort === 'name' ? titleOf(a).localeCompare(titleOf(b)) : new Date(b.updatedAt) - new Date(a.updatedAt)),
  [workspaceProjects, section, favorites, query, sort]);
  const run = action => { try { setError(''); action(); } catch (err) { setError(err.message || 'Unable to save the project. Try exporting a JSON backup.'); } };
  const open = id => run(() => { openWorkspace(id); onOpenEditor(); });
  const create = project => { createWorkspace(project); setDialog(null); onOpenEditor(); };
  const star = id => run(() => {
    const next = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    localStorage.setItem(favoritesKey, JSON.stringify(next)); setFavorites(next);
  });
  const importFile = async e => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    try {
      if (file.size > 5_000_000) throw new Error('Project exceeds 5 MB.');
      const project = parseProject(await file.text());
      create(project);
    } catch (err) { setError(err.issues ? 'This file is not a valid Framewright project. Check its pages, theme and schema version.' : err.message); }
  };
  const templateSection = <section className="fw-templates" aria-labelledby="fw-templates-heading">
    <div className="fw-section-heading"><h2 id="fw-templates-heading">{section === 'templates' ? 'Choose your starting point' : 'Start from a template'}</h2>{section !== 'templates' && <button className="fw-text-button" onClick={() => setSection('templates')}>Browse all<IconArrowRight size={16} /></button>}</div>
    <div className="fw-template-grid">{templates.map(t => <button key={t.id} className="fw-template-card" onClick={() => setDialog(t)}>
      <LayoutThumbnail kind={t.kind} /><div><strong>{t.name}</strong><span>{t.description}</span></div><IconArrowUpRight className="fw-template-arrow" size={16} />
    </button>)}</div>
  </section>;
  return <div className="fw-dashboard">
    <aside className="fw-sidebar" aria-label="Dashboard navigation">
      <Brand compact />
      <div className="fw-workspace-label"><span className="fw-workspace-avatar"><IconLayout size={19} /></span><div><strong>Personal workspace</strong><small>Make something yours.</small></div></div>
      <button className="fw-button fw-button--primary fw-new-project" onClick={() => setDialog({})}><IconPlus size={18} />New project</button>
      <span className="fw-nav-label">WORKSPACE</span>
      <nav>{[['projects', IconFolder, 'All projects'], ['starred', IconStar, 'Starred'], ['templates', IconLayout, 'Templates']].map(([id, Icon, label]) => <button key={id} aria-current={section === id ? 'page' : undefined} className={section === id ? 'is-active' : ''} onClick={() => { setSection(id); setQuery(''); }}>{React.createElement(Icon, { size: 18 })}<span>{label}</span>{id === 'projects' && <small>{workspaceProjects.length}</small>}</button>)}</nav>
      <div className="fw-sidebar-bottom"><button className="fw-import-link" onClick={() => input.current.click()}><IconUpload size={17} />Import project JSON</button>
        <div className="fw-local-note"><IconDeviceDesktop size={18} /><div><strong>Yours, on this device</strong><p>Projects save in this browser.<br />Export JSON to keep a backup.</p></div></div>
        <span className="fw-sidebar-caption">The visual React workspace.</span>
        {user && <button className="fw-user-button" onClick={onAccount} aria-label="Account settings"><span>{user.name.slice(0, 1).toUpperCase()}</span><div><strong>{user.name}</strong><small>Account settings</small></div></button>}
      </div>
    </aside>
    <main className="fw-dashboard-main">
      <div className="fw-mobile-brand"><Brand compact /><ThemeToggle /></div>
      <header className="fw-dashboard-header"><div><span className="fw-eyebrow">YOUR WORKSPACE</span><h1>{section === 'templates' ? 'Templates' : section === 'starred' ? 'Starred projects' : 'Projects'}</h1><p>{section === 'templates' ? 'Skip the blank canvas. Start with a little structure.' : `${workspaceProjects.length} ${workspaceProjects.length === 1 ? 'project' : 'projects'} · A space for everything you’re building.`}</p></div>
        <div className="fw-header-tools"><ThemeToggle /><button className="fw-button fw-continue" onClick={() => open(workspaceId)}>Continue editing<IconArrowUpRight size={17} /></button></div>
      </header>
      <div className="fw-dashboard-content">
        <div className="fw-mobile-actions"><button className="fw-button fw-button--primary" onClick={() => setDialog({})}><IconPlus size={18} />New project</button><button className="fw-button" onClick={() => input.current.click()}><IconUpload size={18} />Import JSON</button></div>
        {legacyWorkspaceAvailable && <div className="fw-legacy-banner"><div><strong>Your previous work is still here.</strong><p>Copy this device’s earlier projects into your account. The original backup stays untouched.</p></div><button className="fw-button" onClick={() => run(() => { variantPersistence.importLegacyCache(); importLegacyWorkspace(); })}>Copy existing projects</button></div>}
        {error && <div className="fw-error" role="alert">{error}<button className="fw-icon-button" aria-label="Dismiss error" onClick={() => setError('')}><IconX size={16} /></button></div>}
        {section !== 'starred' && templateSection}
        {section !== 'templates' && <section className="fw-projects" aria-labelledby="fw-projects-heading">
          <div className="fw-project-toolbar"><h2 id="fw-projects-heading">{section === 'starred' ? 'Your favorites' : 'Your projects'}<span>{filtered.length}</span></h2>
            <div className="fw-project-controls"><label className="fw-search"><IconSearch size={17} /><input aria-label="Search projects" placeholder="Search projects…" value={query} onChange={e => setQuery(e.target.value)} />{query && <button className="fw-icon-button" aria-label="Clear search" onClick={() => setQuery('')}><IconX size={14} /></button>}</label>
              <select aria-label="Sort projects" value={sort} onChange={e => setSort(e.target.value)}><option value="recent">Last edited</option><option value="name">Name A–Z</option></select>
              <div className="fw-view-toggle" aria-label="Project view"><button aria-label="Grid view" aria-pressed={view === 'grid'} onClick={() => setView('grid')}><IconLayoutGrid size={17} /></button><button aria-label="List view" aria-pressed={view === 'list'} onClick={() => setView('list')}><IconList size={18} /></button></div>
            </div>
          </div>
          {filtered.length === 0 ? <div className="fw-empty"><IconFolder size={32} stroke={1.2} /><h3>{query ? 'No matching projects' : 'Keep your favorites close'}</h3><p>{query ? 'Try a different name or clear your search.' : 'Star a project to find it here whenever you need it.'}</p><button className="fw-button" onClick={() => { setQuery(''); setSection('projects'); }}>Show all projects</button></div>
            : <div className={`fw-project-grid ${view === 'list' ? 'is-list' : ''}`}>{filtered.map(project => <article className="fw-project-card" key={project.id}>
              <button className="fw-project-preview" onClick={() => open(project.id)} aria-label={`Open ${titleOf(project)}`}><LayoutThumbnail project={project} /><span className="fw-open-project">Open project<IconArrowUpRight size={16} /></span></button>
              <div className="fw-project-info"><div className="fw-project-title"><button onClick={() => open(project.id)} title={titleOf(project)}>{titleOf(project)}</button><button className={`fw-icon-button fw-star ${favorites.includes(project.id) ? 'is-starred' : ''}`} aria-label={`${favorites.includes(project.id) ? 'Unstar' : 'Star'} ${titleOf(project)}`} aria-pressed={favorites.includes(project.id)} onClick={() => star(project.id)}><IconStar size={16} /></button><div className="fw-card-menu" ref={menu === project.id ? menuRef : null}><button className="fw-icon-button" aria-label={`Actions for ${titleOf(project)}`} aria-expanded={menu === project.id} onClick={() => setMenu(menu === project.id ? null : project.id)}><IconDots size={19} /></button>{menu === project.id && <div className="fw-card-popover"><button onClick={() => run(() => { create({ ...toConfig(project), name: `${titleOf(project)} (Copy)` }); })}><IconCopy size={16} />Duplicate project</button><button onClick={() => run(() => { downloadSingleFile(JSON.stringify(toConfig(project), null, 2), 'app.config.json', 'application/json'); setMenu(null); })}><IconDownload size={16} />Export JSON</button></div>}</div></div>
                <div className="fw-project-meta"><span className="fw-react-badge"><IconCode size={12} />React</span><span>{project.pages.length} {project.pages.length === 1 ? 'page' : 'pages'}</span><span className="fw-edited" title={new Date(project.updatedAt).toLocaleString()}>{editedLabel(project.updatedAt)}</span></div>
              </div>
            </article>)}{!query && section === 'projects' && <button className="fw-create-card" onClick={() => setDialog({})}><span><IconPlus size={23} /></span><strong>Bring your next idea to life</strong><small>Create a new project</small></button>}</div>}
        </section>}
        {section === 'templates' && <div className="fw-template-note"><IconCode size={22} /><div><strong>A starting point, with room to make it yours.</strong><p>Every template uses editable Framewright components. Customize the layout, connect page behavior and export your React app.</p></div><button className="fw-button" onClick={() => setDialog({})}>Start blank<IconPlus size={16} /></button></div>}
        <footer className="fw-dashboard-footer"><span><i className={saveStatus === 'error' ? 'is-error' : ''} />{saveStatus === 'error' ? 'Could not save. Export a JSON backup.' : saveStatus === 'saving' ? 'Saving changes…' : 'All changes saved locally'}</span><span>Built visually. Made with React.</span></footer>
      </div>
    </main>
    {mobile && <nav className="fw-mobile-nav" aria-label="Mobile workspace navigation">
      {[['projects', IconFolder, 'Projects'], ['starred', IconStar, 'Starred'], ['templates', IconLayout, 'Templates']].map(([id, Icon, label]) => <button key={id} aria-current={section === id ? 'page' : undefined} onClick={() => { setSection(id); setQuery(''); }}><Icon size={20} /><span>{label}</span></button>)}
      <button onClick={onAccount}><IconDeviceDesktop size={20} /><span>Account</span></button>
    </nav>}
    <input ref={input} hidden type="file" accept=".json,application/json" aria-label="Import project JSON" onChange={importFile} />
    {dialog && <NewProjectDialog template={dialog} onClose={() => setDialog(null)} onCreate={create} />}
  </div>;
}
