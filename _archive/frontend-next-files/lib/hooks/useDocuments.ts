import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  generateDocument, 
  getDocuments, 
  downloadDocument,
  Document as DocumentType,
  DocumentGenerationOptions 
} from '../document-service';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

// Define the Document interface
export interface Document {
  id: string;
  filename: string;
  createdAt: string;
  fileType: string;
  downloadUrl: string;
}

// Define API endpoint
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Hook to fetch documents for a quote
 */
export function useDocuments(quoteId: string | undefined) {
  return useQuery({
    queryKey: ['documents', quoteId],
    queryFn: () => quoteId ? getDocuments(quoteId) : Promise.resolve([]),
    enabled: !!quoteId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to generate a document
 */
export function useGenerateDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      quoteId, 
      fileType 
    }: { 
      quoteId: string; 
      fileType: 'docx' | 'pdf' 
    }) => generateDocument(quoteId, { fileType }),
    onSuccess: (data, { quoteId }) => {
      // Invalidate documents query to refetch the list with the new document
      queryClient.invalidateQueries({ queryKey: ['documents', quoteId] });
    },
  });
}

/**
 * Hook to download a document
 */
export function useDownloadDocument() {
  return useMutation({
    mutationFn: (documentId: string) => downloadDocument(documentId),
    onSuccess: (blob, documentId) => {
      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document-${documentId}.${blob.type.includes('pdf') ? 'pdf' : 'docx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    },
  });
} 