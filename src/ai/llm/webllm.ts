import { type MLCEngine } from '@mlc-ai/web-llm';
import ComponentSpecSchema from '../guards/validate';
import { SYSTEM_PROMPT, parseAIResponse } from '../prompts/component-spec';
import { findBestComponents } from '../nlp/match';
import type { ComponentSpec, RegistryComponent, PromptResult } from '../types';

let engine: MLCEngine | null = null;

// Validate component spec using Zod schema
const validateComponentSpec = (spec: any): ComponentSpec => {
  const result = ComponentSpecSchema.safeParse(spec);
  if (!result.success) {
    throw new Error(`Invalid component spec: ${result.error.message}`);
  }
  return result.data as ComponentSpec;
};

// Build simple prompt for WebLLM
const buildPrompt = (description: string, registry: RegistryComponent[]): PromptResult => {
  const componentTypes = registry.map(c => c.type).join(', ');
  
  return {
    system: SYSTEM_PROMPT + `\nAvailable component types: ${componentTypes}`,
    user: `Create a component: ${description}`
  };
};

// Model configurations
const MODEL_CONFIG = {
  model: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
  max_tokens: 1000,
  temperature: 0.1, // Low temperature for consistent JSON output
  top_p: 0.9,
  stop: ['\n\n', '<|eot_id|>']
};

// Initialize WebLLM engine
export const initializeEngine = async (): Promise<MLCEngine> => {
  if (!engine) {
    console.log('Loading WebLLM engine...');
    const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
    
    engine = await CreateMLCEngine(MODEL_CONFIG.model, {
      initProgressCallback: (progress) => {
        console.log(`Loading model: ${Math.round(progress.progress * 100)}%`);
      }
    });
    
    console.log('WebLLM engine loaded successfully');
  }
  return engine;
};

// Generate component specification from text description
export const generateComponentFromText = async (
  description: string,
  registry: RegistryComponent[]
): Promise<ComponentSpec | null> => {
  try {
    const llm = await initializeEngine();
    
    // Find relevant components for context
    const relevantComponents = await findBestComponents(description, registry, 3);
    
    // Build the prompt with context
    const prompt = buildPrompt(description, registry);
    
    console.log('Generating component with WebLLM...');
    const response = await llm.chat.completions.create({
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user }
      ],
      max_tokens: MODEL_CONFIG.max_tokens,
      temperature: MODEL_CONFIG.temperature,
      top_p: MODEL_CONFIG.top_p,
      stop: MODEL_CONFIG.stop
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated from WebLLM');
    }
    
    // Parse and validate the response
    const componentSpec = parseAIResponse(content);
    const validatedSpec = validateComponentSpec(componentSpec);
    
    console.log('Component generated successfully:', validatedSpec.name);
    return validatedSpec;
    
  } catch (error) {
    console.error('Error generating component from text:', error);
    return generateFallbackComponent(description, registry);
  }
};

// Generate component specification from image caption
export const generateComponentFromCaption = async (
  caption: string,
  suggestions: string[],
  confidence: 'high' | 'medium' | 'low',
  registry: RegistryComponent[]
): Promise<ComponentSpec | null> => {
  try {
    const llm = await initializeEngine();
    
    // Create enhanced description combining caption and suggestions
    const description = buildDescriptionFromCaption(caption, suggestions, confidence);
    
    // Find relevant components based on suggestions and caption
    const searchQuery = `${caption} ${suggestions.join(' ')}`;
    const relevantComponents = await findBestComponents(searchQuery, registry, 3);
    
    // Build specialized prompt for image-based generation
    const prompt = buildCaptionPrompt(description, registry, relevantComponents, suggestions);
    
    console.log('Generating component from image caption...');
    const response = await llm.chat.completions.create({
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user }
      ],
      max_tokens: MODEL_CONFIG.max_tokens,
      temperature: confidence === 'low' ? 0.3 : MODEL_CONFIG.temperature, // Higher temperature for low confidence
      top_p: MODEL_CONFIG.top_p,
      stop: MODEL_CONFIG.stop
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated from WebLLM');
    }
    
    // Parse and validate the response
    const componentSpec = parseAIResponse(content);
    const validatedSpec = validateComponentSpec(componentSpec);
    
    console.log('Component generated from image successfully:', validatedSpec.name);
    return validatedSpec;
    
  } catch (error) {
    console.error('Error generating component from caption:', error);
    return generateFallbackComponent(caption, registry);
  }
};

// Build description from image caption data
const buildDescriptionFromCaption = (
  caption: string,
  suggestions: string[],
  confidence: 'high' | 'medium' | 'low'
): string => {
  let description = `Create a component based on this image description: "${caption}"`;
  
  if (suggestions.length > 0) {
    description += ` The image appears to contain: ${suggestions.join(', ')}`;
  }
  
  if (confidence === 'low') {
    description += ` Note: The image analysis had low confidence, so please create a simple, versatile component.`;
  }
  
  return description;
};

// Build specialized prompt for caption-based generation
const buildCaptionPrompt = (
  description: string,
  registry: RegistryComponent[],
  relevantComponents: RegistryComponent[],
  suggestions: string[]
) => {
  const basePrompt = buildPrompt(description, registry);
  
  // Add image-specific instructions
  const imageInstructions = `
ADDITIONAL CONTEXT: This component is being generated from an image. Focus on:
1. Visual layout and structure suggested by the image
2. Prioritize these component types: ${suggestions.join(', ')}
3. Keep the design simple and implementable with available components
4. If uncertain, choose simpler components over complex ones
`;
  
  return {
    system: basePrompt.system + imageInstructions,
    user: basePrompt.user
  };
};

// Generate fallback component when AI fails
const generateFallbackComponent = (
  description: string,
  registry: RegistryComponent[]
): ComponentSpec | null => {
  try {
    console.log('Generating fallback component...');
    
    // Simple heuristic-based component generation
    const lowercaseDesc = description.toLowerCase();
    
    let componentType = 'container';
    let componentName = 'CustomComponent';
    
    // Determine component type from keywords
    if (lowercaseDesc.includes('button') || lowercaseDesc.includes('click')) {
      componentType = 'button';
      componentName = 'CustomButton';
    } else if (lowercaseDesc.includes('text') || lowercaseDesc.includes('heading')) {
      componentType = 'text';
      componentName = 'CustomText';
    } else if (lowercaseDesc.includes('input') || lowercaseDesc.includes('form')) {
      componentType = 'input';
      componentName = 'CustomInput';
    } else if (lowercaseDesc.includes('image') || lowercaseDesc.includes('picture')) {
      componentType = 'image';
      componentName = 'CustomImage';
    } else if (lowercaseDesc.includes('card') || lowercaseDesc.includes('panel')) {
      componentType = 'card';
      componentName = 'CustomCard';
    }
    
    // Find the component in registry
    const baseComponent = registry.find(c => c.type === componentType);
    if (!baseComponent) {
      console.error(`No ${componentType} component found in registry`);
      return null;
    }
    
    // Create basic spec
    const spec: ComponentSpec = {
      name: componentName,
      type: componentType,
      props: {
        ...baseComponent.defaultProps,
        children: componentType === 'text' ? 'Generated Content' : undefined
      },
      children: componentType === 'container' ? [] : undefined,
      description: `Fallback component based on: ${description}`
    };
    
    return validateComponentSpec(spec);
    
  } catch (error) {
    console.error('Error generating fallback component:', error);
    return null;
  }
};

// Check if WebLLM is available in the browser
export const isWebLLMAvailable = (): boolean => {
  try {
    // Check for WebAssembly support
    if (typeof WebAssembly === 'undefined') {
      return false;
    }
    
    // Check for required browser features
    if (!('SharedArrayBuffer' in window)) {
      console.warn('SharedArrayBuffer not available - WebLLM may not work');
    }
    
    return true;
  } catch {
    return false;
  }
};

// Get model loading progress
export const getModelProgress = (): number => {
  // This would be implemented to track loading progress
  // For now, return a placeholder
  return engine ? 100 : 0;
};

export default {
  generateComponentFromText,
  generateComponentFromCaption,
  initializeEngine,
  isWebLLMAvailable,
  getModelProgress
};
