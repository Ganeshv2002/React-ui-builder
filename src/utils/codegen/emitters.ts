/**
 * Codegen utilities for emitting clean, deterministic React code
 * MANDATE: Never emit editor dependencies (Mantine, zustand, etc.)
 */

export const emitImport = (name: string, from: string): string => {
  return `import ${name} from '${from}';`;
};

export const emitJSX = (
  tag: string, 
  props: Record<string, any> = {}, 
  children: string[] = []
): string => {
  // Sort props alphabetically for deterministic output
  const sortedProps = Object.keys(props)
    .sort()
    .map(key => {
      const value = props[key];
      if (typeof value === 'string') {
        return `${key}="${value}"`;
      }
      if (typeof value === 'boolean') {
        return value ? key : '';
      }
      return `${key}={${JSON.stringify(value)}}`;
    })
    .filter(Boolean)
    .join(' ');

  const propsStr = sortedProps ? ` ${sortedProps}` : '';
  
  if (children.length === 0) {
    return `<${tag}${propsStr} />`;
  }
  
  const childrenStr = children.join('');
  return `<${tag}${propsStr}>${childrenStr}</${tag}>`;
};

export const formatWithPrettier = async (code: string): Promise<string> => {
  // For now, basic formatting - could integrate prettier in editor only
  return code
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n');
};

export const generateStableId = (prefix: string, index: number): string => {
  return `${prefix}_${index.toString().padStart(3, '0')}`;
};

export const emitComponent = (
  name: string,
  props: Record<string, any>,
  children: string[] = []
): string => {
  const componentProps = {
    ...props,
    // Always include className forwarding
    className: props.className || undefined
  };
  
  return emitJSX(name, componentProps, children);
};

export const emitCSSModule = (styles: Record<string, string>): string => {
  return Object.entries(styles)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([className, rules]) => {
      return `.${className} {\n${rules}\n}`;
    })
    .join('\n\n');
};
