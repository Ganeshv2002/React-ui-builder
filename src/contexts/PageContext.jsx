import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { telemetry, TELEMETRY_EVENTS } from '../utils/telemetry';
import { countComponents } from '../utils/layoutTree';
import { defaultTheme } from '../runtime/theme';
import { createProject, parseProject } from '../runtime/project';

const STATE_STORAGE_KEY = 'react-ui-builder:pages-state';
const MAX_HISTORY_ENTRIES = 20;

const createDefaultPages = () => [
  {
    id: 'home',
    name: 'Home',
    path: '/',
    layout: [],
    isHome: true,
  },
];

const cloneLayout = (layout = []) => JSON.parse(JSON.stringify(layout));

const layoutsAreEqual = (a = [], b = []) => JSON.stringify(a) === JSON.stringify(b);

const readPersistedState = (storageKey = STATE_STORAGE_KEY) => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.pages)) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn('Failed to restore builder state from storage', error);
    return null;
  }
};

const buildInitialHistory = (pages, persistedHistory = {}) => {
  return pages.reduce((acc, page) => {
    const persistedEntry = persistedHistory[page.id];
    if (persistedEntry && Array.isArray(persistedEntry.stack)) {
      const stack = persistedEntry.stack
        .map((snapshot) => cloneLayout(snapshot))
        .slice(-MAX_HISTORY_ENTRIES);
      const pointer = Math.min(
        Math.max(persistedEntry.pointer ?? stack.length - 1, 0),
        stack.length - 1,
      );

      acc[page.id] = {
        stack: stack.length > 0 ? stack : [cloneLayout(page.layout)],
        pointer: stack.length > 0 ? pointer : 0,
      };
      return acc;
    }

    acc[page.id] = {
      stack: [cloneLayout(page.layout)],
      pointer: 0,
    };
    return acc;
  }, {});
};

const serializeHistory = (history) =>
  Object.entries(history).reduce((acc, [pageId, entry]) => {
    acc[pageId] = {
      pointer: entry.pointer,
      stack: entry.stack.map((snapshot) => cloneLayout(snapshot)),
    };
    return acc;
  }, {});

const PageContext = createContext();

export const usePages = () => {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error('usePages must be used within a PageProvider');
  }
  return context;
};

export const PageProvider = ({ children, storageKey = STATE_STORAGE_KEY }) => {
  const initialState = useMemo(() => {
    const persisted = readPersistedState(storageKey);
    const initialPages = (persisted?.pages || createDefaultPages()).map((page) => ({
      ...page,
      layout: cloneLayout(page.layout),
    }));

    const currentPageId =
      persisted?.currentPageId && initialPages.some((page) => page.id === persisted.currentPageId)
        ? persisted.currentPageId
        : initialPages[0]?.id ?? 'home';

    const history = buildInitialHistory(initialPages, persisted?.history || {});

    return {
      pages: initialPages,
      currentPageId,
      history,
      theme: persisted?.theme || defaultTheme,
      metadata: persisted?.metadata || { name: 'My app' },
      workspaceId: persisted?.workspaceId || uuidv4(),
      savedProjects: Array.isArray(persisted?.savedProjects) ? persisted.savedProjects : [],
      updatedAt: persisted?.updatedAt || new Date().toISOString(),
      legacyImported: Boolean(persisted?.legacyImported),
    };
  }, [storageKey]);

  const [pages, setPages] = useState(initialState.pages);
  const [currentPageId, setCurrentPageId] = useState(initialState.currentPageId);
  const [layoutHistory, setLayoutHistory] = useState(initialState.history);
  const persistHandleRef = useRef(null);
  const [saveStatus, setSaveStatus] = useState('saving');
  const [theme, setTheme] = useState(initialState.theme);
  const [metadata, setMetadata] = useState(initialState.metadata);
  const [previousProject, setPreviousProject] = useState(null);
  const [workspaceId, setWorkspaceId] = useState(initialState.workspaceId);
  const [savedProjects, setSavedProjects] = useState(initialState.savedProjects);
  const [updatedAt, setUpdatedAt] = useState(initialState.updatedAt);
  const [legacyImported, setLegacyImported] = useState(initialState.legacyImported);
  const legacyWorkspaceAvailable = storageKey !== STATE_STORAGE_KEY && !legacyImported && Boolean(readPersistedState()?.pages?.length);
  // The dashboard and editor share this provider, so navigation retains undo history.
  // Inactive projects use the same snapshot format as the existing active project.
  const currentSnapshot = useMemo(() => ({ id: workspaceId, pages, theme, metadata,
    currentPageId, history: serializeHistory(layoutHistory), updatedAt }),
  [workspaceId, pages, theme, metadata, currentPageId, layoutHistory, updatedAt]);
  const workspaceProjects = useMemo(() => [currentSnapshot, ...savedProjects], [currentSnapshot, savedProjects]);
  const switchWorkspace = useCallback((target) => {
    // Check storage before switching. A quota failure must never discard the active work.
    const archived = [currentSnapshot, ...savedProjects.filter(p => p.id !== target.id)];
    const payload = { ...target, workspaceId: target.id, savedProjects: archived, legacyImported };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
    setSavedProjects(archived);
    setWorkspaceId(target.id);
    setPages(target.pages); setTheme(target.theme); setMetadata(target.metadata);
    setCurrentPageId(target.currentPageId);
    setLayoutHistory(buildInitialHistory(target.pages, target.history));
    setUpdatedAt(target.updatedAt); setPreviousProject(null);
  }, [currentSnapshot, savedProjects, storageKey, legacyImported]);
  const importLegacyWorkspace = useCallback(() => {
    if (!legacyWorkspaceAvailable) return;
    const legacy = readPersistedState();
    const snapshots = [legacy, ...(legacy.savedProjects || [])].map(snapshot => {
      const project = createProject(snapshot.pages, snapshot.theme, snapshot.metadata);
      return { id: uuidv4(), pages: project.pages, theme: project.theme, metadata: { ...snapshot.metadata, name: project.name },
        currentPageId: snapshot.currentPageId || project.pages[0].id, history: snapshot.history || {}, updatedAt: snapshot.updatedAt || new Date().toISOString() };
    });
    const next = [...savedProjects, ...snapshots];
    window.localStorage.setItem(storageKey, JSON.stringify({ ...currentSnapshot, workspaceId, savedProjects: next, legacyImported: true }));
    setSavedProjects(next); setLegacyImported(true);
  }, [legacyWorkspaceAvailable, savedProjects, storageKey, currentSnapshot, workspaceId]);
  const openWorkspace = useCallback((id) => {
    if (id === workspaceId) return;
    const target = savedProjects.find(p => p.id === id);
    if (!target) throw new Error('This project is no longer available.');
    switchWorkspace(target);
  }, [workspaceId, savedProjects, switchWorkspace]);
  const createWorkspace = useCallback((input) => {
    const { pages: nextPages, theme: nextTheme, ...nextMetadata } = parseProject(input);
    switchWorkspace({ id: uuidv4(), pages: nextPages, theme: nextTheme, metadata: nextMetadata,
      currentPageId: nextPages.find(p => p.isHome)?.id || nextPages[0].id,
      history: {}, updatedAt: new Date().toISOString() });
  }, [switchWorkspace]);
  const lastContent = useRef({ workspaceId, pages, theme, metadata });
  useEffect(() => {
    const last = lastContent.current;
    if (last.workspaceId === workspaceId && (last.pages !== pages || last.theme !== theme || last.metadata !== metadata)) {
      setUpdatedAt(new Date().toISOString());
    }
    lastContent.current = { workspaceId, pages, theme, metadata };
  }, [workspaceId, pages, theme, metadata]);
  const exportProject = useCallback(() => createProject(pages, theme, metadata), [pages, theme, metadata]);
  const importProject = useCallback((input) => {
    const next = parseProject(input);
    setPreviousProject({ pages: cloneLayout(pages), theme, metadata, currentPageId });
    const { pages: importedPages, theme: importedTheme, ...rest } = next;
    setPages(importedPages);
    setTheme(importedTheme);
    setMetadata(rest);
    setCurrentPageId(importedPages.find(p => p.isHome)?.id || importedPages[0].id);
    setLayoutHistory(buildInitialHistory(importedPages));
  }, [pages, theme, metadata, currentPageId]);
  const restorePreviousProject = useCallback(() => {
    if (!previousProject) return;
    setPages(previousProject.pages); setTheme(previousProject.theme); setMetadata(previousProject.metadata);
    setCurrentPageId(previousProject.currentPageId); setLayoutHistory(buildInitialHistory(previousProject.pages));
    setPreviousProject(null);
  }, [previousProject]);

  const pushLayoutToHistory = useCallback((pageId, layout) => {
    setLayoutHistory((prevHistory) => {
      const entry = prevHistory[pageId] ?? { stack: [], pointer: -1 };
      const stackHead = entry.stack.slice(0, entry.pointer + 1);
      const snapshot = cloneLayout(layout);

      if (stackHead.length > 0 && layoutsAreEqual(stackHead[stackHead.length - 1], snapshot)) {
        return prevHistory;
      }

      stackHead.push(snapshot);
      const boundedStack = stackHead.slice(-MAX_HISTORY_ENTRIES);

      return {
        ...prevHistory,
        [pageId]: {
          stack: boundedStack,
          pointer: boundedStack.length - 1,
        },
      };
    });
  }, []);

  const applyHistoryDelta = useCallback((pageId, delta) => {
    if (!pageId || delta === 0) {
      return;
    }

    setLayoutHistory((prevHistory) => {
      const entry = prevHistory[pageId];
      if (!entry) {
        return prevHistory;
      }

      const nextPointer = entry.pointer + delta;
      if (nextPointer < 0 || nextPointer >= entry.stack.length) {
        return prevHistory;
      }

      const snapshot = entry.stack[nextPointer];
      setPages((prevPages) =>
        prevPages.map((page) =>
          page.id === pageId ? { ...page, layout: cloneLayout(snapshot) } : page,
        ),
      );

      return {
        ...prevHistory,
        [pageId]: {
          ...entry,
          pointer: nextPointer,
        },
      };
    });
  }, []);

  const getCurrentPage = useCallback(() => {
    return pages.find(page => page.id === currentPageId);
  }, [pages, currentPageId]);

  const updatePageLayout = useCallback((pageId, layout) => {
    const normalizedLayout = cloneLayout(layout);

    setPages((prevPages) => {
      let didUpdate = false;

      const nextPages = prevPages.map((page) => {
        if (page.id !== pageId) {
          return page;
        }

        if (layoutsAreEqual(page.layout, normalizedLayout)) {
          return page;
        }

        didUpdate = true;
        return { ...page, layout: normalizedLayout };
      });

      if (didUpdate) {
        pushLayoutToHistory(pageId, normalizedLayout);
        telemetry.track(TELEMETRY_EVENTS.LAYOUT_SAVED, {
          pageId,
          componentCount: countComponents(normalizedLayout),
        });
      }

      return nextPages;
    });
  }, [pushLayoutToHistory]);

  const updatePage = useCallback((pageId, updates) => {
    setPages(prev => prev.map(page => 
      page.id === pageId ? { ...page, ...updates } : page
    ));
  }, []);

  const addPage = useCallback((name, path) => {
    const newPage = {
      id: uuidv4(),
      name,
      path: path || `/${name.toLowerCase().replace(/\s+/g, '-')}`,
      layout: [],
      isHome: false,
    };

    setPages(prev => [...prev, newPage]);
    setLayoutHistory(prev => ({
      ...prev,
      [newPage.id]: {
        stack: [cloneLayout(newPage.layout)],
        pointer: 0,
      },
    }));

    return newPage;
  }, []);

  const deletePage = useCallback((pageId) => {
    let nextPages = null;
    let removed = false;

    setPages((prev) => {
      const pageToDelete = prev.find((p) => p.id === pageId);
      if (!pageToDelete || pageToDelete.isHome) {
        nextPages = prev;
        return prev;
      }

      const filtered = prev.filter((page) => page.id !== pageId);
      nextPages = filtered;
      removed = true;
      return filtered;
    });

    if (removed) {
      setLayoutHistory((prev) => {
        if (!prev[pageId]) {
          return prev;
        }
        const next = { ...prev };
        delete next[pageId];
        return next;
      });

      setCurrentPageId((prevId) => {
        if (prevId === pageId) {
          return nextPages?.[0]?.id ?? 'home';
        }
        return prevId;
      });
    }
  }, []);

  const duplicatePage = useCallback((pageId) => {
    let newPage = null;
    
    setPages(prev => {
      const originalPage = prev.find(p => p.id === pageId);
      if (!originalPage) return prev;

      newPage = {
        ...originalPage,
        id: uuidv4(),
        name: `${originalPage.name} (Copy)`,
        path: `${originalPage.path}-copy`,
        isHome: false,
        layout: cloneLayout(originalPage.layout),
      };
      
      return [...prev, newPage];
    });
    
    if (newPage) {
      setLayoutHistory(prev => ({
        ...prev,
        [newPage.id]: {
          stack: [cloneLayout(newPage.layout)],
          pointer: 0,
        },
      }));
    }

    return newPage;
  }, []);

  const getPageRoutes = useCallback(() => {
    return pages.map(page => ({
      path: page.path,
      name: page.name,
      id: page.id
    }));
  }, [pages]);

  // Memoize the provider value to prevent infinite re-renders
  const undoPageLayout = useCallback((pageId) => applyHistoryDelta(pageId, -1), [applyHistoryDelta]);
  const redoPageLayout = useCallback((pageId) => applyHistoryDelta(pageId, 1), [applyHistoryDelta]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    if (persistHandleRef.current) {
      clearTimeout(persistHandleRef.current);
    }

    setSaveStatus('saving');
    persistHandleRef.current = window.setTimeout(() => {
      try {
        const payload = {
          pages,
          currentPageId,
          history: serializeHistory(layoutHistory),
          theme,
          metadata,
          workspaceId,
          savedProjects,
          updatedAt,
          legacyImported,
        };
        window.localStorage.setItem(storageKey, JSON.stringify(payload));
        setSaveStatus('saved');
      } catch (error) {
        setSaveStatus('error');
        console.warn('Failed to persist builder state', error);
      }
    }, 200);

    return () => {
      if (persistHandleRef.current) {
        clearTimeout(persistHandleRef.current);
        persistHandleRef.current = null;
      }
    };
  }, [pages, currentPageId, layoutHistory, theme, metadata, workspaceId, savedProjects, updatedAt, storageKey, legacyImported]);

  const latestState = useRef(null);
  latestState.current = { ...currentSnapshot, workspaceId, savedProjects, legacyImported };
  useEffect(() => {
    const flush = () => {
      try { window.localStorage.setItem(storageKey, JSON.stringify(latestState.current)); }
      catch { /* The normal save path reports quota errors; never erase the prior snapshot. */ }
    };
    window.addEventListener('pagehide', flush);
    return () => { window.removeEventListener('pagehide', flush); flush(); };
  }, [storageKey]);

  const providerValue = useMemo(() => ({
    storageKey, legacyWorkspaceAvailable, importLegacyWorkspace,
    workspaceId, workspaceProjects, openWorkspace, createWorkspace,
    theme, setTheme, metadata, setMetadata, exportProject, importProject, restorePreviousProject, previousProject,
    saveStatus,
    pages,
    currentPageId,
    setCurrentPageId,
    getCurrentPage,
    addPage,
    deletePage,
    updatePage,
    updatePageLayout,
    duplicatePage,
    getPageRoutes,
    layoutHistory,
    undoPageLayout,
    redoPageLayout,
  }), [
    storageKey, legacyWorkspaceAvailable, importLegacyWorkspace,
    workspaceId, workspaceProjects, openWorkspace, createWorkspace,
    theme, metadata, exportProject, importProject, restorePreviousProject, previousProject,
    saveStatus,
    pages,
    currentPageId,
    getCurrentPage,
    updatePage,
    updatePageLayout,
    addPage,
    deletePage,
    duplicatePage,
    getPageRoutes,
    layoutHistory,
    undoPageLayout,
    redoPageLayout,
  ]);

  return (
    <PageContext.Provider value={providerValue}>
      {children}
    </PageContext.Provider>
  );
};

export default PageContext;
