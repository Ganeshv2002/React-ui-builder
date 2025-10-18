import { z } from 'zod';

// Core component specification schema that AI must adhere to
export const ComponentSpecSchema = z.object({
  id: z.string(),
  type: z.string(),
  props: z.record(z.string(), z.unknown()),
  styles: z.object({
    className: z.string().optional()
  }).optional(),
  children: z.array(z.lazy(() => ComponentSpecSchema)).optional(),
  layout: z.object({
    w: z.number().int().min(1),
    h: z.number().int().min(1),
    x: z.number().int().min(0),
    y: z.number().int().min(0)
  }).optional(),
  events: z.record(z.string(), z.string()).optional()
});

export type ComponentSpec = z.infer<typeof ComponentSpecSchema>;

// Registry type validation - ensures AI only uses known component types
export const createRegistryValidator = (componentRegistry: Array<{ id: string; allowedProps: string[] }>) => {
  const typeMap = new Map(componentRegistry.map(c => [c.id, new Set(c.allowedProps)]));
  
  return (spec: ComponentSpec): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Check if type exists in registry
    if (!typeMap.has(spec.type)) {
      errors.push(`Unknown component type: ${spec.type}`);
      return { valid: false, errors };
    }
    
    // Check if all props are allowed for this type
    const allowedProps = typeMap.get(spec.type)!;
    for (const prop of Object.keys(spec.props)) {
      if (!allowedProps.has(prop)) {
        errors.push(`Invalid prop "${prop}" for component type "${spec.type}"`);
      }
    }
    
    return { valid: errors.length === 0, errors };
  };
};

// Deterministic ID generation with seed
export const createDeterministicId = (seed: string, type: string, index: number = 0): string => {
  // Use seed + type + index for reproducible IDs
  const hash = seed + type + index.toString();
  let hashValue = 0;
  for (let i = 0; i < hash.length; i++) {
    const char = hash.charCodeAt(i);
    hashValue = ((hashValue << 5) - hashValue) + char;
    hashValue = hashValue & hashValue; // Convert to 32-bit integer
  }
  return `${type.toLowerCase()}_${Math.abs(hashValue).toString(36).padStart(6, '0')}`;
};

// Sort props deterministically for stable codegen
export const sortPropsForCodegen = (props: Record<string, unknown>): Record<string, unknown> => {
  const sorted: Record<string, unknown> = {};
  Object.keys(props).sort().forEach(key => {
    sorted[key] = props[key];
  });
  return sorted;
};

export default ComponentSpecSchema;
