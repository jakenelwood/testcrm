# AI-Centric CRM Project Plan

## Project Overview

The AI-Centric CRM is a next-generation system designed from the ground up with AI at its core — not as an add-on. Its first role is simple yet powerful: to **capture and manage lead data** and **build the memory layer** for future proactive assistance. Over time, this CRM will evolve into an intelligent **Chief of Staff**, managing outreach, communication, and task follow-up across phone, SMS, and email channels — all driven by dynamic AI memory.

## Current Status

- **Phase 1 (Lead Management Foundation)**: In progress
  - Kanban board for lead management implemented
  - Supabase integration for lead storage completed
  - Basic lead management functionality working
  - Deployment to Vercel successful

## Technology Stack

- **Frontend**: 
  - Next.js 15.3.1
  - TailwindCSS + ShadCN UI
  - @dnd-kit/core for drag-and-drop functionality
  - Deployed on Vercel

- **Backend**:
  - Supabase (PostgreSQL) for structured data storage
  - Future: FastAPI (Python) for additional backend services

- **Database**:
  - Supabase (PostgreSQL) for structured lead and note storage
  - Future: Supabase pgvector for unstructured data and embeddings

- **Deployment**:
  - Frontend: Vercel
  - Future Backend: Docker Compose + Hetzner CCX33

## Development Roadmap

### Phase 1: Lead Management Foundation (Current)

**Focus**:
- Capture structured lead data (auto, home, specialty insurance inputs)
- Allow for note-taking per lead
- Build an initial memory base for future AI retrieval
- Organize leads using a Kanban-style board

**Key Features**:
- Dynamic lead intake forms
- Notes system attached to each lead
- Kanban board interface with drag-and-drop
- Basic lead search and filtering

**Database Structure**:
- `leads` table for storing lead information
- `lead_notes` table for storing notes related to leads
- `lead_communications` table for tracking communications

### Phase 2: Twilio Dialer Integration (Next)

**Focus**:
- Add a built-in dialer for outbound calling directly from the CRM
- Capture call outcomes and link them automatically to lead records

**Stack**:
- Dialer App: FastAPI + Twilio Voice API
- Hosting: Hetzner CCX33 server (Ashburn, VA) for low-latency call routing
- Frontend Access: Unified inside the CRM UI (Next.js app on Vercel)

### Phase 3: Supabase pgvector for Unstructured Lead Memory

**Focus**:
- Store unstructured notes, call summaries, and future AI conversations as embeddings
- Support semantic search for lead history

**Stack**:
- Vector DB: Supabase with pgvector extension
- Embedding Model: bge-large-en-v1.5 (optimized for lead interaction memory)

### Phase 4: SMS and Email Marketing Automation

**Focus**:
- Implement automated SMS follow-ups (via Twilio)
- Add basic email drip sequences tied to lead status

**Stack**:
- Backend: FastAPI extensions for SMS/email orchestration
- Frontend: Marketing automation UI modules inside CRM
- Providers: Twilio (SMS), SMTP (email)

### Phase 5: Retrieval-Augmented Generation (RAG) + Orchestration Layer

**Focus**:
- Add context-aware RAG pipelines using Supabase pgvector
- Start using LangChain or custom Python orchestration to manage memory recall

**Stack**:
- Memory Layer: Supabase pgvector for unified structured and vector storage
- Orchestration: FastAPI + LangChain pipelines

### Phase 6: AI Assistant Activation via OpenRouter API

**Focus**:
- Connect CRM to GPT-4.1 via OpenRouter.ai API
- Enable AI to suggest next actions, compose SMS, emails, and even summarize calls automatically

**Stack**:
- LLM Provider: OpenRouter (GPT-4.1 to start)
- Memory Fusion: Combine Supabase + Qdrant retrievals into AI prompts

## Immediate Next Steps

1. **Complete Phase 1 Refinements**:
   - Polish Kanban board UI and interactions
   - Enhance lead detail view with additional functionality
   - Implement comprehensive error handling

2. **Begin Phase 2 Planning**:
   - Set up Hetzner CCX33 server
   - Implement basic Twilio integration
   - Design dialer UI within the CRM

## Vision Statement

This is not just a CRM. This is an **AI-powered relationship memory engine** — a **living, thinking Chief of Staff** that manages, nurtures, and grows business relationships with **precision, empathy, and foresight**.
