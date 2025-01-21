'use client';

import { useState, useEffect } from 'react';
import { Model, initializeModels } from '@/lib/kamiwaza/models';

interface ModelSelectorProps {
  onModelSelect: (model: Model) => void;
  className?: string;
}

export default function ModelSelector({ onModelSelect, className = '' }: ModelSelectorProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        const availableModels = await initializeModels();
        setModels(availableModels);
        
        // Auto-select first available model
        if (availableModels.length > 0 && !selectedModel) {
          const firstModel = availableModels[0];
          setSelectedModel(firstModel);
          onModelSelect(firstModel);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load models');
      } finally {
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);

  if (error) {
    return (
      <div className="text-red-500 p-4 rounded-sm bg-red-50 mb-4">
        Error loading models: {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-100 h-[50px] rounded-sm mb-4"></div>
    );
  }

  return (
    <div className={`w-full mb-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Model
      </label>
      <select
        className="w-full bg-white p-3 border box-border outline-none rounded-sm ring-2 ring-brand-default"
        value={selectedModel?.id || ''}
        onChange={(e) => {
          const model = models.find(m => m.id === e.target.value);
          if (model) {
            setSelectedModel(model);
            onModelSelect(model);
          }
        }}
      >
        {models.map((model) => (
          <option 
            key={model.id} 
            value={model.id}
            disabled={!model.deployment}
          >
            {model.label} {!model.deployment && '(Not Deployed)'}
          </option>
        ))}
      </select>
      {selectedModel && (
        <p className="mt-2 text-sm text-gray-500">
          {selectedModel.description}
        </p>
      )}
    </div>
  );
}