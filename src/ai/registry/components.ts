// Transform existing component definitions to AI-compatible registry
import { componentDefinitions } from '../../data/componentDefinitions';

export interface RegistryComponent {
  id: string;
  type: string;
  description: string;
  allowedProps: string[];
  defaultProps: Record<string, unknown>;
  examples: string[];
}

// Extract prop schemas from component definitions
const extractPropSchema = (component: any): string[] => {
  const props = component.defaultProps || {};
  const propNames = Object.keys(props);
  
  // Add common props that all components support
  const commonProps = ['className', 'style', 'id'];
  
  return [...new Set([...propNames, ...commonProps])];
};

// Convert component definitions to AI registry format
export const createComponentRegistry = (): RegistryComponent[] => {
  return componentDefinitions.map(component => ({
    id: component.id,
    type: component.id,
    description: `${component.name} - ${component.category} component`,
    allowedProps: extractPropSchema(component),
    defaultProps: component.defaultProps || {},
    examples: generateExamples(component)
  }));
};

// Generate usage examples for few-shot prompting
const generateExamples = (component: any): string[] => {
  const examples: string[] = [];
  
  switch (component.id) {
    case 'button':
      examples.push(
        'Primary action button: {"type":"button","props":{"children":"Get Started","variant":"primary"}}',
        'Secondary button: {"type":"button","props":{"children":"Learn More","variant":"secondary"}}',
        'Small button: {"type":"button","props":{"children":"Cancel","size":"sm"}}'
      );
      break;
    case 'input':
      examples.push(
        'Text input: {"type":"input","props":{"placeholder":"Enter your name","type":"text"}}',
        'Email input: {"type":"input","props":{"placeholder":"user@example.com","type":"email"}}',
        'Required input: {"type":"input","props":{"placeholder":"Password","type":"password","required":true}}'
      );
      break;
    case 'card':
      examples.push(
        'Simple card: {"type":"card","props":{"title":"Card Title","children":"Card content"}}',
        'Feature card: {"type":"card","props":{"title":"Feature","children":"Description of the feature"}}'
      );
      break;
    case 'text':
      examples.push(
        'Paragraph: {"type":"text","props":{"children":"This is a paragraph of text"}}',
        'Bold text: {"type":"text","props":{"children":"Important text","weight":"bold"}}'
      );
      break;
    case 'heading':
      examples.push(
        'Main heading: {"type":"heading","props":{"level":1,"children":"Page Title"}}',
        'Section heading: {"type":"heading","props":{"level":2,"children":"Section Title"}}'
      );
      break;
    case 'container':
      examples.push(
        'Layout container: {"type":"container","props":{},"children":[...]}',
        'Centered container: {"type":"container","props":{"align":"center"},"children":[...]}'
      );
      break;
    default:
      examples.push(`${component.name}: {"type":"${component.id}","props":${JSON.stringify(component.defaultProps || {})}}`);
  }
  
  return examples;
};

// Get component registry for AI prompts
export const getAIComponentRegistry = (): RegistryComponent[] => {
  return createComponentRegistry();
};

// Create registry lookup for validation
export const createRegistryLookup = () => {
  const registry = getAIComponentRegistry();
  return {
    types: registry.map(c => c.type),
    typeMap: new Map(registry.map(c => [c.type, c])),
    propMap: new Map(registry.map(c => [c.type, new Set(c.allowedProps)]))
  };
};

export default getAIComponentRegistry;
