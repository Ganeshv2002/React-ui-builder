import React, { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faHome,
  faTrash,
  faCopy,
  faEdit,
  faRoute,
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
    getPageRoutes,
  } = usePages();

  const [isCreateVisible, setIsCreateVisible] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [newPagePath, setNewPagePath] = useState('');
  const [editingPage, setEditingPage] = useState(null);

  const routes = useMemo(() => getPageRoutes(), [getPageRoutes, pages]);

  const resetForm = () => {
    setIsCreateVisible(false);
    setEditingPage(null);
    setNewPageName('');
    setNewPagePath('');
  };

  const generatePathFromName = (name) => {
    if (!name) {
      return '/';
    }
    return `/${name.toLowerCase().replace(/\s+/g, '-')}`;
  };

  const handleCreateOrUpdate = () => {
    if (!newPageName.trim()) {
      return;
    }

    if (editingPage) {
      updatePage(editingPage.id, {
        name: newPageName.trim(),
        path: newPagePath.trim() || generatePathFromName(newPageName),
      });
      resetForm();
      return;
    }

    const page = addPage(newPageName.trim(), newPagePath.trim());
    setCurrentPageId(page.id);
    resetForm();
  };

  const handleEdit = (page) => {
    setEditingPage(page);
    setNewPageName(page.name);
    setNewPagePath(page.path);
    setIsCreateVisible(true);
  };

  return (
    <div className="page-panel">
      <div className="page-panel__header">
        <div>
          <h3>Pages & Routes</h3>
          <span>{pages.length} total</span>
        </div>
        <button
          type="button"
          className="page-panel__add"
          onClick={() => {
            setIsCreateVisible((value) => !value);
            setEditingPage(null);
            setNewPageName('');
            setNewPagePath('');
          }}
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Add page</span>
        </button>
      </div>

      {isCreateVisible && (
        <div className="page-panel__form">
          <div className="page-panel__form-field">
            <label>Page name</label>
            <input
              type="text"
              value={newPageName}
              onChange={(event) => {
                setNewPageName(event.target.value);
                if (!editingPage) {
                  setNewPagePath(generatePathFromName(event.target.value));
                }
              }}
              placeholder="e.g. Pricing"
              autoFocus
            />
          </div>
          <div className="page-panel__form-field">
            <label>Route path</label>
            <input
              type="text"
              value={newPagePath}
              onChange={(event) => setNewPagePath(event.target.value)}
              placeholder="e.g. /pricing"
            />
          </div>
          <div className="page-panel__form-actions">
            <button type="button" onClick={resetForm}>
              Cancel
            </button>
            <button
              type="button"
              className="primary"
              onClick={handleCreateOrUpdate}
              disabled={!newPageName.trim()}
            >
              {editingPage ? 'Save changes' : 'Create page'}
            </button>
          </div>
        </div>
      )}

      <div className="page-panel__routes">
        <FontAwesomeIcon icon={faRoute} aria-hidden="true" />
        <span>{routes.length} routes generated</span>
      </div>

      <div className="page-panel__list">
        {pages.map((page) => {
          const isActive = currentPageId === page.id;
          return (
            <div
              key={page.id}
              className={`page-card ${isActive ? 'is-active' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => setCurrentPageId(page.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  setCurrentPageId(page.id);
                }
              }}
            >
              <div className="page-card__icon">
                <FontAwesomeIcon icon={page.isHome ? faHome : faRoute} />
              </div>
              <div className="page-card__meta">
                <div className="page-card__title">{page.name}</div>
                <div className="page-card__path">{page.path}</div>
              </div>
              <div className="page-card__actions">
                <button
                  type="button"
                  title="Rename page"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleEdit(page);
                  }}
                  disabled={page.isHome}
                >
                  <FontAwesomeIcon icon={faEdit} />
                </button>
                <button
                  type="button"
                  title="Duplicate page"
                  onClick={(event) => {
                    event.stopPropagation();
                    duplicatePage(page.id);
                  }}
                >
                  <FontAwesomeIcon icon={faCopy} />
                </button>
                {!page.isHome && (
                  <button
                    type="button"
                    title="Delete page"
                    onClick={(event) => {
                      event.stopPropagation();
                      deletePage(page.id);
                    }}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PageManager;
