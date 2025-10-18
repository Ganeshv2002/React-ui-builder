import { RegistryComponent } from '../registry/components';

export interface PromptContext {
  userPrompt: string;
  availableComponents: RegistryComponent[];
  suggestedComponents?: string[];
  constraints?: {
    maxComponents?: number;
    preferredLayout?: 'grid' | 'flex' | 'stack';
    targetWidth?: number;
  };
}

// System prompt that enforces strict JSON output
export const SYSTEM_PROMPT = `You are a strict code generator for UI components. You must output ONLY valid JSON that matches the ComponentSpec[] schema.

RULES:
1. Output ONLY a JSON array of ComponentSpec objects - no explanations, no markdown, no additional text
2. Use ONLY component types from the provided registry
3. Use ONLY props that are allowed for each component type
4. IDs must be descriptive but concise (e.g., "hero_btn", "contact_form")
5. Prefer simple, clean layouts with proper spacing
6. Default to common prop values unless user specifies otherwise

ComponentSpec Schema:
{
  "id": string,           // Unique, descriptive ID
  "type": string,         // Must be from registry
  "props": object,        // Only allowed props for this type
  "layout"?: {            // Optional grid layout
    "w": number,          // Width in grid units
    "h": number,          // Height in grid units  
    "x": number,          // X position
    "y": number           // Y position
  },
  "children"?: ComponentSpec[]  // For container components
}`;

// Generate few-shot examples from registry
export const generateFewShotExamples = (registry: RegistryComponent[]): string => {
  const examples = [
    {
      user: "Create a primary call-to-action button",
      json: [
        {
          "id": "cta_btn",
          "type": "button",
          "props": {
            "children": "Get Started",
            "variant": "primary",
            "size": "lg"
          },
          "layout": { "w": 2, "h": 1, "x": 0, "y": 0 }
        }
      ]
    },
    {
      user: "Make a simple contact form",
      json: [
        {
          "id": "contact_form",
          "type": "form",
          "props": {},
          "layout": { "w": 4, "h": 4, "x": 0, "y": 0 },
          "children": [
            {
              "id": "name_input",
              "type": "input",
              "props": {
                "placeholder": "Your Name",
                "type": "text",
                "required": true
              }
            },
            {
              "id": "email_input", 
              "type": "input",
              "props": {
                "placeholder": "your@email.com",
                "type": "email",
                "required": true
              }
            },
            {
              "id": "submit_btn",
              "type": "button",
              "props": {
                "children": "Send Message",
                "type": "submit",
                "variant": "primary"
              }
            }
          ]
        }
      ]
    },
    {
      user: "Create a hero section with title and button",
      json: [
        {
          "id": "hero_section",
          "type": "container",
          "props": {},
          "layout": { "w": 6, "h": 3, "x": 0, "y": 0 },
          "children": [
            {
              "id": "hero_title",
              "type": "heading",
              "props": {
                "level": 1,
                "children": "Welcome to Our App"
              }
            },
            {
              "id": "hero_subtitle",
              "type": "text",
              "props": {
                "children": "Build amazing things with our powerful tools"
              }
            },
            {
              "id": "hero_cta",
              "type": "button",
              "props": {
                "children": "Start Building",
                "variant": "primary",
                "size": "lg"
              }
            }
          ]
        }
      ]
    }
  ];

  return examples.map(ex => 
    `User: ${ex.user}\nJSON:\n${JSON.stringify(ex.json, null, 2)}`
  ).join('\n\n');
};

// Build complete prompt for AI
export const buildPrompt = (context: PromptContext): string => {
  const { userPrompt, availableComponents, suggestedComponents, constraints } = context;
  
  // Registry info for the AI
  const registryInfo = availableComponents.map(c => 
    `${c.type}: ${c.allowedProps.join(', ')}`
  ).join('\n');

  // Add constraints if specified
  let constraintText = '';
  if (constraints) {
    const parts: string[] = [];
    if (constraints.maxComponents) parts.push(`Maximum ${constraints.maxComponents} components`);
    if (constraints.preferredLayout) parts.push(`Prefer ${constraints.preferredLayout} layout`);
    if (constraints.targetWidth) parts.push(`Target width: ${constraints.targetWidth}px`);
    if (parts.length > 0) {
      constraintText = `\nConstraints: ${parts.join(', ')}`;
    }
  }

  // Suggest components if available
  let suggestionText = '';
  if (suggestedComponents && suggestedComponents.length > 0) {
    suggestionText = `\nSuggested components: ${suggestedComponents.join(', ')}`;
  }

  const fewShotExamples = generateFewShotExamples(availableComponents.slice(0, 5));

  return `${SYSTEM_PROMPT}

Available Components:
${registryInfo}${constraintText}${suggestionText}

Examples:
${fewShotExamples}

Now generate ComponentSpec JSON for: ${userPrompt}
JSON:`;
};

// Validate and clean AI response
export const parseAIResponse = (response: string): any[] => {
  try {
    // Remove any markdown formatting
    const cleaned = response
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    
    // Try to parse as JSON
    const parsed = JSON.parse(cleaned);
    
    // Ensure it's an array
    if (!Array.isArray(parsed)) {
      return [parsed];
    }
    
    return parsed;
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error(`Invalid JSON response from AI: ${response.substring(0, 100)}...`);
  }
};

export default buildPrompt;
