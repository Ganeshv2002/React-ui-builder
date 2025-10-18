import { createComponentRegistry } from './registry/components';
import { captionImageForUI } from './vision/caption';
import { generateComponentFromText, generateComponentFromCaption, initializeEngine, isWebLLMAvailable } from './llm/webllm';
import { findBestComponents } from './nlp/match';
import ComponentSpecSchema from './guards/validate';
import type { ComponentSpec, RegistryComponent, ImageAnalysisResult, GenerationContext } from './types';

// Main AI service for component generation
export class AIService {
  private registry: RegistryComponent[] = [];
  private initialized = false;

  // Initialize the AI service
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('Initializing AI service...');
    
    try {
      // Check browser compatibility
      if (!isWebLLMAvailable()) {
        throw new Error('WebLLM is not available in this browser');
      }

      // Create component registry
      this.registry = createComponentRegistry();
      console.log(`Loaded ${this.registry.length} components into registry`);

      // Initialize WebLLM engine
      await initializeEngine();
      
      this.initialized = true;
      console.log('AI service initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
      throw error;
    }
  }

  // Generate component from text description
  async generateFromText(description: string): Promise<ComponentSpec | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log('Generating component from text:', description);
      return await generateComponentFromText(description, this.registry);
    } catch (error) {
      console.error('Error generating component from text:', error);
      return null;
    }
  }

  // Generate component from image
  async generateFromImage(file: File): Promise<ComponentSpec | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log('Generating component from image:', file.name);
      
      // Analyze the image
      const analysis = await captionImageForUI(file);
      console.log('Image analysis result:', analysis);
      
      // Generate component from the analysis
      return await generateComponentFromCaption(
        analysis.caption,
        analysis.suggestions,
        analysis.confidence,
        this.registry
      );
      
    } catch (error) {
      console.error('Error generating component from image:', error);
      return null;
    }
  }

  // Get component suggestions based on description
  async getSuggestions(description: string, limit = 5): Promise<RegistryComponent[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const matches = await findBestComponents(description, this.registry, limit);
      // Extract just the components from the matches
      return matches.map(match => match.component);
    } catch (error) {
      console.error('Error getting component suggestions:', error);
      return [];
    }
  }

  // Analyze image without generating component
  async analyzeImage(file: File): Promise<ImageAnalysisResult | null> {
    try {
      const result = await captionImageForUI(file);
      return {
        caption: result.caption,
        suggestions: result.suggestions,
        confidence: result.confidence,
        rawCaption: result.caption // For now, same as caption
      };
    } catch (error) {
      console.error('Error analyzing image:', error);
      return null;
    }
  }

  // Validate a component specification
  validateComponent(spec: any): { valid: boolean; errors: string[]; component?: ComponentSpec } {
    try {
      const result = ComponentSpecSchema.safeParse(spec);
      if (result.success) {
        return {
          valid: true,
          errors: [],
          component: result.data as ComponentSpec
        };
      } else {
        return {
          valid: false,
                    errors: result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
        };
      }
    } catch (error) {
      return {
        valid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  // Get available component types
  getAvailableComponents(): RegistryComponent[] {
    return [...this.registry];
  }

  // Check if service is ready
  isReady(): boolean {
    return this.initialized;
  }

  // Get initialization status
  getStatus(): { initialized: boolean; webllmAvailable: boolean; registrySize: number } {
    return {
      initialized: this.initialized,
      webllmAvailable: isWebLLMAvailable(),
      registrySize: this.registry.length
    };
  }
}

// Create singleton instance
export const aiService = new AIService();

// Convenience functions that use the singleton
export const generateComponent = (description: string) => aiService.generateFromText(description);
export const generateComponentFromImage = (file: File) => aiService.generateFromImage(file);
export const getComponentSuggestions = (description: string, limit?: number) => 
  aiService.getSuggestions(description, limit);
export const analyzeImage = (file: File) => aiService.analyzeImage(file);
export const validateComponentSpec = (spec: any) => aiService.validateComponent(spec);

// Export types for external use
export type { ComponentSpec, RegistryComponent, ImageAnalysisResult, GenerationContext };

export default aiService;
