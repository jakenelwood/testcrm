# Developer Notes Guide

This guide explains how to use the `developer_notes` table to document decisions, challenges, and solutions as you build the CRM application.

## Purpose

The developer notes table serves several important purposes:

1. **Knowledge Preservation**: Capture the reasoning behind important decisions
2. **Onboarding**: Help new developers understand the codebase and its evolution
3. **Problem Tracking**: Document bugs, challenges, and their solutions
4. **Architecture Documentation**: Record architectural decisions and their context
5. **Feature Planning**: Document feature requirements and implementation plans

## Table Structure

The `developer_notes` table has a hybrid structure with both relational fields and JSONB fields:

### Categorization Fields

- `title`: A concise title for the note
- `category`: The type of note (e.g., 'bug', 'feature', 'decision', 'architecture', 'refactor')
- `tags`: An array of tags for easier searching
- `priority`: The importance level ('low', 'medium', 'high', 'critical')
- `status`: The current status ('open', 'in-progress', 'resolved', 'documented')

### Content Fields

- `summary`: A brief summary of the note (required)
- `description`: A detailed description of the issue, decision, or feature
- `solution`: The solution or implementation approach

### Relationship Fields

- `related_table`: The database table(s) related to this note
- `related_feature`: The feature or module related to this note
- `related_files`: An array of file paths related to this note

### JSONB Fields

- `technical_details`: Technical information like code snippets, error messages, or stack traces
- `decision_context`: For architectural decision records (problem, options, decision, consequences)
- `implementation_notes`: Implementation details that might change over time

### Metadata Fields

- `created_by`: The user who created the note
- `assigned_to`: The user assigned to address the issue (if applicable)
- `created_at`, `updated_at`, `resolved_at`: Timestamps for tracking

## When to Create Developer Notes

Create developer notes in the following situations:

1. **Architectural Decisions**: When making significant architectural choices
2. **Bug Fixes**: When fixing complex bugs that required investigation
3. **Feature Implementation**: When implementing new features, especially complex ones
4. **Refactoring**: When refactoring code that others might need to understand
5. **Performance Optimizations**: When optimizing performance-critical code
6. **Security Considerations**: When addressing security concerns
7. **Technical Debt**: When identifying or addressing technical debt

## How to Create Developer Notes

### Using SQL

```sql
INSERT INTO developer_notes (
  title,
  category,
  tags,
  priority,
  status,
  summary,
  description,
  related_table,
  related_feature,
  related_files,
  technical_details,
  decision_context,
  implementation_notes,
  created_by
) VALUES (
  'Implementing JWT Authentication',
  'feature',
  ARRAY['authentication', 'security', 'jwt'],
  'high',
  'in-progress',
  'Implement JWT-based authentication for the CRM',
  'We need to implement secure authentication using JWT tokens with Supabase Auth.',
  'users',
  'authentication',
  ARRAY['auth.ts', 'login.tsx', 'protected-route.tsx'],
  '{"libraries": ["@supabase/auth-helpers-nextjs", "@supabase/auth-ui-react"]}',
  '{"problem": "Need secure authentication", "options": ["JWT", "Session cookies", "OAuth only"], "decision": "JWT with Supabase Auth", "consequences": "Simple implementation but requires token management"}',
  '{"next_steps": ["Implement login UI", "Set up protected routes", "Add role-based access control"]}',
  'developer@example.com'
);
```

### Using TypeScript

```typescript
import { supabase } from '../utils/supabase/client';

const createDeveloperNote = async () => {
  const { data, error } = await supabase
    .from('developer_notes')
    .insert({
      title: 'Implementing JWT Authentication',
      category: 'feature',
      tags: ['authentication', 'security', 'jwt'],
      priority: 'high',
      status: 'in-progress',
      summary: 'Implement JWT-based authentication for the CRM',
      description: 'We need to implement secure authentication using JWT tokens with Supabase Auth.',
      related_table: 'users',
      related_feature: 'authentication',
      related_files: ['auth.ts', 'login.tsx', 'protected-route.tsx'],
      technical_details: {
        libraries: ['@supabase/auth-helpers-nextjs', '@supabase/auth-ui-react']
      },
      decision_context: {
        problem: 'Need secure authentication',
        options: ['JWT', 'Session cookies', 'OAuth only'],
        decision: 'JWT with Supabase Auth',
        consequences: 'Simple implementation but requires token management'
      },
      implementation_notes: {
        next_steps: ['Implement login UI', 'Set up protected routes', 'Add role-based access control']
      },
      created_by: supabase.auth.user()?.id || 'system'
    });
  
  if (error) {
    console.error('Error creating developer note:', error);
  } else {
    console.log('Developer note created:', data);
  }
};
```

## Querying Developer Notes

### Basic Queries

```typescript
// Get all developer notes
const { data: allNotes } = await supabase
  .from('developer_notes')
  .select('*')
  .order('created_at', { ascending: false });

// Get notes by category
const { data: architectureNotes } = await supabase
  .from('developer_notes')
  .select('*')
  .eq('category', 'architecture')
  .order('created_at', { ascending: false });

// Get notes by status
const { data: openNotes } = await supabase
  .from('developer_notes')
  .select('*')
  .eq('status', 'open')
  .order('priority', { ascending: false });

// Get notes by tag
const { data: authNotes } = await supabase
  .from('developer_notes')
  .select('*')
  .contains('tags', ['authentication'])
  .order('created_at', { ascending: false });
```

### Advanced Queries

```typescript
// Get notes related to a specific table
const { data: leadNotes } = await supabase
  .from('developer_notes')
  .select('*')
  .ilike('related_table', '%leads%')
  .order('created_at', { ascending: false });

// Full-text search in summary and description
const searchTerm = 'authentication';
const { data: searchResults } = await supabase
  .from('developer_notes')
  .select('*')
  .or(`summary.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
  .order('created_at', { ascending: false });

// Get recent notes by a specific user
const { data: userNotes } = await supabase
  .from('developer_notes')
  .select('*')
  .eq('created_by', 'user@example.com')
  .order('created_at', { ascending: false })
  .limit(10);
```

## Best Practices

1. **Be Concise**: Keep summaries brief and to the point
2. **Be Specific**: Include specific details that will help future developers
3. **Include Context**: Explain why decisions were made, not just what was done
4. **Use Tags Consistently**: Develop a consistent tagging system
5. **Link to Resources**: Include links to relevant documentation or discussions
6. **Update Status**: Keep the status field updated as notes progress
7. **Include Code Examples**: When relevant, include code snippets in the technical_details field

## Example Use Cases

### Architectural Decision Record

```typescript
await supabase.from('developer_notes').insert({
  title: 'Hybrid Storage Model for Insurance Data',
  category: 'architecture',
  tags: ['database', 'schema', 'jsonb'],
  priority: 'high',
  status: 'documented',
  summary: 'Decision to use hybrid storage model with relational + JSONB fields',
  description: 'We need to store both structured and unstructured data for insurance products with varying fields.',
  related_table: 'leads',
  related_feature: 'data-modeling',
  decision_context: {
    problem: 'Insurance products have both common and product-specific fields',
    options: [
      'Fully relational model with many tables',
      'Fully document model with all data in JSONB',
      'Hybrid model with core fields as columns and variable data in JSONB'
    ],
    decision: 'Hybrid model with core fields as columns and variable data in JSONB',
    consequences: 'Good balance of structure and flexibility, but requires careful schema versioning'
  },
  created_by: 'architect@example.com'
});
```

### Bug Tracking

```typescript
await supabase.from('developer_notes').insert({
  title: 'Lead Status Not Updating in UI',
  category: 'bug',
  tags: ['ui', 'leads', 'status'],
  priority: 'medium',
  status: 'resolved',
  summary: 'Lead status changes are not reflected in the UI until page refresh',
  description: 'When a lead status is updated, the change is saved to the database but not reflected in the UI until the page is refreshed.',
  solution: 'Added real-time subscription to lead status changes using Supabase real-time features.',
  related_table: 'leads',
  related_feature: 'lead-management',
  related_files: ['components/LeadCard.tsx', 'hooks/useLeadStatus.ts'],
  technical_details: {
    root_cause: 'Missing real-time subscription to lead status changes',
    fix: 'Added Supabase real-time subscription in useLeadStatus hook'
  },
  created_by: 'developer@example.com',
  resolved_at: new Date().toISOString()
});
```

## Conclusion

The developer notes table is a valuable tool for documenting the evolution of the CRM application. By consistently creating detailed notes, you'll build a knowledge base that helps current and future developers understand the codebase, its architecture, and the reasoning behind important decisions.
