// lib/kamiwaza/models.ts
import { createKamiwazaProvider } from './provider';
import { KamiwazaClient, UIModelDeployment, KamiwazaModel } from './client';

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
  deployment?: {
    id: string;
    lb_port: number;
  };
}

// Will be populated from Kamiwaza API
export let models: Model[] = [];

// Helper to get a valid model ID
export function getValidModelId(modelId?: string | null): string {
  // If a model ID is provided and exists in the models list, use it
  if (modelId && models.some(model => model.id === modelId)) {
    return modelId;
  }
  
  // Otherwise use the first available model
  const firstModel = models[0];
  if (!firstModel) {
    throw new Error('No models available');
  }
  
  return firstModel.id;
}

// Function to convert Kamiwaza models to our format
export function mapKamiwazaToModel(
  model: KamiwazaModel, 
  deployment?: UIModelDeployment
): Model {
  return {
    id: model.id,
    label: model.name,
    apiIdentifier: `${model.name}${model.version ? `@${model.version}` : ''}`,
    description: model.description || '',
    deployment: deployment ? {
      id: deployment.id,
      lb_port: deployment.lb_port
    } : undefined
  };
}

// Initialize models from Kamiwaza
export async function initializeModels() {
  if (!process.env.NEXT_PUBLIC_KAMIWAZA_URI) {
    throw new Error('NEXT_PUBLIC_KAMIWAZA_URI environment variable is not set');
  }
  
  const client = new KamiwazaClient(process.env.NEXT_PUBLIC_KAMIWAZA_URI);
  const [modelList, deployments] = await Promise.all([
    client.listModels(),
    client.listDeployments()
  ]);

  models = modelList.map(model => {
    const deployment = deployments.find(d => d.m_id === model.id);
    return mapKamiwazaToModel(model, deployment);
  });

  return models;
}

// Get model instance by ID
export function getModelById(modelId: string): Model | undefined {
  return models.find(model => model.id === modelId);
}