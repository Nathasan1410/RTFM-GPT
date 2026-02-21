import Cerebras from '@cerebras/cerebras_cloud_sdk';
import Groq from 'groq-sdk';

type AIProvider = 'cerebras' | 'groq';

interface AIConfig {
  provider: AIProvider;
  apiKey: string;
}

// Default to Groq if available (as requested "best model possible")
const getAIConfig = (apiKeyOverrides?: { groq?: string | undefined; cerebras?: string | undefined }): AIConfig => {
  // Check overrides first
  if (apiKeyOverrides?.groq) {
    return { provider: 'groq', apiKey: apiKeyOverrides.groq };
  }
  if (apiKeyOverrides?.cerebras) {
    return { provider: 'cerebras', apiKey: apiKeyOverrides.cerebras };
  }

  // Fallback to env
  if (process.env.GROQ_API_KEY) {
    return { provider: 'groq', apiKey: process.env.GROQ_API_KEY };
  }
  if (process.env.CEREBRAS_API_KEY) {
    return { provider: 'cerebras', apiKey: process.env.CEREBRAS_API_KEY };
  }
  throw new Error('No AI API Key found. Please set API Keys in Settings or .env.local');
};

export const getAIClient = (apiKeyOverrides?: { groq?: string | undefined; cerebras?: string | undefined }) => {
  const config = getAIConfig(apiKeyOverrides);
  
  if (config.provider === 'groq') {
    return {
      client: new Groq({ apiKey: config.apiKey }),
      provider: 'groq',
      // Best model on Groq as of now
      defaultModel: 'llama-3.3-70b-versatile', 
      // Fast model for simpler tasks
      fastModel: 'llama-3.1-8b-instant' 
    };
  } else {
    return {
      client: new Cerebras({ apiKey: config.apiKey }),
      provider: 'cerebras',
      // Best model on Cerebras (Production)
      defaultModel: 'llama3.1-8b', 
      fastModel: 'llama3.1-8b'
    };
  }
};
