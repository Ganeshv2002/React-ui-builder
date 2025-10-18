import { pipeline, type ImageToTextPipeline } from '@xenova/transformers';

let captioner: ImageToTextPipeline | null = null;

// Initialize the image captioning model
export const initializeCaptioner = async (): Promise<ImageToTextPipeline> => {
  if (!captioner) {
    console.log('Loading image captioning model...');
    captioner = await pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning');
    console.log('Image captioning model loaded successfully');
  }
  return captioner;
};

// Generate caption from image file
export const captionImage = async (file: File): Promise<string> => {
  try {
    const model = await initializeCaptioner();
    
    // Convert file to format the model expects
    const imageUrl = URL.createObjectURL(file);
    const result = await model(imageUrl);
    
    // Clean up the blob URL
    URL.revokeObjectURL(imageUrl);
    
    // Extract and clean the caption
    let caption = '';
    if (Array.isArray(result)) {
      caption = result[0]?.generated_text || '';
    } else if (result && typeof result === 'object' && 'generated_text' in result) {
      caption = (result as any).generated_text || '';
    }
    
    // Clean up the caption
    caption = caption
      .replace(/^a /, '') // Remove leading "a"
      .replace(/\.$/, '') // Remove trailing period
      .trim();
    
    return caption;
  } catch (error) {
    console.error('Error generating image caption:', error);
    // Fallback to basic description
    return generateFallbackCaption(file);
  }
};

// Fallback caption generation based on file properties
const generateFallbackCaption = (file: File): string => {
  const fileName = file.name.toLowerCase();
  
  // Try to infer content from filename
  if (fileName.includes('card') || fileName.includes('profile')) {
    return 'profile card or user interface element';
  }
  if (fileName.includes('form') || fileName.includes('input')) {
    return 'form or input interface';
  }
  if (fileName.includes('button') || fileName.includes('btn')) {
    return 'button or interactive element';
  }
  if (fileName.includes('hero') || fileName.includes('banner')) {
    return 'hero section or banner';
  }
  if (fileName.includes('nav') || fileName.includes('menu')) {
    return 'navigation or menu interface';
  }
  if (fileName.includes('modal') || fileName.includes('popup')) {
    return 'modal or popup interface';
  }
  if (fileName.includes('grid') || fileName.includes('layout')) {
    return 'grid layout or structured content';
  }
  
  return 'user interface component';
};

// Enhanced caption with UI context
export const captionImageForUI = async (file: File): Promise<{
  caption: string;
  suggestions: string[];
  confidence: 'high' | 'medium' | 'low';
}> => {
  try {
    const rawCaption = await captionImage(file);
    
    // Analyze caption for UI components
    const suggestions = inferUIComponents(rawCaption, file.name);
    
    // Determine confidence based on caption quality
    const confidence = determineConfidence(rawCaption, suggestions);
    
    // Enhance caption with UI context
    const enhancedCaption = enhanceCaption(rawCaption, suggestions);
    
    return {
      caption: enhancedCaption,
      suggestions,
      confidence
    };
  } catch (error) {
    console.error('Error in enhanced captioning:', error);
    const fallback = generateFallbackCaption(file);
    return {
      caption: fallback,
      suggestions: inferUIComponents(fallback, file.name),
      confidence: 'low'
    };
  }
};

// Infer UI components from caption and filename
const inferUIComponents = (caption: string, filename: string): string[] => {
  const suggestions: string[] = [];
  const text = `${caption} ${filename}`.toLowerCase();
  
  if (text.includes('button') || text.includes('click') || text.includes('press')) {
    suggestions.push('button');
  }
  if (text.includes('form') || text.includes('input') || text.includes('field')) {
    suggestions.push('input', 'form');
  }
  if (text.includes('card') || text.includes('panel') || text.includes('box')) {
    suggestions.push('card');
  }
  if (text.includes('text') || text.includes('label') || text.includes('title')) {
    suggestions.push('text', 'heading');
  }
  if (text.includes('image') || text.includes('photo') || text.includes('picture')) {
    suggestions.push('image');
  }
  if (text.includes('nav') || text.includes('menu') || text.includes('link')) {
    suggestions.push('navbar', 'link');
  }
  if (text.includes('container') || text.includes('layout') || text.includes('grid')) {
    suggestions.push('container');
  }
  
  return [...new Set(suggestions)]; // Remove duplicates
};

// Determine confidence level
const determineConfidence = (caption: string, suggestions: string[]): 'high' | 'medium' | 'low' => {
  if (caption.length < 10) return 'low';
  if (suggestions.length === 0) return 'low';
  if (suggestions.length >= 3) return 'high';
  if (caption.includes('interface') || caption.includes('component')) return 'high';
  return 'medium';
};

// Enhance caption with UI-specific language
const enhanceCaption = (caption: string, suggestions: string[]): string => {
  if (suggestions.length === 0) {
    return `${caption} - consider using: button, text, or container components`;
  }
  
  const componentList = suggestions.slice(0, 3).join(', ');
  return `${caption} - suggested components: ${componentList}`;
};

export default captionImage;
