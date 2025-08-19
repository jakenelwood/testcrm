# 🚀 Lead Journey Mapping: Unified Schema Architecture

## Overview

This document maps how leads flow through our unified AI-native CRM schema from first contact to becoming a client. It also identifies how the existing kanban board stages align with the new unified schema structure.

## 📊 Visual Flow Diagram

The complete lead journey flow is visualized in the Mermaid diagram: [`lead_journey_diagram.mmd`](./lead_journey_diagram.mmd)

This diagram shows:
- **Contact lifecycle stages** (blue) - Database contact states
- **Opportunity stages** (purple) - Sales pipeline progression
- **Kanban board mapping** (orange) - UI stage representation
- **Final outcomes** (green) - Customer or churned states

## 📊 Unified Schema Lead Journey

### Core Entities in Lead Journey

1. **Contacts** - Individual people (unified leads/clients)
2. **Accounts** - Companies (for B2B relationships)
3. **Opportunities** - Insurance quotes/policies in progress
4. **Interactions** - All communications and activities

---

## 🔄 Lead Lifecycle Flow

### Stage 1: Initial Contact → Contact Creation
**Entry Point**: Lead form submission, referral, or manual entry

```sql
-- Contact created with lifecycle_stage = 'lead'
INSERT INTO contacts (
  workspace_id,
  first_name,
  last_name,
  email,
  phone,
  lifecycle_stage,  -- 'lead'
  lead_source,
  custom_fields     -- Insurance interests, current carrier, etc.
);
```

**Unified Schema Fields:**
- `lifecycle_stage`: `'lead'` (default)
- `lead_source`: Website, Referral, Cold Call, etc.
- `custom_fields`: Insurance-specific data
- `tags`: Categorization and priority

---

### Stage 2: Qualification → Opportunity Creation
**Trigger**: Lead shows genuine interest and qualifies for insurance

```sql
-- Contact updated to opportunity_contact
UPDATE contacts 
SET lifecycle_stage = 'opportunity_contact'
WHERE id = contact_id;

-- Opportunity created for insurance quote
INSERT INTO opportunities (
  workspace_id,
  contact_id,
  name,
  stage,              -- 'start'
  insurance_types,    -- ['auto', 'home']
  current_carrier,
  current_premium
);
```

**Key Transition:**
- Contact: `lifecycle_stage` → `'opportunity_contact'`
- New Opportunity: `stage` → `'start'`

---

### Stage 3: Sales Process → Opportunity Progression
**Activities**: Needs assessment, quote preparation, proposal

```sql
-- Opportunity progresses through stages
UPDATE opportunities 
SET 
  stage = 'contacted?',  -- or 'quoted?', 'proposed'
  stage_changed_at = NOW(),
  ai_win_probability = 75
WHERE id = opportunity_id;
```

**Opportunity Stages:**
1. `'start'` - Initial opportunity creation
2. `'attempting_contact'` - Multiple contact attempts in progress (configurable max attempts)
3. `'contacted_no_interest'` - Made contact but they don't want a quote
4. `'contacted_interested'` - Made contact and they want a quote
5. `'quoted'` - Quote prepared and presented
6. `'proposed'` - Formal proposal submitted
7. `'closed_won'` - Policy sold and activated
8. `'closed_lost'` - Opportunity lost to competitor or no decision
9. `'paused'` - Couldn't reach after max attempts, paused for custom duration
10. `'future_follow_up_date'` - Scheduled for specific future follow-up

---

### Stage 4: Conversion → Customer Creation
**Success Path**: Opportunity closed won

```sql
-- Contact becomes customer
UPDATE contacts 
SET lifecycle_stage = 'customer'
WHERE id = contact_id;

-- Opportunity marked as won
UPDATE opportunities 
SET 
  stage = 'closed_won',
  close_date = CURRENT_DATE,
  stage_changed_at = NOW()
WHERE id = opportunity_id;
```

**Final State:**
- Contact: `lifecycle_stage` → `'customer'`
- Opportunity: `stage` → `'closed_won'`

---

## 🎯 Kanban Board Stage Mapping

### Current Kanban Stages → Unified Schema Mapping

| **Kanban Stage** | **Contact Lifecycle** | **Opportunity Stage** | **Description** |
|------------------|----------------------|----------------------|-----------------|
| **New** | `lead` | N/A | Fresh lead, no opportunity yet |
| **Contacting** | `opportunity_contact` | `attempting_contact` | Multiple contact attempts in progress |
| **No Interest** | `opportunity_contact` | `contacted_no_interest` | Made contact but no quote interest |
| **Interested** | `opportunity_contact` | `contacted_interested` | Made contact and wants quote |
| **Quoted** | `opportunity_contact` | `quoted` | Quote prepared and presented |
| **Negotiation** | `opportunity_contact` | `proposed` | Formal proposal submitted |
| **Sold** | `customer` | `closed_won` | Policy sold and activated |
| **Lost** | `churned` | `closed_lost` | Opportunity lost |
| **Paused** | `lead` | `paused` | Couldn't reach, paused for custom duration |
| **Follow-up** | `lead` | `future_follow_up_date` | Scheduled for specific future contact |

### Detailed Stage Mapping

#### 1. **New** → Contact Only
```typescript
{
  lifecycle_stage: 'lead',
  lead_source: 'Website',
  // No opportunity created yet
}
```

#### 2. **Contacted** → Contact Only
```typescript
{
  lifecycle_stage: 'lead',
  last_contact_at: '2025-08-15T10:00:00Z',
  // Still no opportunity
}
```

#### 3. **Qualified** → Contact + Opportunity
```typescript
// Contact
{
  lifecycle_stage: 'opportunity_contact'
}

// New Opportunity
{
  stage: 'start',
  contact_id: 'contact-uuid',
  insurance_types: ['auto', 'home']
}
```

#### 4. **Quoted** → Opportunity Progression
```typescript
{
  stage: 'quoted?',
  premium_breakdown: {
    auto: 1200,
    home: 800
  },
  ai_win_probability: 65
}
```

#### 5. **Sold** → Customer Conversion
```typescript
// Contact
{
  lifecycle_stage: 'customer'
}

// Opportunity
{
  stage: 'closed_won',
  close_date: '2025-08-15',
  amount: 2000
}
```

---

## 🔄 Activity Tracking Throughout Journey

### Interaction Types by Stage

```sql
-- Track all activities in interactions table
INSERT INTO interactions (
  workspace_id,
  contact_id,
  opportunity_id,
  type,           -- 'email', 'call', 'meeting', 'note'
  subject,
  content,
  direction,      -- 'inbound', 'outbound'
  sentiment       -- 'positive', 'neutral', 'negative'
);
```

**Common Interaction Patterns:**
- **Lead Stage**: Email outreach, cold calls, form submissions
- **Opportunity Stage**: Needs assessment calls, quote presentations
- **Customer Stage**: Policy delivery, onboarding, renewals

---

## 🎨 UI Implementation Strategy

### Kanban Board Updates Required

1. **Data Source Changes**
```typescript
// Old: Query leads table
const leads = await fetchLeads();

// New: Query contacts with opportunities
const contacts = await fetchContactsWithOpportunities();
```

2. **Stage Logic Updates**
```typescript
// Determine kanban stage from unified schema
function getKanbanStage(contact: Contact, opportunity?: Opportunity) {
  if (!opportunity) {
    return contact.last_contact_at ? 'Contacted' : 'New';
  }
  
  switch (opportunity.stage) {
    case 'start': return 'Qualified';
    case 'contacted?': return 'Contacted';
    case 'quoted?': return 'Quoted';
    case 'proposed': return 'Negotiation';
    case 'closed_won': return 'Sold';
    case 'closed_lost': return 'Lost';
    case 'future_follow_up_date': return 'Follow-up';
    default: return 'Qualified';
  }
}
```

3. **Drag & Drop Updates**
```typescript
// Handle stage transitions
async function moveContact(contactId: string, newStage: string) {
  const updates = getUpdatesForStage(newStage);
  
  // Update contact lifecycle if needed
  if (updates.lifecycle_stage) {
    await updateContact(contactId, { lifecycle_stage: updates.lifecycle_stage });
  }
  
  // Create or update opportunity if needed
  if (updates.opportunity_stage) {
    await upsertOpportunity(contactId, { stage: updates.opportunity_stage });
  }
}
```

---

## 🚀 Migration Strategy

### Phase 1: API Layer (✅ Complete)
- ✅ Unified contacts API
- ✅ Opportunities API
- ✅ Health check validation

### Phase 2: Frontend Updates (Next)
1. Update kanban board to use unified APIs
2. Modify drag & drop logic for new schema
3. Update lead forms to create contacts
4. Add opportunity creation triggers

### Phase 3: Advanced Features
1. AI-powered stage recommendations
2. Automated opportunity creation
3. Advanced analytics on conversion rates
4. Multi-touch attribution tracking

---

## 📈 Benefits of Unified Schema

1. **Simplified Data Model**: Single contact entity vs separate leads/clients
2. **Better Relationship Tracking**: Clear B2B account relationships
3. **Enhanced Analytics**: Unified journey tracking from lead to customer
4. **AI-Ready Architecture**: Vector embeddings and AI insights built-in
5. **Scalable Design**: Partitioned interactions for high-volume activity
6. **Insurance Domain Optimized**: Custom fields for insurance-specific data

This unified approach provides a solid foundation for the AI-centric CRM while maintaining familiar kanban board workflows for users.
