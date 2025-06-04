'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Pipeline } from '@/types/lead';
import { fetchPipelines } from '@/utils/pipeline-api';

interface PipelineContextType {
  pipelines: Pipeline[];
  isLoading: boolean;
  refreshPipelines: () => Promise<void>;
  updatePipeline: (updatedPipeline: Pipeline) => void;
  addPipeline: (newPipeline: Pipeline) => void;
  removePipeline: (pipelineId: number) => void;
}

const PipelineContext = createContext<PipelineContextType | undefined>(undefined);

export function PipelineProvider({ children }: { children: ReactNode }) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to refresh pipelines from the API
  const refreshPipelines = async () => {
    try {
      setIsLoading(true);
      const data = await fetchPipelines();
      setPipelines(data);
    } catch (error) {
      console.error('Error refreshing pipelines:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update a pipeline in the local state
  const updatePipeline = (updatedPipeline: Pipeline) => {
    setPipelines(prev => {
      // If this pipeline was set as default, update other pipelines to not be default
      if (updatedPipeline.is_default) {
        return prev.map(p => 
          p.id === updatedPipeline.id 
            ? updatedPipeline 
            : { ...p, is_default: false }
        );
      } else {
        return prev.map(p => p.id === updatedPipeline.id ? updatedPipeline : p);
      }
    });
  };

  // Function to add a new pipeline to the local state
  const addPipeline = (newPipeline: Pipeline) => {
    setPipelines(prev => {
      // If this pipeline is set as default, update other pipelines to not be default
      if (newPipeline.is_default) {
        return [...prev.map(p => ({ ...p, is_default: false })), newPipeline];
      } else {
        return [...prev, newPipeline];
      }
    });
  };

  // Function to remove a pipeline from the local state
  const removePipeline = (pipelineId: number) => {
    setPipelines(prev => prev.filter(p => p.id !== pipelineId));
  };

  // Load pipelines on mount
  useEffect(() => {
    refreshPipelines();
  }, []);

  return (
    <PipelineContext.Provider value={{
      pipelines,
      isLoading,
      refreshPipelines,
      updatePipeline,
      addPipeline,
      removePipeline
    }}>
      {children}
    </PipelineContext.Provider>
  );
}

export function usePipelines() {
  const context = useContext(PipelineContext);
  if (context === undefined) {
    throw new Error('usePipelines must be used within a PipelineProvider');
  }
  return context;
}
