import { pipeline, type FeatureExtractionPipeline } from '@xenova/transformers';
import { RegistryComponent } from '../registry/components';

let embedder: FeatureExtractionPipeline | null = null;

// Initialize the embeddings model (runs once, cached)
export const initializeEmbedder = async (): Promise<FeatureExtractionPipeline> => {
  if (!embedder) {
    console.log('Loading embedding model...');
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('Embedding model loaded successfully');
  }
  return embedder;
};

// Calculate cosine similarity between two vectors
const cosineSimilarity = (a: number[], b: number[]): number => {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
};

// Generate embedding for text
const getEmbedding = async (text: string): Promise<number[]> => {
  const model = await initializeEmbedder();
  const result = await model(text, { pooling: 'mean', normalize: true });
  return Array.from(result.data as Float32Array);
};

export interface ComponentMatch {
  component: RegistryComponent;
  score: number;
  reason: string;
}

// Find best matching components for a user query
export const findBestComponents = async (
  query: string, 
  registry: RegistryComponent[], 
  topK: number = 5
): Promise<ComponentMatch[]> => {
  try {
    // Generate embedding for user query
    const queryEmbedding = await getEmbedding(query);
    
    // Calculate similarities with all components
    const similarities = await Promise.all(
      registry.map(async (component) => {
        // Create searchable text from component info
        const componentText = `${component.type} ${component.description} ${component.examples.join(' ')}`;
        const componentEmbedding = await getEmbedding(componentText);
        
        const score = cosineSimilarity(queryEmbedding, componentEmbedding);
        
        // Generate reason based on keywords
        let reason = 'Semantic similarity';
        const lowerQuery = query.toLowerCase();
        const lowerType = component.type.toLowerCase();
        
        if (lowerQuery.includes(lowerType)) {
          reason = `Direct match for "${component.type}"`;
        } else if (lowerQuery.includes(component.description.toLowerCase().split(' - ')[1])) {
          reason = `Category match: ${component.description.split(' - ')[1]}`;
        } else if (component.examples.some(ex => 
          ex.toLowerCase().includes(lowerQuery) || lowerQuery.includes(ex.toLowerCase())
        )) {
          reason = 'Usage pattern match';
        }
        
        return {
          component,
          score,
          reason
        };
      })
    );
    
    // Sort by similarity score and return top K
    return similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
      
  } catch (error) {
    console.error('Error in component matching:', error);
    // Fallback to keyword matching
    return fallbackKeywordMatching(query, registry, topK);
  }
};

// Fallback keyword-based matching if embeddings fail
const fallbackKeywordMatching = (
  query: string, 
  registry: RegistryComponent[], 
  topK: number
): ComponentMatch[] => {
  const lowerQuery = query.toLowerCase();
  const keywords = lowerQuery.split(/\s+/);
  
  const scores = registry.map(component => {
    let score = 0;
    const componentText = `${component.type} ${component.description} ${component.examples.join(' ')}`.toLowerCase();
    
    // Direct type match gets highest score
    if (lowerQuery.includes(component.type.toLowerCase())) {
      score += 10;
    }
    
    // Keyword matches
    keywords.forEach(keyword => {
      if (componentText.includes(keyword)) {
        score += 2;
      }
    });
    
    // Category matches
    if (component.description.toLowerCase().includes('form') && lowerQuery.includes('form')) {
      score += 5;
    }
    if (component.description.toLowerCase().includes('interactive') && 
        (lowerQuery.includes('button') || lowerQuery.includes('click'))) {
      score += 5;
    }
    
    return {
      component,
      score: score / 10, // Normalize to 0-1 range
      reason: score > 5 ? 'Keyword match' : 'Low relevance'
    };
  });
  
  return scores
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
};

// Enhanced matching with context awareness
export const findComponentsWithContext = async (
  query: string,
  context: {
    existingComponents?: string[];
    targetUse?: 'form' | 'layout' | 'content' | 'interactive';
    complexity?: 'simple' | 'medium' | 'complex';
  },
  registry: RegistryComponent[],
  topK: number = 3
): Promise<ComponentMatch[]> => {
  // Filter registry based on context
  let filteredRegistry = registry;
  
  if (context.targetUse) {
    filteredRegistry = registry.filter(c => {
      switch (context.targetUse) {
        case 'form':
          return ['input', 'button', 'form', 'checkbox'].includes(c.type);
        case 'layout':
          return ['container', 'grid', 'navbar', 'sidebar'].includes(c.type);
        case 'content':
          return ['text', 'heading', 'paragraph', 'image', 'card'].includes(c.type);
        case 'interactive':
          return ['button', 'link', 'checkbox'].includes(c.type);
        default:
          return true;
      }
    });
  }
  
  // Avoid suggesting already used components in simple scenarios
  if (context.complexity === 'simple' && context.existingComponents) {
    filteredRegistry = filteredRegistry.filter(c => 
      !context.existingComponents!.includes(c.type)
    );
  }
  
  return findBestComponents(query, filteredRegistry, topK);
};

export default findBestComponents;
