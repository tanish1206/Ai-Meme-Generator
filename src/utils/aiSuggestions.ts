// AI-powered meme text suggestions
export interface AISuggestion {
  topText: string;
  bottomText: string;
  confidence: number;
  reasoning: string;
}

export interface TemplateContext {
  templateId: string;
  templateName: string;
  currentTopText?: string;
  currentBottomText?: string;
  imageUrl?: string; // For image analysis
}

export interface ImageAnalysis {
  description: string;
  objects: string[];
  emotions: string[];
  context: string;
  memePotential: number; // 1-10 scale
}

// AI API configurations
const AI_CONFIG = {
  // Gemini AI (Google) - for image analysis and text generation
  gemini: {
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    visionUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
  },
  // Hugging Face (free fallback)
  huggingFace: {
    model: 'microsoft/DialoGPT-medium',
    apiUrl: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium'
  },
  // OpenAI (fallback)
  openai: {
    model: 'gpt-3.5-turbo',
    apiUrl: 'https://api.openai.com/v1/chat/completions'
  }
};

// Template-specific prompts with internet meme examples
const TEMPLATE_PROMPTS: Record<string, string> = {
  'drake': `Create a Drake Hotline Bling style meme. Examples from internet:
- Top: "Reading documentation" | Bottom: "Just trying random code until it works"
- Top: "Going to gym" | Bottom: "Ordering pizza"
- Top: "Being productive" | Bottom: "Scrolling TikTok"
Generate 3 funny, relatable variations about work, life, or tech. Make them punchy and meme-worthy.`,

  'distracted': `Create a Distracted Boyfriend meme. Examples from internet:
- Top: "My current relationship" | Bottom: "That cute barista who remembers my order"
- Top: "My job" | Bottom: "Remote work in pajamas"
- Top: "My diet" | Bottom: "McDonald's at 2 AM"
Generate 3 funny variations about relationships, work, or lifestyle choices.`,

  'expanding-brain': `Create an Expanding Brain meme with 4 levels. Examples from internet:
- Level 1: "Using basic functions" | Level 2: "Writing everything in one line" | Level 3: "Using regex for everything" | Level 4: "Writing your own programming language"
Generate 3 funny 4-level progressions about programming, life, or absurd topics.`,

  'two-buttons': `Create a Two Buttons meme. Examples from internet:
- Top: "Save money" | Bottom: "Buy the expensive thing anyway"
- Top: "Go to bed early" | Bottom: "Watch one more episode"
- Top: "Eat healthy" | Bottom: "Order takeout"
Generate 3 funny choice dilemmas that people face daily.`,

  'change-my-mind': `Create a Change My Mind meme. Examples from internet:
- "Pineapple belongs on pizza" | "Change my mind"
- "Coffee is a food group" | "Change my mind"
- "Monday should be illegal" | "Change my mind"
Generate 3 controversial but funny opinions people might have.`,

  'success-kid': `Create a Success Kid meme. Examples from internet:
- Top: "When you finally fix that bug" | Bottom: "After 3 hours of googling"
- Top: "When you find the perfect parking spot" | Bottom: "Right in front of the store"
- Top: "When your code works on first try" | Bottom: "And you don't know why"
Generate 3 success scenarios that are relatable and funny.`,

  'one-does-not-simply': `Create a "One Does Not Simply" meme. Examples from internet:
- "One does not simply" | "Walk into Mordor"
- "One does not simply" | "Understand JavaScript"
- "One does not simply" | "Wake up on Monday"
Generate 3 funny "One does not simply" variations about everyday struggles.`,

  'batman-slap': `Create a Batman Slapping Robin meme. Examples from internet:
- Top: "I can fix this with more code" | Bottom: "No, you need to delete code"
- Top: "I'll just copy-paste from Stack Overflow" | Bottom: "That's not how this works"
- Top: "I don't need to test this" | Bottom: "Yes, you absolutely do"
Generate 3 funny programming or life advice scenarios.`,

  'is-this': `Create an "Is This A Pigeon" meme. Examples from internet:
- Top: "Is this a pigeon?" | Bottom: "No, it's a seagull"
- Top: "Is this a bug?" | Bottom: "No, it's a feature"
- Top: "Is this a problem?" | Bottom: "No, it's an opportunity"
Generate 3 funny misidentification scenarios.`,

  'doge': `Create a Doge meme. Examples from internet:
- Top: "Much simple" | Bottom: "Very complex, wow"
- Top: "Such code" | Bottom: "Very bug, wow"
- Top: "Much coffee" | Bottom: "Very awake, wow"
Generate 3 funny Doge-style variations about programming, work, or life.`
};

// Analyze image using Gemini Vision
export async function analyzeImageWithGemini(
  imageUrl: string,
  geminiApiKey: string
): Promise<ImageAnalysis | null> {
  try {
    const response = await fetch(`${AI_CONFIG.gemini.visionUrl}?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `Analyze this image for meme potential. Describe what you see, identify objects, emotions, and context. Rate the meme potential from 1-10. Return as JSON:
              {
                "description": "Brief description of the image",
                "objects": ["list", "of", "objects"],
                "emotions": ["list", "of", "emotions"],
                "context": "What's happening in the image",
                "memePotential": 8
              }`
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: await imageToBase64(imageUrl)
              }
            }
          ]
        }]
      })
    });

    if (!response.ok) return null;
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Gemini image analysis failed:', error);
  }
  return null;
}

// Convert image URL to base64
async function imageToBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remove data:image/jpeg;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to convert image to base64:', error);
    return '';
  }
}

export async function getAISuggestion(
  context: TemplateContext,
  geminiApiKey?: string
): Promise<AISuggestion | null> {
  try {
    // If we have an image and Gemini API key, analyze the image first
    if (context.imageUrl && geminiApiKey) {
      const imageAnalysis = await analyzeImageWithGemini(context.imageUrl, geminiApiKey);
      if (imageAnalysis) {
        const suggestion = await generateImageBasedSuggestion(context, imageAnalysis, geminiApiKey);
        if (suggestion) return suggestion;
      }
    }

    // Fallback to text-based suggestions
    const prompt = generatePrompt(context);
    
    // Try Gemini for text generation if API key provided
    if (geminiApiKey) {
      const suggestion = await tryGemini(prompt, geminiApiKey);
      if (suggestion) return suggestion;
    }
    
    // Try Hugging Face (free)
    const suggestion = await tryHuggingFace(prompt);
    if (suggestion) return suggestion;
    
    // Fallback to rule-based suggestions
    return generateFallbackSuggestion(context);
  } catch (error) {
    console.error('AI suggestion failed:', error);
    return generateFallbackSuggestion(context);
  }
}

// Generate image-based suggestions using Gemini
async function generateImageBasedSuggestion(
  context: TemplateContext,
  imageAnalysis: ImageAnalysis,
  geminiApiKey: string
): Promise<AISuggestion | null> {
  try {
    const templatePrompt = TEMPLATE_PROMPTS[context.templateId] || 'Create a funny meme text.';
    
    const prompt = `Based on this image analysis, create a funny meme text for the ${context.templateName} template.

Image Analysis:
- Description: ${imageAnalysis.description}
- Objects: ${imageAnalysis.objects.join(', ')}
- Emotions: ${imageAnalysis.emotions.join(', ')}
- Context: ${imageAnalysis.context}
- Meme Potential: ${imageAnalysis.memePotential}/10

Template: ${templatePrompt}

Generate ONE funny, relatable meme text that connects the image content with this template. Return ONLY the top and bottom text, separated by "|". Make it short, punchy, and meme-worthy. Format: "Top text" | "Bottom text"`;

    const response = await fetch(`${AI_CONFIG.gemini.apiUrl}?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) return null;
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    // Parse the response
    const parts = text.split('|');
    if (parts.length >= 2) {
      return {
        topText: parts[0].trim().replace(/"/g, ''),
        bottomText: parts[1].trim().replace(/"/g, ''),
        confidence: Math.min(0.9, 0.6 + (imageAnalysis.memePotential / 20)),
        reasoning: `Based on image analysis: ${imageAnalysis.description}`
      };
    }
  } catch (error) {
    console.error('Gemini image-based suggestion failed:', error);
  }
  return null;
}

// Try Gemini API for text generation
async function tryGemini(prompt: string, apiKey: string): Promise<AISuggestion | null> {
  try {
    const response = await fetch(`${AI_CONFIG.gemini.apiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) return null;
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    // Parse the response
    const parts = text.split('|');
    if (parts.length >= 2) {
      return {
        topText: parts[0].trim().replace(/"/g, ''),
        bottomText: parts[1].trim().replace(/"/g, ''),
        confidence: 0.8,
        reasoning: 'Gemini AI-generated suggestion'
      };
    }
  } catch (error) {
    console.error('Gemini API error:', error);
  }
  return null;
}

function generatePrompt(context: TemplateContext): string {
  const templatePrompt = TEMPLATE_PROMPTS[context.templateId] || 'Create a funny meme text.';
  const currentText = context.currentTopText || context.currentBottomText;
  
  return `${templatePrompt}

Current text: ${currentText || 'None'}
Template: ${context.templateName}

Generate ONE funny, relatable meme text that fits this template. Return ONLY the top and bottom text, separated by "|". Make it short, punchy, and meme-worthy. Format: "Top text" | "Bottom text"`;
}

async function tryHuggingFace(prompt: string): Promise<AISuggestion | null> {
  try {
    const response = await fetch(AI_CONFIG.huggingFace.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 100,
          temperature: 0.8,
          do_sample: true
        }
      })
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const text = data[0]?.generated_text || '';
    
    // Parse the response
    const parts = text.split('|');
    if (parts.length >= 2) {
      return {
        topText: parts[0].trim(),
        bottomText: parts[1].trim(),
        confidence: 0.7,
        reasoning: 'AI-generated suggestion'
      };
    }
  } catch (error) {
    console.error('Hugging Face API error:', error);
  }
  
  return null;
}

async function tryOpenAI(prompt: string, apiKey: string): Promise<AISuggestion | null> {
  try {
    const response = await fetch(AI_CONFIG.openai.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: AI_CONFIG.openai.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.8
      })
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    
    // Parse the response
    const parts = text.split('|');
    if (parts.length >= 2) {
      return {
        topText: parts[0].trim(),
        bottomText: parts[1].trim(),
        confidence: 0.9,
        reasoning: 'OpenAI-generated suggestion'
      };
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
  }
  
  return null;
}

function generateFallbackSuggestion(context: TemplateContext): AISuggestion {
  const fallbacks: Record<string, { top: string; bottom: string }[]> = {
    'drake': [
      { top: 'Reading documentation', bottom: 'Just trying random code until it works' },
      { top: 'Going to the gym', bottom: 'Ordering pizza' },
      { top: 'Being productive', bottom: 'Scrolling TikTok' }
    ],
    'distracted': [
      { top: 'My current relationship', bottom: 'That cute barista who remembers my order' },
      { top: 'My job', bottom: 'Remote work in pajamas' },
      { top: 'My diet', bottom: 'McDonald\'s at 2 AM' }
    ],
    'expanding-brain': [
      { top: 'Using basic functions', bottom: 'Writing everything in one line' },
      { top: 'Using libraries', bottom: 'Writing your own framework' },
      { top: 'Following tutorials', bottom: 'Teaching others' }
    ],
    'two-buttons': [
      { top: 'Save money', bottom: 'Buy the expensive thing anyway' },
      { top: 'Go to bed early', bottom: 'Watch one more episode' },
      { top: 'Eat healthy', bottom: 'Order takeout' }
    ],
    'change-my-mind': [
      { top: 'Pineapple belongs on pizza', bottom: 'Change my mind' },
      { top: 'Coffee is a food group', bottom: 'Change my mind' },
      { top: 'Monday should be illegal', bottom: 'Change my mind' }
    ],
    'success-kid': [
      { top: 'When you finally fix that bug', bottom: 'After 3 hours of googling' },
      { top: 'When you find the perfect parking spot', bottom: 'Right in front of the store' },
      { top: 'When your code works on first try', bottom: 'And you don\'t know why' }
    ],
    'one-does-not-simply': [
      { top: 'One does not simply', bottom: 'Walk into Mordor' },
      { top: 'One does not simply', bottom: 'Understand JavaScript' },
      { top: 'One does not simply', bottom: 'Wake up on Monday' }
    ],
    'batman-slap': [
      { top: 'I can fix this with more code', bottom: 'No, you need to delete code' },
      { top: 'I\'ll just copy-paste from Stack Overflow', bottom: 'That\'s not how this works' },
      { top: 'I don\'t need to test this', bottom: 'Yes, you absolutely do' }
    ],
    'is-this': [
      { top: 'Is this a pigeon?', bottom: 'No, it\'s a seagull' },
      { top: 'Is this a bug?', bottom: 'No, it\'s a feature' },
      { top: 'Is this a problem?', bottom: 'No, it\'s an opportunity' }
    ],
    'doge': [
      { top: 'Much simple', bottom: 'Very complex, wow' },
      { top: 'Such code', bottom: 'Very bug, wow' },
      { top: 'Much coffee', bottom: 'Very awake, wow' }
    ]
  };
  
  const templateFallbacks = fallbacks[context.templateId] || [
    { top: 'Something funny', bottom: 'Something even funnier' }
  ];
  
  // Return a random fallback to avoid duplicates
  const randomFallback = templateFallbacks[Math.floor(Math.random() * templateFallbacks.length)];
  
  return {
    topText: randomFallback.top,
    bottomText: randomFallback.bottom,
    confidence: 0.6,
    reasoning: 'Curated suggestion based on popular internet memes'
  };
}
