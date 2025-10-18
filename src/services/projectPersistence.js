// Project persistence service that integrates with the backend API
import { projectsApi, variantsApi, componentsApi, getErrorMessage } from './api.js';

// Local storage keys for offline support
const STORAGE_KEYS = {
  CURRENT_PROJECT: 'ui_builder_current_project',
  PROJECT_CACHE: 'ui_builder_project_cache',
  OFFLINE_CHANGES: 'ui_builder_offline_changes',
  LAST_SYNC: 'ui_builder_last_sync'
};

class ProjectPersistenceService {
  constructor() {
    this.currentProject = null;
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineChanges();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
    
    // Load current project from localStorage
    this.loadCurrentProject();
  }

  // Load the current project from localStorage
  loadCurrentProject() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT);
      if (stored) {
        this.currentProject = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load current project from localStorage:', error);
    }
  }

  // Save current project to localStorage
  saveCurrentProjectLocal() {
    try {
      if (this.currentProject) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT, JSON.stringify(this.currentProject));
      }
    } catch (error) {
      console.warn('Failed to save current project to localStorage:', error);
    }
  }

  // Get all projects
  async getAllProjects() {
    try {
      if (this.isOnline) {
        const response = await projectsApi.list();
        // Cache projects for offline use
        this.cacheProjects(response.projects);
        return response.projects;
      } else {
        // Return cached projects when offline
        return this.getCachedProjects();
      }
    } catch (error) {
      console.error('Failed to get projects:', getErrorMessage(error));
      // Fallback to cached projects
      return this.getCachedProjects();
    }
  }

  // Create a new project
  async createProject(projectData) {
    try {
      const projectWithDefaults = {
        name: 'Untitled Project',
        description: '',
        canvas: {
          children: [],
          props: {}
        },
        settings: {
          theme: 'light',
          gridSize: 10,
          snapToGrid: true
        },
        ...projectData
      };

      if (this.isOnline) {
        const savedProject = await projectsApi.create(projectWithDefaults);
        this.setCurrentProject(savedProject);
        return savedProject;
      } else {
        // Create project locally and queue for sync
        const localProject = {
          ...projectWithDefaults,
          id: `local_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        this.queueOfflineChange('create', localProject);
        this.setCurrentProject(localProject);
        return localProject;
      }
    } catch (error) {
      console.error('Failed to create project:', getErrorMessage(error));
      throw error;
    }
  }

  // Load a project
  async loadProject(projectId) {
    try {
      if (this.isOnline) {
        const project = await projectsApi.get(projectId);
        this.setCurrentProject(project);
        return project;
      } else {
        // Try to load from cache
        const cachedProject = this.getCachedProject(projectId);
        if (cachedProject) {
          this.setCurrentProject(cachedProject);
          return cachedProject;
        } else {
          throw new Error('Project not available offline');
        }
      }
    } catch (error) {
      console.error('Failed to load project:', getErrorMessage(error));
      throw error;
    }
  }

  // Save the current project
  async saveProject(projectData = null) {
    try {
      const dataToSave = projectData || this.currentProject;
      
      if (!dataToSave || !dataToSave.id) {
        throw new Error('No project to save');
      }

      // Always save locally first
      this.setCurrentProject(dataToSave);

      if (this.isOnline) {
        const savedProject = await projectsApi.update(dataToSave.id, dataToSave);
        this.setCurrentProject(savedProject);
        return savedProject;
      } else {
        // Queue for sync when online
        this.queueOfflineChange('update', dataToSave);
        return dataToSave;
      }
    } catch (error) {
      console.error('Failed to save project:', getErrorMessage(error));
      throw error;
    }
  }

  // Delete a project
  async deleteProject(projectId) {
    try {
      if (this.isOnline) {
        await projectsApi.delete(projectId);
        
        // Clear current project if it was deleted
        if (this.currentProject?.id === projectId) {
          this.currentProject = null;
          localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT);
        }
        
        return true;
      } else {
        this.queueOfflineChange('delete', { id: projectId });
        return true;
      }
    } catch (error) {
      console.error('Failed to delete project:', getErrorMessage(error));
      throw error;
    }
  }

  // Duplicate a project
  async duplicateProject(projectId) {
    try {
      if (this.isOnline) {
        const duplicatedProject = await projectsApi.duplicate(projectId);
        return duplicatedProject;
      } else {
        throw new Error('Project duplication requires internet connection');
      }
    } catch (error) {
      console.error('Failed to duplicate project:', getErrorMessage(error));
      throw error;
    }
  }

  // Export project
  async exportProject(projectId) {
    try {
      if (this.isOnline) {
        return await projectsApi.export(projectId);
      } else {
        const cachedProject = this.getCachedProject(projectId);
        if (cachedProject) {
          return { project: cachedProject };
        } else {
          throw new Error('Project not available offline');
        }
      }
    } catch (error) {
      console.error('Failed to export project:', getErrorMessage(error));
      throw error;
    }
  }

  // Import project
  async importProject(projectData) {
    try {
      if (this.isOnline) {
        const importedProject = await projectsApi.import(projectData);
        return importedProject;
      } else {
        throw new Error('Project import requires internet connection');
      }
    } catch (error) {
      console.error('Failed to import project:', getErrorMessage(error));
      throw error;
    }
  }

  // Search projects
  async searchProjects(query) {
    try {
      if (this.isOnline) {
        const response = await projectsApi.search(query);
        return response.results;
      } else {
        // Search in cached projects
        const cachedProjects = this.getCachedProjects();
        return cachedProjects.filter(project => 
          project.name.toLowerCase().includes(query.toLowerCase()) ||
          project.description.toLowerCase().includes(query.toLowerCase())
        );
      }
    } catch (error) {
      console.error('Failed to search projects:', getErrorMessage(error));
      return [];
    }
  }

  // Get current project
  getCurrentProject() {
    return this.currentProject;
  }

  // Set current project
  setCurrentProject(project) {
    this.currentProject = project;
    this.saveCurrentProjectLocal();
    
    // Cache the project
    if (project) {
      this.cacheProject(project);
    }
  }

  // Auto-save functionality
  startAutoSave(intervalMs = 30000) {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    this.autoSaveInterval = setInterval(async () => {
      if (this.currentProject && this.hasUnsavedChanges()) {
        try {
          await this.saveProject();
          console.log('Auto-saved project');
        } catch (error) {
          console.warn('Auto-save failed:', getErrorMessage(error));
        }
      }
    }, intervalMs);
  }

  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  // Check if there are unsaved changes
  hasUnsavedChanges() {
    // This would need to be implemented based on your change tracking logic
    // For now, always return false
    return false;
  }

  // Cache management
  cacheProjects(projects) {
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECT_CACHE, JSON.stringify(projects));
    } catch (error) {
      console.warn('Failed to cache projects:', error);
    }
  }

  cacheProject(project) {
    try {
      const cached = this.getCachedProjects();
      const index = cached.findIndex(p => p.id === project.id);
      
      if (index >= 0) {
        cached[index] = project;
      } else {
        cached.push(project);
      }
      
      this.cacheProjects(cached);
    } catch (error) {
      console.warn('Failed to cache project:', error);
    }
  }

  getCachedProjects() {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.PROJECT_CACHE);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.warn('Failed to get cached projects:', error);
      return [];
    }
  }

  getCachedProject(projectId) {
    const cached = this.getCachedProjects();
    return cached.find(p => p.id === projectId);
  }

  // Offline change management
  queueOfflineChange(operation, data) {
    try {
      const changes = this.getOfflineChanges();
      changes.push({
        id: Date.now(),
        operation,
        data,
        timestamp: new Date().toISOString()
      });
      
      localStorage.setItem(STORAGE_KEYS.OFFLINE_CHANGES, JSON.stringify(changes));
    } catch (error) {
      console.warn('Failed to queue offline change:', error);
    }
  }

  getOfflineChanges() {
    try {
      const changes = localStorage.getItem(STORAGE_KEYS.OFFLINE_CHANGES);
      return changes ? JSON.parse(changes) : [];
    } catch (error) {
      console.warn('Failed to get offline changes:', error);
      return [];
    }
  }

  async syncOfflineChanges() {
    if (!this.isOnline) return;

    const changes = this.getOfflineChanges();
    if (changes.length === 0) return;

    console.log(`Syncing ${changes.length} offline changes...`);

    const successfulChanges = [];
    
    for (const change of changes) {
      try {
        switch (change.operation) {
          case 'create':
            await projectsApi.create(change.data);
            break;
          case 'update':
            await projectsApi.update(change.data.id, change.data);
            break;
          case 'delete':
            await projectsApi.delete(change.data.id);
            break;
        }
        
        successfulChanges.push(change);
      } catch (error) {
        console.error('Failed to sync change:', change, getErrorMessage(error));
      }
    }

    // Remove successfully synced changes
    const remainingChanges = changes.filter(c => !successfulChanges.includes(c));
    localStorage.setItem(STORAGE_KEYS.OFFLINE_CHANGES, JSON.stringify(remainingChanges));

    console.log(`Synced ${successfulChanges.length} changes, ${remainingChanges.length} remaining`);
  }

  // Cleanup
  destroy() {
    this.stopAutoSave();
    window.removeEventListener('online', this.syncOfflineChanges);
    window.removeEventListener('offline', () => this.isOnline = false);
  }
}

// Create and export a singleton instance
const projectPersistence = new ProjectPersistenceService();

export default projectPersistence;
