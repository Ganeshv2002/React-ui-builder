// Variant persistence service for cross-component variant sharing
import { variantsApi, getErrorMessage } from './api.js';

// Local storage keys for offline support
const STORAGE_KEYS = {
  VARIANT_CACHE: 'ui_builder_variant_cache',
  VARIANT_CHANGES: 'ui_builder_variant_changes'
};

class VariantPersistenceService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.variantCache = new Map();
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineChanges();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
    
    // Load cached variants
    this.loadVariantCache();
  }

  // Load variants from localStorage
  loadVariantCache() {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.VARIANT_CACHE);
      if (cached) {
        const variants = JSON.parse(cached);
        variants.forEach(variant => {
          this.variantCache.set(variant.id, variant);
        });
      }
    } catch (error) {
      console.warn('Failed to load variant cache:', error);
    }
  }

  // Save variants to localStorage
  saveVariantCache() {
    try {
      const variants = Array.from(this.variantCache.values());
      localStorage.setItem(STORAGE_KEYS.VARIANT_CACHE, JSON.stringify(variants));
    } catch (error) {
      console.warn('Failed to save variant cache:', error);
    }
  }

  // Get all variants for a component type
  async getVariantsForComponentType(componentType, projectId = null) {
    try {
      if (this.isOnline) {
        const response = await variantsApi.getByComponentType(componentType, projectId);
        
        // Update cache
        response.variants.forEach(variant => {
          this.variantCache.set(variant.id, variant);
        });
        this.saveVariantCache();
        
        return response.variants;
      } else {
        // Return from cache when offline
        const cachedVariants = Array.from(this.variantCache.values());
        return cachedVariants.filter(variant => 
          variant.componentType === componentType &&
          (!projectId || !variant.projectId || variant.projectId === projectId)
        );
      }
    } catch (error) {
      console.error('Failed to get variants for component type:', getErrorMessage(error));
      
      // Fallback to cache
      const cachedVariants = Array.from(this.variantCache.values());
      return cachedVariants.filter(variant => 
        variant.componentType === componentType &&
        (!projectId || !variant.projectId || variant.projectId === projectId)
      );
    }
  }

  // Get all variants with optional filtering
  async getAllVariants(filters = {}) {
    try {
      if (this.isOnline) {
        const response = await variantsApi.list(filters);
        
        // Update cache
        response.variants.forEach(variant => {
          this.variantCache.set(variant.id, variant);
        });
        this.saveVariantCache();
        
        return response.variants;
      } else {
        // Filter cached variants
        let variants = Array.from(this.variantCache.values());
        
        if (filters.componentType) {
          variants = variants.filter(v => v.componentType === filters.componentType);
        }
        
        if (filters.projectId) {
          variants = variants.filter(v => !v.projectId || v.projectId === filters.projectId);
        }
        
        if (filters.isGlobal !== undefined) {
          variants = variants.filter(v => v.isGlobal === filters.isGlobal);
        }
        
        return variants;
      }
    } catch (error) {
      console.error('Failed to get all variants:', getErrorMessage(error));
      
      // Return filtered cache
      let variants = Array.from(this.variantCache.values());
      
      if (filters.componentType) {
        variants = variants.filter(v => v.componentType === filters.componentType);
      }
      
      if (filters.projectId) {
        variants = variants.filter(v => !v.projectId || v.projectId === filters.projectId);
      }
      
      return variants;
    }
  }

  // Create a new variant
  async createVariant(variantData) {
    try {
      const variantWithDefaults = {
        name: 'New Variant',
        description: '',
        styles: {},
        isGlobal: false,
        isDefault: false,
        ...variantData
      };

      if (this.isOnline) {
        const savedVariant = await variantsApi.create(variantWithDefaults);
        
        // Update cache
        this.variantCache.set(savedVariant.id, savedVariant);
        this.saveVariantCache();
        
        return savedVariant;
      } else {
        // Create variant locally and queue for sync
        const localVariant = {
          ...variantWithDefaults,
          id: `local_variant_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        this.variantCache.set(localVariant.id, localVariant);
        this.saveVariantCache();
        this.queueOfflineChange('create', localVariant);
        
        return localVariant;
      }
    } catch (error) {
      console.error('Failed to create variant:', getErrorMessage(error));
      throw error;
    }
  }

  // Update a variant
  async updateVariant(variantId, variantData) {
    try {
      if (this.isOnline) {
        const updatedVariant = await variantsApi.update(variantId, variantData);
        
        // Update cache
        this.variantCache.set(updatedVariant.id, updatedVariant);
        this.saveVariantCache();
        
        return updatedVariant;
      } else {
        // Update locally and queue for sync
        const existingVariant = this.variantCache.get(variantId);
        if (!existingVariant) {
          throw new Error('Variant not found');
        }
        
        const updatedVariant = {
          ...existingVariant,
          ...variantData,
          id: variantId,
          updatedAt: new Date().toISOString()
        };
        
        this.variantCache.set(variantId, updatedVariant);
        this.saveVariantCache();
        this.queueOfflineChange('update', updatedVariant);
        
        return updatedVariant;
      }
    } catch (error) {
      console.error('Failed to update variant:', getErrorMessage(error));
      throw error;
    }
  }

  // Delete a variant
  async deleteVariant(variantId) {
    try {
      if (this.isOnline) {
        await variantsApi.delete(variantId);
      } else {
        this.queueOfflineChange('delete', { id: variantId });
      }
      
      // Remove from cache
      this.variantCache.delete(variantId);
      this.saveVariantCache();
      
      return true;
    } catch (error) {
      console.error('Failed to delete variant:', getErrorMessage(error));
      throw error;
    }
  }

  // Duplicate a variant
  async duplicateVariant(variantId) {
    try {
      if (this.isOnline) {
        const duplicatedVariant = await variantsApi.duplicate(variantId);
        
        // Update cache
        this.variantCache.set(duplicatedVariant.id, duplicatedVariant);
        this.saveVariantCache();
        
        return duplicatedVariant;
      } else {
        // Duplicate locally
        const originalVariant = this.variantCache.get(variantId);
        if (!originalVariant) {
          throw new Error('Variant not found');
        }
        
        const duplicatedVariant = {
          ...originalVariant,
          id: `local_variant_${Date.now()}`,
          name: `${originalVariant.name} (Copy)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        this.variantCache.set(duplicatedVariant.id, duplicatedVariant);
        this.saveVariantCache();
        this.queueOfflineChange('create', duplicatedVariant);
        
        return duplicatedVariant;
      }
    } catch (error) {
      console.error('Failed to duplicate variant:', getErrorMessage(error));
      throw error;
    }
  }

  // Apply a variant to a component
  async applyVariantToComponent(variantId, componentId, componentNode) {
    try {
      const variant = this.variantCache.get(variantId);
      if (!variant) {
        throw new Error('Variant not found');
      }

      // Merge variant styles with component's current styles
      const updatedNode = {
        ...componentNode,
        props: {
          ...componentNode.props,
          style: {
            ...componentNode.props?.style,
            ...variant.styles
          },
          variant: variant.id,
          variantName: variant.name
        }
      };

      // If online, log the application to the backend
      if (this.isOnline) {
        try {
          await variantsApi.apply(variantId, componentId);
        } catch (error) {
          console.warn('Failed to log variant application:', getErrorMessage(error));
        }
      }

      return updatedNode;
    } catch (error) {
      console.error('Failed to apply variant to component:', getErrorMessage(error));
      throw error;
    }
  }

  // Get a specific variant
  getVariant(variantId) {
    return this.variantCache.get(variantId);
  }

  // Search variants
  async searchVariants(query, filters = {}) {
    try {
      if (this.isOnline) {
        const response = await variantsApi.search(query, filters);
        return response.results;
      } else {
        // Search in cached variants
        let variants = Array.from(this.variantCache.values());
        
        // Apply filters
        if (filters.componentType) {
          variants = variants.filter(v => v.componentType === filters.componentType);
        }
        
        if (filters.projectId) {
          variants = variants.filter(v => !v.projectId || v.projectId === filters.projectId);
        }
        
        // Search by name and description
        variants = variants.filter(variant => 
          variant.name.toLowerCase().includes(query.toLowerCase()) ||
          variant.description.toLowerCase().includes(query.toLowerCase())
        );
        
        return variants;
      }
    } catch (error) {
      console.error('Failed to search variants:', getErrorMessage(error));
      return [];
    }
  }

  // Create variant from current component styles
  createVariantFromComponent(componentNode, variantName, isGlobal = false) {
    return {
      name: variantName,
      componentType: componentNode.type,
      styles: componentNode.props?.style || {},
      description: `Variant created from ${componentNode.type} component`,
      isGlobal,
      isDefault: false,
      tags: [componentNode.type]
    };
  }

  // Get default variant for component type
  async getDefaultVariant(componentType, projectId = null) {
    const variants = await this.getVariantsForComponentType(componentType, projectId);
    return variants.find(variant => variant.isDefault);
  }

  // Set variant as default for component type
  async setDefaultVariant(variantId, componentType, projectId = null) {
    try {
      // First, remove default flag from other variants of the same type
      const variants = await this.getVariantsForComponentType(componentType, projectId);
      
      for (const variant of variants) {
        if (variant.isDefault && variant.id !== variantId) {
          await this.updateVariant(variant.id, { ...variant, isDefault: false });
        }
      }
      
      // Set the selected variant as default
      const variant = this.getVariant(variantId);
      if (variant) {
        return await this.updateVariant(variantId, { ...variant, isDefault: true });
      }
      
      throw new Error('Variant not found');
    } catch (error) {
      console.error('Failed to set default variant:', getErrorMessage(error));
      throw error;
    }
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
      
      localStorage.setItem(STORAGE_KEYS.VARIANT_CHANGES, JSON.stringify(changes));
    } catch (error) {
      console.warn('Failed to queue offline change:', error);
    }
  }

  getOfflineChanges() {
    try {
      const changes = localStorage.getItem(STORAGE_KEYS.VARIANT_CHANGES);
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

    console.log(`Syncing ${changes.length} offline variant changes...`);

    const successfulChanges = [];
    
    for (const change of changes) {
      try {
        switch (change.operation) {
          case 'create':
            await variantsApi.create(change.data);
            break;
          case 'update':
            await variantsApi.update(change.data.id, change.data);
            break;
          case 'delete':
            await variantsApi.delete(change.data.id);
            break;
        }
        
        successfulChanges.push(change);
      } catch (error) {
        console.error('Failed to sync variant change:', change, getErrorMessage(error));
      }
    }

    // Remove successfully synced changes
    const remainingChanges = changes.filter(c => !successfulChanges.includes(c));
    localStorage.setItem(STORAGE_KEYS.VARIANT_CHANGES, JSON.stringify(remainingChanges));

    console.log(`Synced ${successfulChanges.length} variant changes, ${remainingChanges.length} remaining`);
  }

  // Cleanup
  destroy() {
    window.removeEventListener('online', this.syncOfflineChanges);
    window.removeEventListener('offline', () => this.isOnline = false);
  }
}

// Create and export a singleton instance
const variantPersistence = new VariantPersistenceService();

export default variantPersistence;
