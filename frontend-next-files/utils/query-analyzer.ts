/**
 * QUERY ANALYZER UTILITY
 * 
 * This utility provides functions to analyze query performance using Supabase Inspect.
 * It helps identify slow queries and provides insights for optimization.
 */

import supabase from './supabase/client';

/**
 * Analyzes a query using Supabase Inspect
 * @param queryName A descriptive name for the query
 * @param queryFn A function that executes the query to analyze
 * @returns The result of the query
 */
export async function analyzeQuery<T>(queryName: string, queryFn: () => Promise<T>): Promise<T> {
  console.time(`Query: ${queryName}`);
  
  try {
    // Execute the query
    const result = await queryFn();
    
    // Log performance information
    console.timeEnd(`Query: ${queryName}`);
    
    return result;
  } catch (error) {
    console.error(`Error in query "${queryName}":`, error);
    throw error;
  }
}

/**
 * Executes an EXPLAIN ANALYZE query to get detailed performance information
 * This should only be used in development, not in production
 * @param query The SQL query to analyze
 * @returns The query execution plan
 */
export async function explainQuery(query: string): Promise<any> {
  if (process.env.NODE_ENV === 'production') {
    console.warn('explainQuery should not be used in production');
    return null;
  }
  
  try {
    const { data, error } = await supabase.rpc('explain_analyze', {
      query_to_explain: query
    });
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error explaining query:', error);
    return null;
  }
}

/**
 * Creates a stored procedure to explain query plans
 * This should be run once to set up the explain_analyze function
 */
export async function setupExplainAnalyze(): Promise<void> {
  try {
    // Create the explain_analyze function if it doesn't exist
    const { error } = await supabase.rpc('create_explain_analyze_function');
    
    if (error) {
      // If the function already exists, this is fine
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }
    
    console.log('explain_analyze function is ready');
  } catch (error) {
    console.error('Error setting up explain_analyze function:', error);
  }
}

/**
 * Creates the stored procedure for explain_analyze
 * This should be run by an admin user
 */
export async function createExplainAnalyzeFunction(): Promise<void> {
  try {
    const { error } = await supabase.rpc('create_explain_analyze_function_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION explain_analyze(query_to_explain TEXT)
        RETURNS JSONB
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          result JSONB;
        BEGIN
          EXECUTE 'EXPLAIN (FORMAT JSON, ANALYZE, BUFFERS) ' || query_to_explain INTO result;
          RETURN result;
        END;
        $$;
      `
    });
    
    if (error) {
      throw error;
    }
    
    console.log('explain_analyze function created successfully');
  } catch (error) {
    console.error('Error creating explain_analyze function:', error);
  }
}
