// API Configuration Module

// Base API URL - configurable via environment variables
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 
                           'http://65.21.174.252:8000'; // Hetzner server IP

// Document API endpoints
export const DOCUMENT_API = {
  // Generate document for a quote (docx or pdf)
  generate: (quoteId: string, fileType: string) => 
    `${API_BASE_URL}/api/documents/${quoteId}/generate?file_type=${fileType}`,
  
  // List documents for a quote
  list: (quoteId: string) => 
    `${API_BASE_URL}/api/documents/quote/${quoteId}`,
  
  // Download a specific document
  download: (documentId: string) => 
    `${API_BASE_URL}/api/documents/${documentId}/download`,
};

// Authentication endpoints
export const AUTH_API = {
  login: `${API_BASE_URL}/api/auth/login`,
  refresh: `${API_BASE_URL}/api/auth/refresh`,
  me: `${API_BASE_URL}/api/auth/me`,
};

// Quote endpoints
export const QUOTE_API = {
  list: `${API_BASE_URL}/api/quotes`,
  getById: (id: string) => `${API_BASE_URL}/api/quotes/${id}`,
  create: `${API_BASE_URL}/api/quotes`,
  update: (id: string) => `${API_BASE_URL}/api/quotes/${id}`,
  delete: (id: string) => `${API_BASE_URL}/api/quotes/${id}`,
  search: (query: string) => `${API_BASE_URL}/api/quotes/search?q=${encodeURIComponent(query)}`,
}; 