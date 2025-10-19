import { ensureComponentRegistry, getComponentEntry } from '../builder/componentRegistry';
import { validateLayout } from './layoutSchema';

const toPascalCase = (value = '') =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');

const resolveComponentMeta = (type) => {
  const entry = getComponentEntry(type);
  if (!entry) {
    const fallbackName = toPascalCase(type);
    return {
      type,
      exportName: fallbackName,
      sourcePath: `${fallbackName}/${fallbackName}`,
    };
  }

  const exportName =
    entry.options.exportName ||
    entry.renderer?.displayName ||
    entry.renderer?.name ||
    toPascalCase(type);

  const sourcePath = entry.options.sourcePath || `${exportName}/${exportName}`;

  return {
    type,
    exportName,
    sourcePath,
  };
};

const buildPropsString = (props = {}) =>
  Object.entries(props)
    .filter(([key, value]) => key !== 'children' && value !== undefined && value !== '')
    .map(([key, value]) => {
      if (key === 'style' && typeof value === 'object') {
        return `style={${JSON.stringify(value)}}`;
      }

      if (typeof value === 'string') {
        return `${key}=${JSON.stringify(value)}`;
      }

      return `${key}={${JSON.stringify(value)}}`;
    })
    .join(' ');

const normalizeLayout = (nodes) => {
  if (!Array.isArray(nodes)) {
    return [];
  }

  return nodes
    .filter((node) => node && typeof node.id === 'string' && typeof node.type === 'string')
    .map((node) => ({
      ...node,
      props: node.props ?? {},
      children: normalizeLayout(node.children),
    }));
};

const buildComponentCode = (component, depth, context) => {
  const indent = '  '.repeat(depth);
  const meta = context.registerImport(component.type);
  const props = component.props || {};

  if (component.type === 'form') {
    context.hasForm = true;
  }

  const propsString = buildPropsString(props);
  const openTag = propsString ? `<${meta.exportName} ${propsString}>` : `<${meta.exportName}>`;

  if (Array.isArray(component.children) && component.children.length > 0) {
    const childrenCode = component.children
      .map((child) => buildComponentCode(child, depth + 1, context))
      .join('\n');

    return `${indent}${openTag}
${childrenCode}
${indent}</${meta.exportName}>`;
  }

  if (Array.isArray(component.children) && component.children.length === 0) {
    return `${indent}${openTag}
${indent}  {/* Add components here */}
${indent}</${meta.exportName}>`;
  }

  if (props.children !== undefined && props.children !== null) {
    if (typeof props.children === 'string') {
      return `${indent}${openTag}
${indent}  ${props.children}
${indent}</${meta.exportName}>`;
    }

    return `${indent}${openTag}
${indent}  {${JSON.stringify(props.children)}}
${indent}</${meta.exportName}>`;
  }

  return `${indent}<${meta.exportName}${propsString ? ` ${propsString}` : ''} />`;
};

export const buildReactModule = (layout) => {
  ensureComponentRegistry();
  let validatedLayout;
  try {
    validatedLayout = validateLayout(layout);
  } catch (error) {
    console.warn('Layout validation failed', error);
    validatedLayout = Array.isArray(layout) ? layout : [];
  }
  const normalizedLayout = normalizeLayout(validatedLayout);
  const imports = new Map();
  const context = {
    hasForm: false,
    registerImport: (type) => {
      if (!imports.has(type)) {
        imports.set(type, resolveComponentMeta(type));
      }
      return imports.get(type);
    },
  };

  const body = normalizedLayout.map((component) => buildComponentCode(component, 2, context)).join('\n');

  const importStatements = Array.from(imports.values())
    .map(({ exportName, sourcePath }) => `import ${exportName} from './components/${sourcePath}';`)
    .join('\n');

  const formHandler = context.hasForm
    ? `
  const handleFormSubmit = (formData) => {
    console.log('Form submitted with data:', formData);
    // Add your form submission logic here
    // Example: send to API, validate data, etc.
  };
`
    : '';

  const code = `import React from 'react';
${importStatements}
import './GeneratedLayout.css';

const GeneratedLayout = () => {${formHandler}
  return (
    <div className="generated-layout">
${body}
    </div>
  );
};

export default GeneratedLayout;`;

  return {
    code,
    imports: Array.from(imports.values()),
    hasForm: context.hasForm,
  };
};

export const generateReactCode = (layout) => buildReactModule(layout).code;

export const generateComponentImports = (layout) => buildReactModule(layout).imports;

export const generateCSSCode = () => {
  return `.generated-layout {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

.generated-layout > * {
  margin-bottom: 16px;
}

.generated-layout > *:last-child {
  margin-bottom: 0;
}

/* Responsive layout */
@media (max-width: 768px) {
  .generated-layout {
    padding: 16px;
  }
}

/* Print styles */
@media print {
  .generated-layout {
    padding: 0;
    max-width: none;
    margin: 0;
  }
}`;
};

export const generateCompleteProject = (layout) => {
  const { code: jsxCode, imports } = buildReactModule(layout);
  const cssCode = generateCSSCode();
  const componentImports = imports;
  
  // Generate package.json dependencies
  const dependencies = {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  };
  
  const packageJson = {
    name: "generated-layout",
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview"
    },
    dependencies,
    devDependencies: {
      "@vitejs/plugin-react": "^4.0.3",
      "vite": "^4.4.5"
    }
  };
  
  return {
    'GeneratedLayout.jsx': jsxCode,
    'GeneratedLayout.css': cssCode,
    'package.json': JSON.stringify(packageJson, null, 2),
    componentImports
  };
};
