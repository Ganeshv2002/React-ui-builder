const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const db = require('../services/database');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Validation schemas
const projectSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).allow(''),
  pages: Joi.array().items(Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    path: Joi.string().required(),
    layout: Joi.array().required(),
    isHome: Joi.boolean().default(false)
  })).required(),
  settings: Joi.object({
    theme: Joi.string().valid('light', 'dark', 'auto').default('light'),
    viewport: Joi.object({
      width: Joi.number().min(320).max(4096).default(1440),
      height: Joi.number().min(240).max(2160).default(900)
    }).default(),
    customCSS: Joi.string().allow('').default(''),
    favicon: Joi.string().uri().allow('').default(''),
    title: Joi.string().max(100).default('My App')
  }).default()
});

const updateProjectSchema = projectSchema.optional();

// GET /api/projects - List all projects
router.get('/', async (req, res, next) => {
  try {
    const projects = await db.list('projects');
    
    // Return minimal info for listing
    const projectList = projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      pageCount: project.pages?.length || 0
    }));
    
    res.json({
      projects: projectList,
      total: projectList.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id - Get specific project
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await db.load('projects', id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    next(error);
  }
});

// POST /api/projects - Create new project
router.post('/', validateRequest(projectSchema), async (req, res, next) => {
  try {
    const projectId = uuidv4();
    const projectData = {
      ...req.body,
      id: projectId
    };
    
    // Ensure at least one page exists
    if (!projectData.pages || projectData.pages.length === 0) {
      projectData.pages = [{
        id: uuidv4(),
        name: 'Home',
        path: '/',
        layout: [],
        isHome: true
      }];
    }
    
    const savedProject = await db.save('projects', projectId, projectData);
    
    res.status(201).json(savedProject);
  } catch (error) {
    next(error);
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', validateRequest(updateProjectSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existingProject = await db.load('projects', id);
    
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Create backup before updating
    await db.createBackup('projects', id);
    
    const updatedData = {
      ...existingProject,
      ...req.body,
      id, // Ensure ID doesn't change
      createdAt: existingProject.createdAt // Preserve creation date
    };
    
    const savedProject = await db.save('projects', id, updatedData);
    
    res.json(savedProject);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const exists = await db.exists('projects', id);
    
    if (!exists) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Create backup before deletion
    await db.createBackup('projects', id);
    
    await db.delete('projects', id);
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/duplicate - Duplicate project
router.post('/:id/duplicate', async (req, res, next) => {
  try {
    const { id } = req.params;
    const originalProject = await db.load('projects', id);
    
    if (!originalProject) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const newProjectId = uuidv4();
    const duplicatedProject = {
      ...originalProject,
      id: newProjectId,
      name: `${originalProject.name} (Copy)`,
      pages: originalProject.pages.map(page => ({
        ...page,
        id: uuidv4()
      }))
    };
    
    const savedProject = await db.save('projects', newProjectId, duplicatedProject);
    
    res.status(201).json(savedProject);
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id/export - Export project
router.get('/:id/export', async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await db.load('projects', id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${project.name}-export.json"`);
    
    res.json({
      ...project,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/import - Import project
router.post('/import', async (req, res, next) => {
  try {
    const importData = req.body;
    
    // Validate imported data
    const { error, value } = projectSchema.validate(importData);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const newProjectId = uuidv4();
    const importedProject = {
      ...value,
      id: newProjectId,
      name: `${value.name} (Imported)`,
      pages: value.pages.map(page => ({
        ...page,
        id: uuidv4()
      }))
    };
    
    const savedProject = await db.save('projects', newProjectId, importedProject);
    
    res.status(201).json(savedProject);
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/search - Search projects
router.get('/search/:query', async (req, res, next) => {
  try {
    const { query } = req.params;
    const results = await db.search('projects', query);
    
    const searchResults = results.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      pageCount: project.pages?.length || 0
    }));
    
    res.json({
      results: searchResults,
      total: searchResults.length,
      query
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
