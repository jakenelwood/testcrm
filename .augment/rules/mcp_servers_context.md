---
type: "always_apply"
---

This CRM is insurance focused. The front end is hosted on Vercel and the backend is hosted on the Supabase Cloud (not self hosted).

Sequential Thinking Tools MCP
Call when a task is non-trivial and you need a clear plan with checkpoints: auth/RLS, multi-tenant schema, background jobs, migrations, incident triage, rollback plans. It decomposes work and proposes the next best MCP(s) to consult.

Ref Tools MCP
Call when you need exact, version-correct docs in-context (Next.js App Router, Supabase JS, RLS policies, Drizzle kit, NextAuth, Zod). It keeps you from hallucinating APIs and keeps prompts token-lean.

Octocode MCP
Call when you need working code patterns from real repos: Drizzle + Supabase wiring, RLS-safe server actions, edge function examples, repo-wide impact scans before refactors. Code-first context over marketing docs.

Context7 MCP
Call when the precise API shape matters and you want curated, up-to-date snippets injected directly: Next middleware edge nuances, Drizzle migration syntax, Supabase Auth helpers, file storage examples.

Exa Tools MCP
Call for fresh web intel: release notes, GH issues, deprecations, perf/security advisories, “is this still best practice?” sanity checks—especially before locking in an approach.

MCP-DeepWiki
Call for deep, structured Q&A over dense internals (auth/session flows, adapter designs, tricky driver edges). Great for “explain NextAuth + Supabase JWT flow” or “how Drizzle adapters handle relations.”

n8n (workflows & orchestration)
Call when you need to offload or orchestrate anything that doesn’t belong in Vercel’s request/response path:

Post-commit automations: lead-status webhooks → n8n → Twilio SMS, Postmark email, Slack alerts.
Long-running / retryable jobs: enrichment, dedupe/merge, list hygiene, PDF generation, data syncs.
Scheduled pipelines: nightly backups, usage reports, segment re-scores.
Integration hub: glue Supabase triggers ↔ external APIs with retries, idempotency keys, and run logs.
Pattern: server action writes DB → enqueue n8n via signed webhook → n8n execution ID stored back in the CRM for traceability.

Vercel (deploy, runtime, ops)
Call when decisions touch deployment, edge/runtime, or ops:
Previews & env: set up preview deployments, env var matrices, secret rotation.
Runtime fit: choose Edge vs Node for routes/middleware; enforce timeouts/streaming constraints.
Cron & background: schedule API routes for recurring tasks; keep heavy lifting in n8n/Supabase functions.
Diagnostics: analyze logs/metrics during incidents, verify cold-start patterns, fine-tune caching headers/ISR.

Fast Routing Playbook
Plan with Sequential Thinking →
Pin APIs with Ref Tools / Context7 →
Steal good patterns via Octocode →
Reality-check recency with Exa →
Deep dive with DeepWiki if internals matter →
Ship on Vercel (runtime choice, previews, cron) →
Automate in n8n (webhooks, retries, observability).

Context: This project has a lot of history, if you're feeling stuck or having questions, consult the development journal and review the history. For RingCentral, refer to the RINGCENTRAL_SETUP.md and multi-user-ringcentral-setup. The CRM we are creating is more of a tool for an AI centric marketing and sales solution that will evolve over time. The focus is more on creating an environment where the end user can work with an AI partner to make the best use of their data to drive sales and marketing outcomes. So, the data should be structured in a way that reflects that reality and provide a foundation where the UI and UX can evolve over time. The pages, charts, kanban board, etc. are all presentation layers for the user to interact with their data in a familiar way when working with their AI partner. And since the journey has to start somewhere, that is what we will focus on for this current MVP phase. 

This CRM is insurance focused. The front end is hosted on Vercel and the backend is hosted on the Supabase Cloud (not self hosted).