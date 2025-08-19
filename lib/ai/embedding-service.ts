/**
 * 🧠 AI Embedding Service
 * Handles vector embedding generation using Voyage AI API
 * Implements the optimization report's recommendations for 1024-dimension embeddings
 */

import { createClient } from '@supabase/supabase-js';

// Types for embedding operations
export interface EmbeddingRequest {
  text: string;
  type: 'content' | 'summary';
  entityId: string;
  entityType: 'contact' | 'account' | 'interaction' | 'note' | 'document';
}

export interface EmbeddingResponse {
  embedding: number[];
  dimensions: number;
  model: string;
  usage: {
    total_tokens: number;
  };
}

export interface BatchEmbeddingRequest {
  texts: string[];
  type: 'content' | 'summary';
  entityIds: string[];
  entityType: 'contact' | 'account' | 'interaction' | 'note' | 'document';
}

class EmbeddingService {
  private voyageApiKey: string;
  private supabase: ReturnType<typeof createClient>;
  private readonly MODEL = 'voyage-3-large';
  private readonly DIMENSIONS = 1024;
  private readonly MAX_BATCH_SIZE = 128; // Voyage API batch limit
  private readonly MAX_TOKENS = 32000; // voyage-3-large context window

  constructor() {
    // Load environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const voyageApiKey = process.env.VOYAGE_API_KEY;

    if (!supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required');
    }
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    }
    if (!voyageApiKey) {
      throw new Error('VOYAGE_API_KEY environment variable is required');
    }

    this.voyageApiKey = voyageApiKey;
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Generate a single embedding using Voyage AI
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.voyageApiKey}`,
        },
        body: JSON.stringify({
          input: [text],
          model: this.MODEL,
          output_dimension: this.DIMENSIONS,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Voyage API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    
    // Split into batches if needed
    const batches: string[][] = [];
    for (let i = 0; i < texts.length; i += this.MAX_BATCH_SIZE) {
      batches.push(texts.slice(i, i + this.MAX_BATCH_SIZE));
    }

    const allEmbeddings: number[][] = [];

    for (const batch of batches) {
      try {
        const response = await fetch('https://api.voyageai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.voyageApiKey}`,
          },
          body: JSON.stringify({
            input: batch,
            model: this.MODEL,
            output_dimension: this.DIMENSIONS,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Voyage API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        const batchEmbeddings = data.data.map((item: any) => item.embedding);
        allEmbeddings.push(...batchEmbeddings);
      } catch (error) {
        console.error('Error generating batch embeddings:', error);
        throw error;
      }
    }

    return allEmbeddings;
  }

  /**
   * Update embedding for a contact's summary
   */
  async updateContactSummaryEmbedding(contactId: string, workspaceId: string): Promise<void> {
    try {
      // Generate summary text from recent interactions and contact data
      const summaryText = await this.generateContactSummary(contactId, workspaceId);
      
      if (!summaryText) {
        console.log(`No summary text generated for contact ${contactId}`);
        return;
      }

      // Generate embedding
      const embedding = await this.generateEmbedding(summaryText);

      // Update contact record
      const { error } = await this.supabase
        .from('contacts')
        .update({ 
          summary_embedding: `[${embedding.join(',')}]`,
          updated_at: new Date().toISOString()
        })
        .eq('id', contactId)
        .eq('workspace_id', workspaceId);

      if (error) {
        throw new Error(`Failed to update contact embedding: ${error.message}`);
      }

      console.log(`Updated summary embedding for contact ${contactId}`);
    } catch (error) {
      console.error(`Error updating contact summary embedding:`, error);
      throw error;
    }
  }

  /**
   * Update embedding for an account's summary
   */
  async updateAccountSummaryEmbedding(accountId: string, workspaceId: string): Promise<void> {
    try {
      // Generate summary text from account data and related interactions
      const summaryText = await this.generateAccountSummary(accountId, workspaceId);
      
      if (!summaryText) {
        console.log(`No summary text generated for account ${accountId}`);
        return;
      }

      // Generate embedding
      const embedding = await this.generateEmbedding(summaryText);

      // Update account record
      const { error } = await this.supabase
        .from('accounts')
        .update({ 
          summary_embedding: `[${embedding.join(',')}]`,
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId)
        .eq('workspace_id', workspaceId);

      if (error) {
        throw new Error(`Failed to update account embedding: ${error.message}`);
      }

      console.log(`Updated summary embedding for account ${accountId}`);
    } catch (error) {
      console.error(`Error updating account summary embedding:`, error);
      throw error;
    }
  }

  /**
   * Update embedding for interaction content
   */
  async updateInteractionEmbedding(interactionId: string, content: string): Promise<void> {
    try {
      if (!content || content.trim().length === 0) {
        console.log(`No content to embed for interaction ${interactionId}`);
        return;
      }

      // Truncate content if it exceeds token limit (rough estimate: 1 token ≈ 4 characters)
      const maxChars = this.MAX_TOKENS * 4;
      const truncatedContent = content.length > maxChars 
        ? content.substring(0, maxChars) + '...'
        : content;

      // Generate embedding
      const embedding = await this.generateEmbedding(truncatedContent);

      // Update interaction record
      const { error } = await this.supabase
        .from('interactions')
        .update({ 
          embedding: `[${embedding.join(',')}]`,
          updated_at: new Date().toISOString()
        })
        .eq('id', interactionId);

      if (error) {
        throw new Error(`Failed to update interaction embedding: ${error.message}`);
      }

      console.log(`Updated content embedding for interaction ${interactionId}`);
    } catch (error) {
      console.error(`Error updating interaction embedding:`, error);
      throw error;
    }
  }

  /**
   * Generate a natural language summary for a contact
   */
  private async generateContactSummary(contactId: string, workspaceId: string): Promise<string> {
    try {
      // Fetch contact data
      const { data: contact, error: contactError } = await this.supabase
        .from('contacts')
        .select(`
          first_name, last_name, email, phone, lifecycle_stage, 
          job_title, occupation, ai_risk_score, ai_lifetime_value,
          custom_fields, tags, last_contact_at
        `)
        .eq('id', contactId)
        .eq('workspace_id', workspaceId)
        .single();

      if (contactError || !contact) {
        throw new Error(`Failed to fetch contact: ${contactError?.message}`);
      }

      // Fetch recent interactions (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: interactions, error: interactionsError } = await this.supabase
        .from('interactions')
        .select('type, subject, content, sentiment, outcome, interacted_at')
        .eq('contact_id', contactId)
        .gte('interacted_at', thirtyDaysAgo.toISOString())
        .order('interacted_at', { ascending: false })
        .limit(10);

      if (interactionsError) {
        console.warn(`Failed to fetch interactions: ${interactionsError.message}`);
      }

      // Generate summary text
      let summary = `Contact: ${contact.first_name} ${contact.last_name}`;
      
      if (contact.job_title) summary += `, ${contact.job_title}`;
      if (contact.occupation) summary += `, ${contact.occupation}`;
      
      summary += `. Lifecycle stage: ${contact.lifecycle_stage}.`;
      
      if (contact.ai_risk_score) summary += ` Risk score: ${contact.ai_risk_score}/100.`;
      if (contact.ai_lifetime_value) summary += ` Estimated lifetime value: $${contact.ai_lifetime_value}.`;
      
      if (contact.tags && contact.tags.length > 0) {
        summary += ` Tags: ${contact.tags.join(', ')}.`;
      }

      if (interactions && interactions.length > 0) {
        summary += ` Recent activity: `;
        const recentInteractions = interactions.slice(0, 5).map(i => 
          `${i.type} on ${new Date(i.interacted_at).toLocaleDateString()}${i.sentiment ? ` (${i.sentiment})` : ''}${i.outcome ? ` - ${i.outcome}` : ''}`
        );
        summary += recentInteractions.join('; ') + '.';
      }

      return summary;
    } catch (error) {
      console.error('Error generating contact summary:', error);
      return '';
    }
  }

  /**
   * Generate a natural language summary for an account
   */
  private async generateAccountSummary(accountId: string, workspaceId: string): Promise<string> {
    try {
      // Fetch account data
      const { data: account, error: accountError } = await this.supabase
        .from('accounts')
        .select(`
          name, industry, employee_count, annual_revenue,
          ai_risk_score, ai_lifetime_value, custom_fields, tags
        `)
        .eq('id', accountId)
        .eq('workspace_id', workspaceId)
        .single();

      if (accountError || !account) {
        throw new Error(`Failed to fetch account: ${accountError?.message}`);
      }

      // Fetch associated contacts
      const { data: contacts, error: contactsError } = await this.supabase
        .from('contacts')
        .select('first_name, last_name, job_title, lifecycle_stage')
        .eq('account_id', accountId)
        .eq('workspace_id', workspaceId);

      if (contactsError) {
        console.warn(`Failed to fetch account contacts: ${contactsError.message}`);
      }

      // Generate summary text
      let summary = `Account: ${account.name}`;
      
      if (account.industry) summary += ` in ${account.industry}`;
      if (account.employee_count) summary += ` with ${account.employee_count} employees`;
      if (account.annual_revenue) summary += ` and $${account.annual_revenue} annual revenue`;
      
      summary += '.';
      
      if (account.ai_risk_score) summary += ` Risk score: ${account.ai_risk_score}/100.`;
      if (account.ai_lifetime_value) summary += ` Estimated lifetime value: $${account.ai_lifetime_value}.`;
      
      if (contacts && contacts.length > 0) {
        summary += ` Key contacts: `;
        const contactSummaries = contacts.map(c => 
          `${c.first_name} ${c.last_name}${c.job_title ? ` (${c.job_title})` : ''} - ${c.lifecycle_stage}`
        );
        summary += contactSummaries.join('; ') + '.';
      }

      if (account.tags && account.tags.length > 0) {
        summary += ` Tags: ${account.tags.join(', ')}.`;
      }

      return summary;
    } catch (error) {
      console.error('Error generating account summary:', error);
      return '';
    }
  }

  /**
   * Semantic search across contacts using vector similarity
   */
  async searchContacts(query: string, workspaceId: string, limit: number = 10): Promise<any[]> {
    try {
      // Generate embedding for search query
      const queryEmbedding = await this.generateEmbedding(query);

      // Perform vector similarity search
      const { data, error } = await this.supabase.rpc('search_contacts_by_embedding', {
        query_embedding: `[${queryEmbedding.join(',')}]`,
        workspace_id: workspaceId,
        match_threshold: 0.7, // Adjust based on testing
        match_count: limit
      });

      if (error) {
        throw new Error(`Search failed: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error searching contacts:', error);
      throw error;
    }
  }

  /**
   * Semantic search across interactions using vector similarity
   */
  async searchInteractions(query: string, workspaceId: string, limit: number = 20): Promise<any[]> {
    try {
      // Generate embedding for search query
      const queryEmbedding = await this.generateEmbedding(query);

      // Perform vector similarity search
      const { data, error } = await this.supabase.rpc('search_interactions_by_embedding', {
        query_embedding: `[${queryEmbedding.join(',')}]`,
        workspace_id: workspaceId,
        match_threshold: 0.7,
        match_count: limit
      });

      if (error) {
        throw new Error(`Search failed: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error searching interactions:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();

// Export types
export type { EmbeddingRequest, EmbeddingResponse, BatchEmbeddingRequest };
