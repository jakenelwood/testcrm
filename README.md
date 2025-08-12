# 🤖 AI-Centric Insurance CRM

**Modern insurance CRM powered by AI, built with Next.js, Supabase, and n8n automation**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)

## 🎯 **Quick Start**

```bash
# 1. Clone and setup
git clone https://github.com/jakenelwood/crm.git
cd crm

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env.local
# Add your Supabase and other API keys

# 4. Start development
npm run dev
```

**✅ Ready in 5 minutes!** Visit `http://localhost:3000`

## 🤖 **AI-First Insurance CRM**

This CRM is designed from the ground up to be an AI partner for insurance professionals, not just a traditional data management system.

### **🎯 Core Philosophy**
- **AI as a Partner**: Every interaction is enhanced by AI insights and recommendations
- **Insurance-Focused**: Purpose-built for auto, home, commercial, and specialty insurance
- **Data-Driven**: Structured to support AI analysis and decision-making
- **Workflow Automation**: Integrated with n8n for complex business process automation

## 🏗️ **Architecture**

```
Frontend (Next.js) ←→ Supabase (Database + Auth) ←→ n8n (Automation)
       ↓                        ↓                        ↓
    Vercel                 PostgreSQL + RLS           Workflows
```

**Key Features:**
- 🤖 **AI-Enhanced**: Every lead, client, and interaction includes AI insights
- 🛡️ **Insurance-Specific**: Auto, home, commercial, and specialty insurance forms
- 🔄 **Automation**: n8n integration for complex workflows
- 📊 **Analytics**: Built-in marketing analytics and lead scoring
- 🧪 **Type-Safe**: Full TypeScript with comprehensive testing

## 🌟 **AI-Centric Features**

### **🤖 AI-Enhanced Data Model**
- **AI Summary Fields**: Every lead and client has AI-generated summaries
- **AI Action Recommendations**: Next best actions suggested by AI
- **AI Risk Scoring**: Automated risk assessment for underwriting
- **AI Quote Optimization**: Smart quote recommendations based on data
- **AI Follow-up Prioritization**: Intelligent lead prioritization

### **🏢 Insurance-Specific**
- **Multi-Line Support**: Auto, Home, Commercial, Specialty insurance
- **Flexible Forms**: Dynamic forms based on insurance type
- **Quote Management**: Comprehensive quote tracking and comparison
- **Policy Data**: Structured storage for all policy information
- **Claims Integration**: Ready for claims management integration

### **🔗 Integration Ready**
- **n8n Workflows**: Automated marketing and follow-up sequences
- **RingCentral**: Built-in telephony and SMS integration
- **Webhook Support**: Easy integration with external AI services
- **API-First**: RESTful APIs for all data operations

## 🛠️ **Tech Stack**

### **Frontend**
- **Framework**: Next.js 15 with App Router
- **UI**: React 19, TypeScript, Tailwind CSS, shadcn/ui
- **State**: React Context, React Hook Form, TanStack Query
- **Testing**: Jest, React Testing Library

### **Backend & Database**
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth with JWT
- **API**: Next.js API routes (serverless on Vercel)
- **Automation**: n8n workflows (self-hosted)

### **Deployment**
- **Frontend**: Vercel (with edge functions)
- **Database**: Supabase (managed PostgreSQL)
- **Automation**: n8n on Hetzner server (5.78.68.209)

## 🚀 **Development Workflow**

### **Local Development**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### **Environment Setup**
```bash
# Copy environment template
cp .env.example .env.local

# Add your keys:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RINGCENTRAL_CLIENT_ID=your_ringcentral_client_id
RINGCENTRAL_CLIENT_SECRET=your_ringcentral_secret
```

## 📊 **Database Schema Overview**

### **Core Insurance Tables**
- **`leads_ins_info`** - Insurance-specific lead data with AI fields
- **`leads_contact_info`** - Client demographics and contact information
- **`insurance_types`** - Auto, Home, Commercial, Specialty configurations
- **`pipelines`** - Customizable sales workflows with AI action templates

### **AI Integration Tables**
- **`ai_interactions`** - Log of all AI conversations and decisions
- **`campaigns`** - Marketing campaigns with AI optimization notes
- **`lead_statuses`** - Status definitions with AI action templates

### **Key AI Fields**
- `ai_summary` - AI-generated interaction summaries
- `ai_next_action` - AI-recommended next steps
- `ai_quote_recommendation` - AI-powered quote suggestions
- `ai_follow_up_priority` - AI-calculated priority scores
- `ai_risk_score` - AI-assessed risk levels for underwriting

## 🤝 **Contributing**

1. **Follow the AI-centric approach**: Every feature should enhance the AI partnership
2. **Insurance focus**: Keep the insurance industry needs at the center
3. **Run tests**: `npm test` (all tests must pass)
4. **Type safety**: Full TypeScript with strict mode

---

**Built with ❤️ for insurance professionals working with AI partners**
