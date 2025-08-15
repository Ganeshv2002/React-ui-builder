import React, { createContext, useContext, useState } from 'react';
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

  const getCurrentPage = () => pages.find(page => page.id === currentPageId);

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
    if (pages.find(p => p.id === pageId)?.isHome) {
      return; // Can't delete home page
    }
    setPages(prev => prev.filter(page => page.id !== pageId));
    if (currentPageId === pageId) {
      setCurrentPageId('home');
    }
  };

  const updatePage = (pageId, updates) => {
    setPages(prev => prev.map(page => 
      page.id === pageId ? { ...page, ...updates } : page
    ));
  };

  const updatePageLayout = (pageId, layout) => {
    updatePage(pageId, { layout });
  };

  const duplicatePage = (pageId) => {
    const originalPage = pages.find(p => p.id === pageId);
    if (!originalPage) return;

    const newPage = {
      ...originalPage,
      id: uuidv4(),
      name: `${originalPage.name} (Copy)`,
      path: `${originalPage.path}-copy`,
      isHome: false
    };
    
    setPages(prev => [...prev, newPage]);
    return newPage;
  };

  const getPageRoutes = () => {
    return pages.map(page => ({
      path: page.path,
      name: page.name,
      id: page.id
    }));
  };

  return (
    <PageContext.Provider value={{
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
    }}>
      {children}
    </PageContext.Provider>
  );
};

export default PageContext;
