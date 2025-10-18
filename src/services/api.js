// Backend API service for communicating with the Node.js server
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Generic API client with error handling
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return null;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError(
      `Network error: ${error.message}`,
      0,
      { originalError: error }
    );
  }
}

// Projects API
export const projectsApi = {
  // Get all projects
  async list() {
    return apiRequest('/projects');
  },

  // Get specific project
  async get(projectId) {
    return apiRequest(`/projects/${projectId}`);
  },

  // Create new project
  async create(projectData) {
    return apiRequest('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  // Update project
  async update(projectId, projectData) {
    return apiRequest(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  },

  // Delete project
  async delete(projectId) {
    return apiRequest(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  },

  // Duplicate project
  async duplicate(projectId) {
    return apiRequest(`/projects/${projectId}/duplicate`, {
      method: 'POST',
    });
  },

  // Export project
  async export(projectId) {
    return apiRequest(`/projects/${projectId}/export`);
  },

  // Import project
  async import(projectData) {
    return apiRequest('/projects/import', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  // Search projects
  async search(query) {
    return apiRequest(`/projects/search/${encodeURIComponent(query)}`);
  }
};

// Variants API
export const variantsApi = {
  // Get all variants with optional filtering
  async list(params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });
    
    const query = searchParams.toString();
    return apiRequest(`/variants${query ? `?${query}` : ''}`);
  },

  // Get variants for specific component type
  async getByComponentType(componentType, projectId = null) {
    const params = { componentType };
    if (projectId) params.projectId = projectId;
    return this.list(params);
  },

  // Get specific variant
  async get(variantId) {
    return apiRequest(`/variants/${variantId}`);
  },

  // Create new variant
  async create(variantData) {
    return apiRequest('/variants', {
      method: 'POST',
      body: JSON.stringify(variantData),
    });
  },

  // Update variant
  async update(variantId, variantData) {
    return apiRequest(`/variants/${variantId}`, {
      method: 'PUT',
      body: JSON.stringify(variantData),
    });
  },

  // Delete variant
  async delete(variantId) {
    return apiRequest(`/variants/${variantId}`, {
      method: 'DELETE',
    });
  },

  // Duplicate variant
  async duplicate(variantId) {
    return apiRequest(`/variants/${variantId}/duplicate`, {
      method: 'POST',
    });
  },

  // Apply variant to component
  async apply(variantId, componentId) {
    return apiRequest(`/variants/${variantId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ componentId }),
    });
  },

  // Bulk import variants
  async bulkImport(variants) {
    return apiRequest('/variants/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ variants }),
    });
  },

  // Search variants
  async search(query, params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });
    
    const queryStr = searchParams.toString();
    return apiRequest(`/variants/search/${encodeURIComponent(query)}${queryStr ? `?${queryStr}` : ''}`);
  }
};

// Components API
export const componentsApi = {
  // Get all components with optional filtering
  async list(params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });
    
    const query = searchParams.toString();
    return apiRequest(`/components${query ? `?${query}` : ''}`);
  },

  // Get specific component
  async get(componentId) {
    return apiRequest(`/components/${componentId}`);
  },

  // Create new component
  async create(componentData) {
    return apiRequest('/components', {
      method: 'POST',
      body: JSON.stringify(componentData),
    });
  },

  // Update component
  async update(componentId, componentData) {
    return apiRequest(`/components/${componentId}`, {
      method: 'PUT',
      body: JSON.stringify(componentData),
    });
  },

  // Delete component
  async delete(componentId) {
    return apiRequest(`/components/${componentId}`, {
      method: 'DELETE',
    });
  },

  // Duplicate component
  async duplicate(componentId) {
    return apiRequest(`/components/${componentId}/duplicate`, {
      method: 'POST',
    });
  },

  // Get categories
  async getCategories() {
    return apiRequest('/components/meta/categories');
  },

  // Get types
  async getTypes() {
    return apiRequest('/components/meta/types');
  },

  // Bulk import components
  async bulkImport(components) {
    return apiRequest('/components/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ components }),
    });
  },

  // Search components
  async search(query, params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });
    
    const queryStr = searchParams.toString();
    return apiRequest(`/components/search/${encodeURIComponent(query)}${queryStr ? `?${queryStr}` : ''}`);
  }
};

// Health check
export const healthApi = {
  async check() {
    return apiRequest('/health');
  }
};

// Export the ApiError for use in components
export { ApiError };

// Helper function to handle API errors in UI
export function getErrorMessage(error) {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

// Retry mechanism for failed requests
export async function withRetry(apiCall, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (i === retries - 1 || error.status === 400 || error.status === 404) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
}
