# Schema Evolution Guidance for DBA

## Purpose
This document outlines the guiding principles for managing the CRM database schema in a way that enables long-term flexibility, adaptability, and performance as the application evolves. It is intended for the database administrator (DBA) or any team member responsible for maintaining the schema.

> Starting Point: Refer to the initial schema provided (e.g., Supabase schema diagram) as the baseline. The principles below apply on top of that foundation.

---

## Core Principle: **Evolving Schema, Not Static Schema**

The application is being developed in an agile, user-driven way. As such, **the schema must be designed with evolution in mind**, not as a rigid, fixed structure.

We expect new insurance lines, lead types, customer tags, contact methods, and AI integrations to be added continuously. Therefore, the schema must remain adaptable while preserving performance and clarity.

---

## Guiding Practices

### 1. **Hybrid Data Model (Relational + JSONB)**
- **Relational columns** are used for core, filterable fields (e.g., `status_id`, `client_type`, `assigned_to`, `insurance_type_id`)
- **JSONB fields** are used for variable-length, dynamic, or user-defined data (e.g., `auto_data`, `home_data`, `custom_fields`, `tags`, `additional_insureds`, `communications`)

This provides both structure (for performance and reporting) and flexibility (for features not yet defined).

### 2. **Promotion of JSON Fields to Columns**
- Monitor usage of fields within `custom_fields` or other JSONB blobs
- Promote frequently used or filtered fields to dedicated columns to improve performance and maintainability
- Avoid prematurely extracting every field — only promote when justified by business need or performance

### 3. **Support User-Defined Fields and Tags**
- Custom fields should be stored as a JSONB object:
```json
"custom_fields": {
  "referral_source": "Realtor - Jane",
  "account_level": "Platinum"
}
```
- Tags should be stored as an array of strings:
```json
"tags": ["ADHD Support", "Bundle Lead", "Follow-Up"]
```
- These should be GIN-indexed for later filtering or summarization

### 4. **Indexing Strategy**
- All frequently queried JSONB fields should be selectively indexed using GIN + expression indexes (e.g., `auto_data->>'vin'`)
- Relational columns should be indexed as usual (e.g., status, insurance type, lead owner)

### 5. **Unstructured Data (Audio, Transcripts, Summaries)**
- Store URLs to externally hosted media (e.g., audio recordings) in JSONB fields or dedicated tables
- Transcripts and AI-generated summaries can live in JSONB fields with searchable summaries promoted to columns if needed

### 6. **Inference Interactions with AI**
- All conversations between the AI and end users (whether users or leads) should be stored in an `ai_interactions` table:
```sql
CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('Chat', 'Follow-Up', 'Summary', 'Prediction', 'PromptResponse')),
  source TEXT CHECK (source IN ('Agent UI', 'Marketing Automation', 'AI Assistant', 'Backend Middleware')),
  content TEXT,
  ai_response TEXT,
  summary TEXT,
  model_used TEXT,
  temperature FLOAT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
- This enables prompt-response logging, AI auditing, and memory-driven suggestions or summaries.

### 7. **Customer Service Issues & Resolution Tracking**
- Support issues should be stored in a `support_tickets` table:
```sql
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  created_by TEXT,
  issue_type TEXT,
  issue_description TEXT,
  resolution_summary TEXT,
  status TEXT CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Escalated')),
  assigned_to TEXT,
  notes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
- This allows customer experience data to be recalled, summarized, or linked to satisfaction scores, AI-assisted follow-ups, or coaching tools.

---

## Communication and Coordination
- Developers and product managers will notify the DBA when schema-impacting features are proposed
- DBA should evaluate whether new fields should:
  - Be added to `custom_fields`
  - Be added as a new column
  - Require a new relational table (e.g., `locations`, `support_tickets`, `ai_interactions`)
- DBA may propose promotion of JSON fields to columns based on observed usage

---

## Summary
This database is designed to support an AI-driven, continuously evolving CRM platform. As such:
- Structure is reserved for performance-critical, well-known fields
- Flexibility is preserved using JSONB
- Schema is expected to **evolve**, not remain static
- The DBA is empowered to adapt the database as usage patterns emerge
- AI interactions and customer support issues are considered first-class data entities

This approach ensures the CRM remains fast, adaptable, and aligned with user needs as it grows.

