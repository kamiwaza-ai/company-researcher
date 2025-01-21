// lib/kamiwaza/provider.ts
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export function createKamiwazaProvider(port: number) {
  // Convert HTTPS to HTTP and remove /api from the base URL
  const baseUrl = process.env.NEXT_PUBLIC_KAMIWAZA_URI!
    .replace('https://', 'http://')
    .replace('/api', '');
  
  return createOpenAICompatible({
    name: 'model',
    baseURL: `${baseUrl}:${port}/v1`,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

// Helper function to create a wrapped model instance
export function createWrappedModel(modelName: string, port: number) {
  const provider = createKamiwazaProvider(port);
  return provider(modelName);
}