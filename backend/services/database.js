const fs = require('fs-extra');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || './data';

class DatabaseService {
  constructor() {
    this.ensureDirectories();
  }

  async ensureDirectories() {
    const dirs = [
      DATA_DIR,
      path.join(DATA_DIR, 'projects'),
      path.join(DATA_DIR, 'variants'),
      path.join(DATA_DIR, 'components'),
      path.join(DATA_DIR, 'backups')
    ];

    for (const dir of dirs) {
      await fs.ensureDir(dir);
    }
  }

  // Generic CRUD operations
  async save(collection, id, data) {
    const filePath = path.join(DATA_DIR, collection, `${id}.json`);
    const dataWithMetadata = {
      ...data,
      id,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await fs.writeFile(filePath, JSON.stringify(dataWithMetadata, null, 2));
    return dataWithMetadata;
  }

  async load(collection, id) {
    const filePath = path.join(DATA_DIR, collection, `${id}.json`);
    
    if (!(await fs.pathExists(filePath))) {
      return null;
    }
    
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  }

  async list(collection, filter = {}) {
    const dirPath = path.join(DATA_DIR, collection);
    
    if (!(await fs.pathExists(dirPath))) {
      return [];
    }
    
    const files = await fs.readdir(dirPath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const items = [];
    for (const file of jsonFiles) {
      try {
        const data = await fs.readFile(path.join(dirPath, file), 'utf8');
        const item = JSON.parse(data);
        
        // Apply filters
        let matches = true;
        for (const [key, value] of Object.entries(filter)) {
          if (item[key] !== value) {
            matches = false;
            break;
          }
        }
        
        if (matches) {
          items.push(item);
        }
      } catch (error) {
        console.error(`Error reading file ${file}:`, error);
      }
    }
    
    return items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  async delete(collection, id) {
    const filePath = path.join(DATA_DIR, collection, `${id}.json`);
    
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      return true;
    }
    
    return false;
  }

  async exists(collection, id) {
    const filePath = path.join(DATA_DIR, collection, `${id}.json`);
    return await fs.pathExists(filePath);
  }

  // Backup functionality
  async createBackup(collection, id) {
    const data = await this.load(collection, id);
    if (!data) return null;

    const backupId = `${id}_${Date.now()}`;
    const backupPath = path.join(DATA_DIR, 'backups', `${backupId}.json`);
    
    await fs.writeFile(backupPath, JSON.stringify({
      ...data,
      originalId: id,
      backupCreatedAt: new Date().toISOString()
    }, null, 2));
    
    return backupId;
  }

  // Search functionality
  async search(collection, query) {
    const items = await this.list(collection);
    const searchTerm = query.toLowerCase();
    
    return items.filter(item => {
      const searchableText = JSON.stringify(item).toLowerCase();
      return searchableText.includes(searchTerm);
    });
  }
}

module.exports = new DatabaseService();
