/**
 * Document Service
 *
 * Service for generating and managing documents
 */
import { DOCUMENT_API } from './api-config';

/**
 * Document generation options
 */
export interface DocumentGenerationOptions {
  fileType: 'docx' | 'pdf';
  templateType?: string;
}

/**
 * Document interface
 */
export interface Document {
  id: string;
  quoteId: string;
  filename: string;
  fileType: string;
  createdAt: string;
  downloadUrl: string;
}

/**
 * Generate a document for a quote
 *
 * @param quoteId The ID of the quote to generate a document for
 * @param options The document generation options
 * @returns The generated document
 */
export async function generateDocument(
  quoteId: string,
  options: DocumentGenerationOptions
): Promise<Document> {
  try {
    const { fileType, templateType } = options;

    const response = await fetch(DOCUMENT_API.generate(quoteId, fileType), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ templateType }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.detail ||
        `Failed to generate document: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating document:', error);
    throw error;
  }
}

/**
 * Get documents for a quote
 *
 * @param quoteId The ID of the quote to get documents for
 * @returns A list of documents
 */
export async function getDocuments(quoteId: string): Promise<Document[]> {
  try {
    const response = await fetch(DOCUMENT_API.list(quoteId), {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.detail ||
        `Failed to fetch documents: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
}

/**
 * Download a document
 *
 * @param documentId The ID of the document to download
 * @returns A blob containing the document data
 */
export async function downloadDocument(documentId: string): Promise<Blob> {
  try {
    const response = await fetch(DOCUMENT_API.download(documentId), {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download document: ${response.status} ${response.statusText}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('Error downloading document:', error);
    throw error;
  }
}

/**
 * Get the download URL for a document
 *
 * @param documentId The ID of the document
 * @returns The download URL
 */
export function getDocumentDownloadUrl(documentId: string): string {
  return DOCUMENT_API.download(documentId);
}

// Create a named object before exporting it as default
const DocumentService = {
  generateDocument,
  getDocuments,
  getDocumentDownloadUrl,
  downloadDocument,
};

export default DocumentService;