// Core component specification types
export interface ComponentSpec {
  id: string;
  type: string;
  props: Record<string, any>;
  children?: ComponentSpec[];
  description?: string;
  layout?: {
    w: number;
    h: number;
    x: number;
    y: number;
  };
  styles?: {
    className?: string;
  };
  events?: Record<string, any>;
}

// Registry component with metadata for AI (matches registry/components.ts)
export interface RegistryComponent {
  id: string;
  type: string;
  description: string;
  allowedProps: string[];
  defaultProps: Record<string, unknown>;
  examples: string[];
}

// Property definition for schema validation
export interface PropDefinition {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  default?: any;
  description?: string;
  options?: string[]; // For enum-like props
}

// AI generation context
export interface GenerationContext {
  description: string;
  suggestions?: string[];
  confidence?: 'high' | 'medium' | 'low';
  imageCaption?: string;
  relevantComponents?: RegistryComponent[];
}

// Prompt building result
export interface PromptResult {
  system: string;
  user: string;
}

// Component match result from NLP
export interface ComponentMatch {
  component: RegistryComponent;
  similarity: number;
  reasoning: string;
}

// AI service configuration
export interface AIServiceConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  stopSequences: string[];
}

// Image analysis result
export interface ImageAnalysisResult {
  caption: string;
  suggestions: string[];
  confidence: 'high' | 'medium' | 'low';
  rawCaption: string;
}

// Export types for external consumption
export type { ComponentSpec as default };
