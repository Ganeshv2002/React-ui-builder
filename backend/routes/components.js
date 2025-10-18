const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

const db = require('../services/database');
const { validateRequest, validateQuery, validateParams } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

const baseComponentFields = {
	name: Joi.string().min(1).max(120),
	type: Joi.string().min(1).max(120),
	category: Joi.string().min(1).max(120),
	description: Joi.string().allow('', null).max(500),
	props: Joi.object().unknown(true),
	styles: Joi.object().unknown(true),
	layout: Joi.object().unknown(true),
	preview: Joi.object().unknown(true).allow(null),
	tags: Joi.array().items(Joi.string().min(1).max(50)),
	projectId: Joi.string().uuid().allow(null, ''),
	isGlobal: Joi.boolean(),
	metadata: Joi.object().unknown(true),
	variantIds: Joi.array().items(Joi.string().min(1)),
	usageCount: Joi.number().integer().min(0),
	status: Joi.string().valid('draft', 'published')
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

const normalizeComponent = (component) => {
	const next = { ...component };

	if (next.isGlobal) {
		next.projectId = null;
	}

	if (next.projectId === '') {
		next.projectId = null;
	}

	if (Array.isArray(next.tags)) {
		next.tags = Array.from(new Set(next.tags.filter(Boolean)));
	}

	if (Array.isArray(next.variantIds)) {
		next.variantIds = Array.from(new Set(next.variantIds.filter(Boolean)));
	}

	if (!next.category) {
		next.category = 'general';
	}

	if (!next.status) {
		next.status = 'draft';
	}

	return next;
};

const createComponentSchema = Joi.object({
	...baseComponentFields,
	name: baseComponentFields.name.required(),
	type: baseComponentFields.type.required(),
	category: baseComponentFields.category.default('general'),
	description: baseComponentFields.description.default(''),
	props: baseComponentFields.props.default({}),
	styles: baseComponentFields.styles.default({}),
	layout: baseComponentFields.layout.default({}),
	preview: baseComponentFields.preview.default(null),
	tags: baseComponentFields.tags.default([]),
	projectId: baseComponentFields.projectId.default(null),
	isGlobal: baseComponentFields.isGlobal.default(false),
	metadata: baseComponentFields.metadata.default({}),
	variantIds: baseComponentFields.variantIds.default([]),
	usageCount: baseComponentFields.usageCount.default(0),
	status: baseComponentFields.status.default('draft')
}).custom(normalizeComponent, 'normalize component payload');

const updateComponentSchema = Joi.object({
	...baseComponentFields
}).min(1).custom(normalizeComponent, 'normalize component payload');

const componentIdSchema = Joi.object({
	id: Joi.string().uuid().required()
});

const listQuerySchema = Joi.object({
	type: Joi.string().trim().min(1),
	category: Joi.string().trim().min(1),
	projectId: Joi.string().uuid().allow(null, ''),
	isGlobal: Joi.boolean(),
	status: Joi.string().valid('draft', 'published'),
	tags: Joi.alternatives().try(
		Joi.array().items(Joi.string().min(1)),
		Joi.string().min(1)
	),
	search: Joi.string().allow('', null),
	page: Joi.number().integer().min(1).default(1),
	limit: Joi.number().integer().min(1).max(100).default(50),
	sort: Joi.string().valid('name', 'updatedAt', 'createdAt', 'usageCount').default('updatedAt'),
	order: Joi.string().valid('asc', 'desc').default('desc'),
	includeGlobal: Joi.boolean().default(true)
}).unknown(true);

const bulkImportSchema = Joi.object({
	components: Joi.array().items(createComponentSchema).min(1).required()
});

const parseTags = (tags) => {
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

const matchesFilters = (component, filters) => {
	if (filters.type && component.type !== filters.type) {
		return false;
	}

	if (filters.category && component.category !== filters.category) {
		return false;
	}

	if (filters.status && component.status !== filters.status) {
		return false;
	}

	if (filters.isGlobal !== undefined) {
		if (Boolean(component.isGlobal) !== filters.isGlobal) {
			return false;
		}
	}

	if (filters.projectId) {
		const componentProject = component.projectId || null;
		const includeGlobal = filters.includeGlobal !== false;
		if (componentProject === null) {
			if (!includeGlobal) {
				return false;
			}
		} else if (componentProject !== filters.projectId) {
			return false;
		}
	}

	if (filters.tags.length > 0) {
		const componentTags = Array.isArray(component.tags) ? component.tags : [];
		const hasAllTags = filters.tags.every((tag) => componentTags.includes(tag));
		if (!hasAllTags) {
			return false;
		}
	}

	if (filters.searchTerm) {
		const haystack = [
			component.name,
			component.type,
			component.category,
			component.description,
			...(Array.isArray(component.tags) ? component.tags : [])
		]
			.join(' ')
			.toLowerCase();

		if (!haystack.includes(filters.searchTerm.toLowerCase())) {
			return false;
		}
	}

	return true;
};

const sortComponents = (components, sortKey, order) => {
	const direction = order === 'asc' ? 1 : -1;

	return components.slice().sort((a, b) => {
		if (sortKey === 'name') {
			return direction * a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
		}

		if (sortKey === 'usageCount') {
			const aCount = a.usageCount || 0;
			const bCount = b.usageCount || 0;
			if (aCount === bCount) {
				return direction * a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
			}
			return direction * (aCount > bCount ? 1 : -1);
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

const getAllComponents = async () => db.list('components');

const collectMeta = async () => {
	const components = await getAllComponents();
	const categories = new Set();
	const types = new Set();

	components.forEach((component) => {
		if (component.category) {
			categories.add(component.category);
		}
		if (component.type) {
			types.add(component.type);
		}
	});

	return {
		categories: Array.from(categories).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })),
		types: Array.from(types).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
	};
};

router.get(
	'/meta/categories',
	asyncHandler(async (req, res) => {
		const { categories } = await collectMeta();
		res.json({ categories, total: categories.length });
	})
);

router.get(
	'/meta/types',
	asyncHandler(async (req, res) => {
		const { types } = await collectMeta();
		res.json({ types, total: types.length });
	})
);

router.post(
	'/bulk-import',
	validateRequest(bulkImportSchema),
	asyncHandler(async (req, res) => {
		const componentsPayload = req.body.components || [];
		const importedComponents = [];

		for (const componentInput of componentsPayload) {
			const componentId = uuidv4();
			const componentData = normalizeComponent({
				...omitFields(componentInput, ['id', 'createdAt', 'updatedAt', 'usageCount']),
				id: componentId
			});

			const savedComponent = await db.save('components', componentId, componentData);
			importedComponents.push(savedComponent);
		}

		res.status(201).json({
			message: 'Components imported successfully',
			components: importedComponents
		});
	})
);

router.get(
	'/search/:query',
	validateParams(Joi.object({ query: Joi.string().min(1).max(100).required() })),
	validateQuery(listQuerySchema),
	asyncHandler(async (req, res) => {
		const { query } = req.params;
		const { type, category, projectId, isGlobal, status, tags, includeGlobal } = req.query;

		const filters = {
			type,
			category,
			projectId: projectId || null,
			isGlobal,
			status,
			tags: parseTags(tags),
			searchTerm: query,
			includeGlobal
		};

		const components = await getAllComponents();
		const results = components.filter((component) => matchesFilters(component, filters));

		res.json({
			results,
			total: results.length,
			query
		});
	})
);

router.get(
	'/',
	validateQuery(listQuerySchema),
	asyncHandler(async (req, res) => {
		const {
			type,
			category,
			projectId,
			isGlobal,
			status,
			tags,
			search,
			page,
			limit,
			sort,
			order,
			includeGlobal
		} = req.query;

		const filters = {
			type,
			category,
			projectId: projectId || null,
			isGlobal,
			status,
			tags: parseTags(tags),
			searchTerm: search || '',
			includeGlobal
		};

		const components = await getAllComponents();
		const filtered = components.filter((component) => matchesFilters(component, filters));
		const sorted = sortComponents(filtered, sort, order);
		const paginated = paginate(sorted, page, limit);

		res.json({
			components: paginated,
			total: filtered.length,
			page,
			limit
		});
	})
);

router.post(
	'/',
	validateRequest(createComponentSchema),
	asyncHandler(async (req, res) => {
		const componentId = uuidv4();
		const componentData = normalizeComponent({
			...omitFields(req.body, ['id', 'createdAt', 'updatedAt', 'usageCount']),
			id: componentId
		});

		const savedComponent = await db.save('components', componentId, componentData);
		res.status(201).json(savedComponent);
	})
);

router.get(
	'/:id',
	validateParams(componentIdSchema),
	asyncHandler(async (req, res) => {
		const { id } = req.params;
		const component = await db.load('components', id);

		if (!component) {
			return res.status(404).json({ error: 'Component not found' });
		}

		res.json(component);
	})
);

router.put(
	'/:id',
	validateParams(componentIdSchema),
	validateRequest(updateComponentSchema),
	asyncHandler(async (req, res) => {
		const { id } = req.params;
		const existingComponent = await db.load('components', id);

		if (!existingComponent) {
			return res.status(404).json({ error: 'Component not found' });
		}

		const updatedComponent = normalizeComponent({
			...existingComponent,
			...omitFields(req.body, ['id', 'createdAt', 'updatedAt']),
			id
		});

		await db.createBackup('components', id);
		const savedComponent = await db.save('components', id, updatedComponent);

		res.json(savedComponent);
	})
);

router.delete(
	'/:id',
	validateParams(componentIdSchema),
	asyncHandler(async (req, res) => {
		const { id } = req.params;
		const exists = await db.exists('components', id);

		if (!exists) {
			return res.status(404).json({ error: 'Component not found' });
		}

		await db.createBackup('components', id);
		await db.delete('components', id);

		res.json({ message: 'Component deleted successfully' });
	})
);

router.post(
	'/:id/duplicate',
	validateParams(componentIdSchema),
	asyncHandler(async (req, res) => {
		const { id } = req.params;
		const component = await db.load('components', id);

		if (!component) {
			return res.status(404).json({ error: 'Component not found' });
		}

		const duplicateId = uuidv4();
		const duplicateComponent = normalizeComponent({
			...omitFields(component, ['id', 'createdAt', 'updatedAt', 'usageCount']),
			id: duplicateId,
			name: `${component.name} (Copy)`
		});

		duplicateComponent.usageCount = 0;

		const savedComponent = await db.save('components', duplicateId, duplicateComponent);

		res.status(201).json(savedComponent);
	})
);

module.exports = router;
