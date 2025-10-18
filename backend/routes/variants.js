const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

const db = require('../services/database');
const { validateRequest, validateQuery, validateParams } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

const baseVariantFields = {
  name: Joi.string().min(1).max(120),
  description: Joi.string().allow('', null).max(500),
  componentType: Joi.string().min(1).max(120),
  projectId: Joi.string().uuid().allow(null, ''),
  styles: Joi.object().unknown(true),
  tokens: Joi.object().unknown(true),
  isGlobal: Joi.boolean(),
  isDefault: Joi.boolean(),
  tags: Joi.array().items(Joi.string().min(1).max(50)),
  metadata: Joi.object().unknown(true),
  preview: Joi.object().unknown(true).allow(null),
  usageCount: Joi.number().integer().min(0),
  lastAppliedAt: Joi.string().isoDate().allow(null),
  createdBy: Joi.string().allow('', null),
  updatedBy: Joi.string().allow('', null)
};

const omitFields = (source, fields) => {
  if (!source) {
    return {};
  }

  const clone = { ...source };
  fields.forEach((field) => {
    if (field in clone) {
      delete clone[field];
    }
  });
  return clone;
};

const normalizeVariantScope = (variant) => {
  const next = { ...variant };
  if (next.isGlobal) {
    next.projectId = null;
  }

  if (next.projectId === '') {
    next.projectId = null;
  }

  if (Array.isArray(next.tags)) {
    next.tags = Array.from(new Set(next.tags.filter(Boolean)));
  }

  return next;
};

const createVariantSchema = Joi.object({
  ...baseVariantFields,
  name: baseVariantFields.name.required(),
  componentType: baseVariantFields.componentType.required(),
  styles: baseVariantFields.styles.default({}),
  description: baseVariantFields.description.default(''),
  projectId: baseVariantFields.projectId.default(null),
  tokens: baseVariantFields.tokens.default({}),
  isGlobal: baseVariantFields.isGlobal.default(false),
  isDefault: baseVariantFields.isDefault.default(false),
  tags: baseVariantFields.tags.default([]),
  metadata: baseVariantFields.metadata.default({}),
  preview: baseVariantFields.preview.default(null),
  usageCount: baseVariantFields.usageCount.default(0),
  lastAppliedAt: baseVariantFields.lastAppliedAt.default(null),
  createdBy: baseVariantFields.createdBy.default(null),
  updatedBy: baseVariantFields.updatedBy.default(null)
}).custom(normalizeVariantScope, 'normalize variant scope');

const updateVariantSchema = Joi.object({
  ...baseVariantFields
}).min(1).custom(normalizeVariantScope, 'normalize variant scope');

const listQuerySchema = Joi.object({
  componentType: Joi.string().trim().min(1),
  projectId: Joi.string().uuid().allow(null, ''),
  isGlobal: Joi.boolean(),
  isDefault: Joi.boolean(),
  tags: Joi.alternatives().try(
    Joi.array().items(Joi.string().min(1)),
    Joi.string().min(1)
  ),
  search: Joi.string().allow('', null),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  sort: Joi.string().valid('name', 'updatedAt', 'createdAt').default('updatedAt'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  includeGlobal: Joi.boolean().default(true)
}).unknown(true);

const variantIdSchema = Joi.object({
  id: Joi.string().uuid().required()
});

const bulkImportSchema = Joi.object({
  variants: Joi.array().items(createVariantSchema).min(1).required()
});

const parseTagFilter = (tags) => {
  if (!tags) {
    return [];
  }

  if (Array.isArray(tags)) {
    return tags
      .flatMap((tag) => (typeof tag === 'string' ? tag.split(',') : []))
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
};

const matchesFilters = (variant, filters) => {
  if (filters.componentType && variant.componentType !== filters.componentType) {
    return false;
  }

  if (filters.isGlobal !== undefined) {
    const variantIsGlobal = Boolean(variant.isGlobal);
    if (variantIsGlobal !== filters.isGlobal) {
      return false;
    }
  }

  if (filters.projectId) {
    const variantProjectId = variant.projectId || null;
    const includeGlobal = filters.includeGlobal !== false;
    if (variantProjectId === null) {
      if (!includeGlobal) {
        return false;
      }
    } else if (variantProjectId !== filters.projectId) {
      return false;
    }
  }

  if (filters.isDefault !== undefined) {
    if (Boolean(variant.isDefault) !== filters.isDefault) {
      return false;
    }
  }

  if (filters.tags.length > 0) {
    const variantTags = Array.isArray(variant.tags) ? variant.tags : [];
    const hasAllTags = filters.tags.every((tag) => variantTags.includes(tag));
    if (!hasAllTags) {
      return false;
    }
  }

  if (filters.searchTerm) {
    const haystack = [
      variant.name,
      variant.description,
      ...(Array.isArray(variant.tags) ? variant.tags : [])
    ]
      .join(' ')
      .toLowerCase();

    if (!haystack.includes(filters.searchTerm.toLowerCase())) {
      return false;
    }
  }

  return true;
};

const sortVariants = (variants, sortKey, order) => {
  const direction = order === 'asc' ? 1 : -1;

  return variants.slice().sort((a, b) => {
    if (sortKey === 'name') {
      return direction * a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    }

    const aValue = a[sortKey] ? new Date(a[sortKey]).getTime() : 0;
    const bValue = b[sortKey] ? new Date(b[sortKey]).getTime() : 0;

    if (aValue === bValue) {
      return direction * a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    }

    return direction * (aValue > bValue ? 1 : -1);
  });
};

const paginate = (items, page, limit) => {
  const start = (page - 1) * limit;
  return items.slice(start, start + limit);
};

const ensureSingleDefault = async (variant) => {
  if (!variant.isDefault) {
    return;
  }

  const allVariants = await db.list('variants');
  const isSameScope = (candidate) => {
    if (candidate.componentType !== variant.componentType) {
      return false;
    }

    const candidateProject = candidate.projectId || null;
    const variantProject = variant.projectId || null;

    if (variantProject === null) {
      return candidateProject === null;
    }

    return candidateProject === variantProject;
  };

  await Promise.all(
    allVariants
      .filter((candidate) => candidate.id !== variant.id && isSameScope(candidate) && candidate.isDefault)
      .map(async (candidate) => {
        await db.createBackup('variants', candidate.id);
        await db.save('variants', candidate.id, { ...candidate, isDefault: false });
      })
  );
};

router.get(
  '/',
  validateQuery(listQuerySchema),
  asyncHandler(async (req, res) => {
    const {
      componentType,
      projectId,
      isGlobal,
      isDefault,
      tags,
      search,
      page,
      limit,
      sort,
      order,
      includeGlobal
    } = req.query;

    const filters = {
      componentType,
      projectId: projectId || null,
      isGlobal,
      isDefault,
      tags: parseTagFilter(tags),
      searchTerm: search || '',
      includeGlobal
    };

    const variants = await db.list('variants');
    const filtered = variants.filter((variant) => matchesFilters(variant, filters));
    const sorted = sortVariants(filtered, sort, order);
    const paginated = paginate(sorted, page, limit);

    res.json({
      variants: paginated,
      total: filtered.length,
      page,
      limit
    });
  })
);

router.get(
  '/:id',
  validateParams(variantIdSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const variant = await db.load('variants', id);

    if (!variant) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    res.json(variant);
  })
);

router.post(
  '/',
  validateRequest(createVariantSchema),
  asyncHandler(async (req, res) => {
    const variantId = uuidv4();
    const variantData = normalizeVariantScope({
      ...omitFields(req.body, ['id', 'createdAt', 'updatedAt', 'lastAppliedAt', 'usageCount']),
      id: variantId
    });

    await ensureSingleDefault(variantData);
    const savedVariant = await db.save('variants', variantId, variantData);

    res.status(201).json(savedVariant);
  })
);

router.put(
  '/:id',
  validateParams(variantIdSchema),
  validateRequest(updateVariantSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existingVariant = await db.load('variants', id);

    if (!existingVariant) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    const updatedVariant = normalizeVariantScope({
      ...existingVariant,
      ...omitFields(req.body, ['id', 'createdAt', 'updatedAt']),
      id
    });

    await ensureSingleDefault(updatedVariant);
    await db.createBackup('variants', id);
    const savedVariant = await db.save('variants', id, updatedVariant);

    res.json(savedVariant);
  })
);

router.delete(
  '/:id',
  validateParams(variantIdSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const exists = await db.exists('variants', id);

    if (!exists) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    await db.createBackup('variants', id);
    await db.delete('variants', id);

    res.json({ message: 'Variant deleted successfully' });
  })
);

router.post(
  '/:id/duplicate',
  validateParams(variantIdSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const variant = await db.load('variants', id);

    if (!variant) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    const duplicateId = uuidv4();
    const duplicateVariant = normalizeVariantScope({
      ...omitFields(variant, ['id', 'createdAt', 'updatedAt', 'lastAppliedAt', 'usageCount']),
      id: duplicateId,
      name: `${variant.name} (Copy)`
    });

    duplicateVariant.isDefault = false;
    duplicateVariant.usageCount = 0;
    duplicateVariant.lastAppliedAt = null;

    const savedVariant = await db.save('variants', duplicateId, duplicateVariant);

    res.status(201).json(savedVariant);
  })
);

router.post(
  '/:id/apply',
  validateParams(variantIdSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const variant = await db.load('variants', id);

    if (!variant) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    const updatedVariant = {
      ...variant,
      usageCount: (variant.usageCount || 0) + 1,
      lastAppliedAt: new Date().toISOString()
    };

    const savedVariant = await db.save('variants', id, updatedVariant);

    res.json({
      message: 'Variant application recorded',
      variant: savedVariant
    });
  })
);

router.post(
  '/bulk-import',
  validateRequest(bulkImportSchema),
  asyncHandler(async (req, res) => {
    const variantsPayload = req.body.variants || [];

    const importedVariants = [];

    for (const variantInput of variantsPayload) {
      const variantId = uuidv4();
      const variantData = normalizeVariantScope({
        ...omitFields(variantInput, ['id', 'createdAt', 'updatedAt', 'lastAppliedAt', 'usageCount']),
        id: variantId
      });

      await ensureSingleDefault(variantData);
      const savedVariant = await db.save('variants', variantId, variantData);
      importedVariants.push(savedVariant);
    }

    res.status(201).json({
      message: 'Variants imported successfully',
      variants: importedVariants
    });
  })
);

router.get(
  '/search/:query',
  validateParams(Joi.object({ query: Joi.string().min(1).max(100).required() })),
  validateQuery(listQuerySchema),
  asyncHandler(async (req, res) => {
    const { query } = req.params;
    const {
      componentType,
      projectId,
      isGlobal,
      isDefault,
      tags,
      includeGlobal
    } = req.query;

    const filters = {
      componentType,
      projectId: projectId || null,
      isGlobal,
      isDefault,
      tags: parseTagFilter(tags),
      searchTerm: query,
      includeGlobal
    };

    const variants = await db.list('variants');
    const results = variants.filter((variant) => matchesFilters(variant, filters));

    res.json({
      results,
      total: results.length,
      query
    });
  })
);

module.exports = router;
