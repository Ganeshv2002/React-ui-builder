import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

const PageContext = createContext();

export const usePages = () => {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error('usePages must be used within a PageProvider');
  }
  return context;
};

export const PageProvider = ({ children }) => {
  const [pages, setPages] = useState([
    {
      id: 'home',
      name: 'Home',
      path: '/',
      layout: [],
      isHome: true
    }
  ]);
  
  const [currentPageId, setCurrentPageId] = useState('home');

  const getCurrentPage = useCallback(() => {
    return pages.find(page => page.id === currentPageId);
  }, [pages, currentPageId]);

  const updatePageLayout = useCallback((pageId, layout) => {
    setPages(prev => prev.map(page => 
      page.id === pageId ? { ...page, layout } : page
    ));
  }, []);

  const updatePage = useCallback((pageId, updates) => {
    setPages(prev => prev.map(page => 
      page.id === pageId ? { ...page, ...updates } : page
    ));
  }, []);

  const addPage = (name, path) => {
    const newPage = {
      id: uuidv4(),
      name,
      path: path || `/${name.toLowerCase().replace(/\s+/g, '-')}`,
      layout: [],
      isHome: false
    };
    setPages(prev => [...prev, newPage]);
    return newPage;
  };

  const deletePage = (pageId) => {
    setPages(prev => {
      const pageToDelete = prev.find(p => p.id === pageId);
      if (pageToDelete?.isHome) {
        return prev; // Can't delete home page
      }
      return prev.filter(page => page.id !== pageId);
    });
    
    setCurrentPageId(prevCurrentId => {
      if (prevCurrentId === pageId) {
        return 'home';
      }
      return prevCurrentId;
    });
  };

  const duplicatePage = (pageId) => {
    let newPage = null;
    
    setPages(prev => {
      const originalPage = prev.find(p => p.id === pageId);
      if (!originalPage) return prev;

      newPage = {
        ...originalPage,
        id: uuidv4(),
        name: `${originalPage.name} (Copy)`,
        path: `${originalPage.path}-copy`,
        isHome: false
      };
      
      return [...prev, newPage];
    });
    
    return newPage;
  };

  const getPageRoutes = useCallback(() => {
    return pages.map(page => ({
      path: page.path,
      name: page.name,
      id: page.id
    }));
  }, [pages]);

  // Memoize the provider value to prevent infinite re-renders
  const providerValue = useMemo(() => ({
    pages,
    currentPageId,
    setCurrentPageId,
    getCurrentPage,
    addPage,
    deletePage,
    updatePage,
    updatePageLayout,
    duplicatePage,
    getPageRoutes
  }), [pages, currentPageId, getCurrentPage, updatePageLayout, updatePage, getPageRoutes]);

  return (
    <PageContext.Provider value={providerValue}>
      {children}
    </PageContext.Provider>
  );
};

export default PageContext;
