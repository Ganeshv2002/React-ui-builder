import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faHome, 
  faTrash, 
  faCopy, 
  faEdit, 
  faEye,
  faCode,
  faRoute,
  faGlobe
} from '@fortawesome/free-solid-svg-icons';
import { usePages } from '../../contexts/PageContext';
import './PageManager.css';

const PageManager = () => {
  const {
    pages,
    currentPageId,
    setCurrentPageId,
    addPage,
    deletePage,
    updatePage,
    duplicatePage,
    getPageRoutes
  } = usePages();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showRoutes, setShowRoutes] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [newPagePath, setNewPagePath] = useState('');
  const [editingPage, setEditingPage] = useState(null);

  const handleAddPage = () => {
    if (newPageName.trim()) {
      const page = addPage(newPageName.trim(), newPagePath.trim());
      setCurrentPageId(page.id);
      setNewPageName('');
      setNewPagePath('');
      setShowAddForm(false);
    }
  };

  const handleEditPage = (page) => {
    setEditingPage(page);
    setNewPageName(page.name);
    setNewPagePath(page.path);
  };

  const handleUpdatePage = () => {
    if (editingPage && newPageName.trim()) {
      updatePage(editingPage.id, {
        name: newPageName.trim(),
        path: newPagePath.trim() || `/${newPageName.toLowerCase().replace(/\s+/g, '-')}`
      });
      setEditingPage(null);
      setNewPageName('');
      setNewPagePath('');
    }
  };

  const handleDuplicatePage = (pageId) => {
    const newPage = duplicatePage(pageId);
    if (newPage) {
      setCurrentPageId(newPage.id);
    }
  };

  const generatePathFromName = (name) => {
    return `/${name.toLowerCase().replace(/\s+/g, '-')}`;
  };

  const routes = getPageRoutes();

  return (
    <div className="page-manager">
      <div className="page-manager-header">
        <h3>
          <FontAwesomeIcon icon={faGlobe} />
          Pages & Routes
        </h3>
        <div className="page-actions">
          <button
            className="btn-icon"
            onClick={() => setShowRoutes(!showRoutes)}
            title="View all routes"
          >
            <FontAwesomeIcon icon={faRoute} />
          </button>
          <button
            className="btn-icon btn-primary"
            onClick={() => setShowAddForm(!showAddForm)}
            title="Add new page"
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </div>
      </div>

      {showRoutes && (
        <div className="routes-panel">
          <h4>Available Routes</h4>
          <div className="routes-list">
            {routes.map(route => (
              <div key={route.id} className="route-item">
                <code>{route.path}</code>
                <span>→ {route.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(showAddForm || editingPage) && (
        <div className="add-page-form">
          <h4>{editingPage ? 'Edit Page' : 'Add New Page'}</h4>
          <div className="form-group">
            <label>Page Name</label>
            <input
              type="text"
              value={newPageName}
              onChange={(e) => {
                setNewPageName(e.target.value);
                if (!editingPage && !newPagePath) {
                  setNewPagePath(generatePathFromName(e.target.value));
                }
              }}
              placeholder="e.g., About Us"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Route Path</label>
            <input
              type="text"
              value={newPagePath}
              onChange={(e) => setNewPagePath(e.target.value)}
              placeholder="e.g., /about-us"
            />
          </div>
          <div className="form-actions">
            <button
              className="btn-secondary"
              onClick={() => {
                setShowAddForm(false);
                setEditingPage(null);
                setNewPageName('');
                setNewPagePath('');
              }}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={editingPage ? handleUpdatePage : handleAddPage}
              disabled={!newPageName.trim()}
            >
              {editingPage ? 'Update' : 'Create'} Page
            </button>
          </div>
        </div>
      )}

      <div className="pages-list">
        {pages.map(page => (
          <div
            key={page.id}
            className={`page-item ${currentPageId === page.id ? 'active' : ''}`}
          >
            <div
              className="page-info"
              onClick={() => setCurrentPageId(page.id)}
            >
              <div className="page-name">
                {page.isHome && <FontAwesomeIcon icon={faHome} />}
                <span>{page.name}</span>
                <small>{page.path}</small>
              </div>
              <div className="page-meta">
                <span className="component-count">
                  {page.layout.length} components
                </span>
              </div>
            </div>
            
            <div className="page-actions">
              <button
                className="btn-icon"
                onClick={() => handleEditPage(page)}
                title="Edit page"
                disabled={page.isHome}
              >
                <FontAwesomeIcon icon={faEdit} />
              </button>
              <button
                className="btn-icon"
                onClick={() => handleDuplicatePage(page.id)}
                title="Duplicate page"
              >
                <FontAwesomeIcon icon={faCopy} />
              </button>
              {!page.isHome && (
                <button
                  className="btn-icon btn-danger"
                  onClick={() => deletePage(page.id)}
                  title="Delete page"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PageManager;
