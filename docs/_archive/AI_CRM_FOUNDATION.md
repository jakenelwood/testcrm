# AI-Centric CRM Foundation

## Overview

The AI-Centric CRM is a next-generation system designed from the ground up with AI at its core — not as an add-on.
Its first role is simple yet powerful: to **capture and manage lead data** (formerly "quote requests") and **build the memory layer** for future proactive assistance.
Over time, this CRM will evolve into an intelligent **Chief of Staff**, managing outreach, communication, and task follow-up across phone, SMS, and email channels — all driven by dynamic AI memory.

---

# Phase 1: Lead Management Foundation

## Focus
- Capture structured **lead data** (auto, home, specialty insurance inputs).
- Allow for **note-taking** per lead.
- Build an initial **memory base** for future AI retrieval.

## Stack
- **Frontend**: Next.js 15.3.1, TailwindCSS, ShadCN UI
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL) for structured lead and note storage
- **Deployment**: Vercel (frontend) + Docker Compose (backend)

## Status
- Forms are partially migrated from the original Quote Request system.
- Supabase backend integration underway for leads and notes.

---

# Phase 2: Twilio Dialer Integration

## Focus
- Add a **built-in dialer** for outbound calling directly from the CRM.
- Capture **call outcomes** and link them automatically to lead records.

## Stack
- **Dialer App**: FastAPI + Twilio Voice API
- **Hosting**: Hetzner CCX33 server (Ashburn, VA) for low-latency call routing
- **Frontend Access**: Unified inside the CRM UI (Next.js app on Vercel)

## Goal
- Enable users to **call leads directly** from the dashboard.
- Record **call notes** seamlessly after each call.

---

# Phase 3: Supabase pgvector for Unstructured Lead Memory

## Focus
- Store **unstructured notes**, call summaries, and future AI conversations as **embeddings**.
- Support **semantic search** for lead history (e.g., "Show me leads interested in home insurance last March").

## Stack
- **Vector DB**: Supabase with pgvector extension
- **Embedding Model**: bge-large-en-v1.5 (optimized for lead interaction memory)

## Goal
- Power intelligent memory retrieval for AI personalization.
- Enable early memory stitching before full RAG orchestration.

---

# Phase 4: SMS and Email Marketing Automation

## Focus
- Implement **automated SMS** follow-ups (via Twilio).
- Add basic **email drip sequences** tied to lead status.

## Stack
- **Backend**: FastAPI extensions for SMS/email orchestration
- **Frontend**: Marketing automation UI modules inside CRM
- **Providers**: Twilio (SMS), SMTP (email)

## Goal
- Nurture leads automatically based on CRM status and engagement history.
- Prepare infrastructure for future AI-driven personalized messaging.

---

# Phase 5: Retrieval-Augmented Generation (RAG) + Orchestration Layer

## Focus
- Add **context-aware RAG pipelines** using Supabase pgvector.
- Start using **LangChain** or custom Python orchestration to manage memory recall.

## Stack
- **Memory Layer**: Supabase pgvector for unified structured and vector storage
- **Orchestration**: FastAPI + LangChain pipelines

## Task
- Merge structured (PostgreSQL) and unstructured (vector) lead data on-demand.

## Goal
- Build "mental snapshots" of leads for smart, human-like follow-up.
- Allow AI to reference both lead form data and notes in a single response.

---

# Phase 6: AI Assistant Activation via OpenRouter API

## Focus
- Connect CRM to **GPT-4.1** via OpenRouter.ai API.
- Enable AI to suggest next actions, compose SMS, emails, and even summarize calls automatically.

## Stack
- **LLM Provider**: OpenRouter (GPT-4.1 to start)
- **Memory Fusion**: Combine Supabase + Qdrant retrievals into AI prompts

## Goal
- Transform the CRM into a true **Chief of Staff**, making recommendations proactively.
- Reduce user burden by summarizing lead interactions, suggesting next steps, and initiating outreach.

---

# Technology Stack Summary

- **Frontend**: Next.js 15.3.1 + TailwindCSS + ShadCN UI (Vercel hosted)
- **Backend**: FastAPI (Python) + Supabase (PostgreSQL) + Docker (dialer)
- **Vector Storage**: Supabase pgvector for unified structured and vector data
- **AI Models**: GPT-4.1 (OpenRouter) for orchestration, bge-large-en-v1.5 for embeddings
- **Hosting**: Vercel (frontend) + Hetzner CCX33 (dialer backend only)
- **Integrations**: Twilio (calls/SMS), SMTP (email)

---

# Development Roadmap (Summary)

1. Build the structured lead intake + note-taking CRM (Supabase)
2. Add Twilio-powered dialer module (Hetzner CCX33 backend)
3. Add Supabase pgvector for vectorized lead memory (unstructured storage)
4. Implement SMS/email marketing automations (basic workflows)
5. Introduce RAG orchestration + smart memory retrieval (LangChain)
6. Connect OpenRouter GPT-4.1 API to enable Chief of Staff AI intelligence

---

# Vision Statement

This is not just a CRM.
This is an **AI-powered relationship memory engine** —
A **living, thinking Chief of Staff** that manages, nurtures, and grows your business relationships with **precision, empathy, and foresight**.

