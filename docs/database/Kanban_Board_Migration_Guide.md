# 🎯 Kanban Board Migration Guide: Old Schema → Unified Schema

## Overview

This guide provides step-by-step instructions for migrating the existing kanban board from the old leads-based schema to the new unified contacts + opportunities schema.

---

## 🔄 Current vs New Data Flow

### Current Implementation (Old Schema)
```typescript
// Old: Single leads table with status field
interface Lead {
  id: string;
  status: 'New' | 'Contacted' | 'Quoted' | 'Sold' | 'Lost';
  // ... other fields
}

// Kanban columns based on lead.status
const leadsByStatus = groupBy(leads, 'status');
```

### New Implementation (Unified Schema)
```typescript
// New: Contacts + Opportunities with lifecycle stages
interface Contact {
  id: string;
  lifecycle_stage: 'lead' | 'opportunity_contact' | 'customer' | 'churned';
  // ... other fields
}

interface Opportunity {
  id: string;
  contact_id: string;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  // ... other fields
}

// Kanban columns based on contact + opportunity combination
const contactsWithOpportunities = await fetchContactsWithOpportunities();
const kanbanData = mapToKanbanStages(contactsWithOpportunities);
```

---

## 📊 Stage Mapping Logic

### Kanban Stage Determination Algorithm

```typescript
function determineKanbanStage(contact: Contact, opportunity?: Opportunity): KanbanStage {
  // No opportunity = early lead stages
  if (!opportunity) {
    if (contact.last_contact_at) {
      return 'Contacted';
    }
    return 'New';
  }
  
  // Opportunity exists = qualified lead or beyond
  switch (opportunity.stage) {
    case 'prospecting':
    case 'qualification':
      return 'Qualified';
    case 'proposal':
      return 'Quoted';
    case 'negotiation':
      return 'Negotiation';
    case 'closed_won':
      return 'Sold';
    case 'closed_lost':
      return 'Lost';
    default:
      return 'Qualified';
  }
}
```

### Reverse Mapping: Kanban → Schema Updates

```typescript
function getSchemaUpdatesForKanbanMove(
  contact: Contact, 
  fromStage: KanbanStage, 
  toStage: KanbanStage
): SchemaUpdates {
  const updates: SchemaUpdates = {
    contact: {},
    opportunity: null,
    createOpportunity: false
  };
  
  switch (toStage) {
    case 'New':
      updates.contact.lifecycle_stage = 'lead';
      updates.contact.last_contact_at = null;
      break;
      
    case 'Contacted':
      updates.contact.lifecycle_stage = 'lead';
      updates.contact.last_contact_at = new Date();
      break;
      
    case 'Qualified':
      updates.contact.lifecycle_stage = 'opportunity_contact';
      updates.createOpportunity = true;
      updates.opportunity = {
        stage: 'prospecting',
        name: `${contact.first_name} ${contact.last_name} - Insurance Quote`,
        contact_id: contact.id
      };
      break;
      
    case 'Quoted':
      updates.opportunity = { stage: 'proposal' };
      break;
      
    case 'Negotiation':
      updates.opportunity = { stage: 'negotiation' };
      break;
      
    case 'Sold':
      updates.contact.lifecycle_stage = 'customer';
      updates.opportunity = { 
        stage: 'closed_won',
        close_date: new Date()
      };
      break;
      
    case 'Lost':
      updates.contact.lifecycle_stage = 'churned';
      updates.opportunity = { 
        stage: 'closed_lost',
        close_date: new Date()
      };
      break;
  }
  
  return updates;
}
```

---

## 🔧 API Updates Required

### 1. New Data Fetching Function

```typescript
// Replace existing fetchLeads() function
async function fetchContactsWithOpportunities(): Promise<ContactWithOpportunity[]> {
  const response = await fetch('/api/contacts?include=opportunities');
  const { data } = await response.json();
  
  return data.map(contact => ({
    ...contact,
    opportunity: contact.opportunities?.[0] || null, // Latest opportunity
    kanbanStage: determineKanbanStage(contact, contact.opportunities?.[0])
  }));
}
```

### 2. Updated Drag & Drop Handler

```typescript
async function handleKanbanMove(
  contactId: string, 
  fromStage: KanbanStage, 
  toStage: KanbanStage
) {
  try {
    // Get current contact data
    const contact = await fetchContact(contactId);
    const opportunity = await fetchLatestOpportunity(contactId);
    
    // Determine required updates
    const updates = getSchemaUpdatesForKanbanMove(contact, fromStage, toStage);
    
    // Apply contact updates
    if (Object.keys(updates.contact).length > 0) {
      await updateContact(contactId, updates.contact);
    }
    
    // Handle opportunity updates
    if (updates.createOpportunity && updates.opportunity) {
      await createOpportunity({
        ...updates.opportunity,
        workspace_id: contact.workspace_id,
        contact_id: contactId
      });
    } else if (updates.opportunity && opportunity) {
      await updateOpportunity(opportunity.id, updates.opportunity);
    }
    
    // Log interaction
    await createInteraction({
      contact_id: contactId,
      type: 'note',
      subject: `Stage changed to ${toStage}`,
      content: `Contact moved from ${fromStage} to ${toStage} in kanban board`
    });
    
  } catch (error) {
    console.error('Error moving contact in kanban:', error);
    throw error;
  }
}
```

---

## 🎨 Component Updates

### 1. KanbanBoard Component

```typescript
// Update KanbanBoard.tsx
interface KanbanBoardProps {
  contacts: ContactWithOpportunity[]; // Changed from leads
  isLoading: boolean;
  onContactSelect: (contact: ContactWithOpportunity) => void; // Changed from onLeadSelect
  onStageMove: (contactId: string, fromStage: KanbanStage, toStage: KanbanStage) => void;
}

export function KanbanBoard({ contacts, isLoading, onContactSelect, onStageMove }: KanbanBoardProps) {
  // Group contacts by kanban stage
  const contactsByStage = contacts.reduce((acc, contact) => {
    const stage = contact.kanbanStage;
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(contact);
    return acc;
  }, {} as Record<KanbanStage, ContactWithOpportunity[]>);
  
  // Rest of component logic...
}
```

### 2. ContactCard Component (formerly LeadCard)

```typescript
// Update to show unified contact + opportunity data
interface ContactCardProps {
  contact: ContactWithOpportunity;
  onSelect: (contact: ContactWithOpportunity) => void;
}

export function ContactCard({ contact, onSelect }: ContactCardProps) {
  const { opportunity } = contact;
  
  return (
    <div className="contact-card" onClick={() => onSelect(contact)}>
      <h3>{contact.first_name} {contact.last_name}</h3>
      <p>{contact.email}</p>
      
      {/* Show opportunity details if exists */}
      {opportunity && (
        <div className="opportunity-info">
          <p>Quote: {opportunity.insurance_types?.join(', ')}</p>
          {opportunity.amount && (
            <p>Value: ${opportunity.amount}</p>
          )}
        </div>
      )}
      
      {/* Show contact stage info */}
      <div className="stage-info">
        <span className="lifecycle-stage">{contact.lifecycle_stage}</span>
        {opportunity && (
          <span className="opportunity-stage">{opportunity.stage}</span>
        )}
      </div>
    </div>
  );
}
```

---

## 🚀 Migration Steps

### Phase 1: Backend API Updates ✅
- [x] Create unified contacts API
- [x] Create opportunities API
- [x] Add relationship queries

### Phase 2: Frontend Data Layer
1. **Update data fetching functions**
   - Replace `fetchLeads()` with `fetchContactsWithOpportunities()`
   - Add opportunity relationship loading
   - Implement kanban stage mapping logic

2. **Update state management**
   - Change Redux/state structure from leads to contacts
   - Add opportunity data handling
   - Update selectors and reducers

### Phase 3: Component Updates
1. **KanbanBoard component**
   - Update props interface
   - Change data grouping logic
   - Update drag & drop handlers

2. **Card components**
   - Rename LeadCard to ContactCard
   - Add opportunity information display
   - Update styling for new data structure

3. **Forms and modals**
   - Update lead creation forms to create contacts
   - Add opportunity creation triggers
   - Update edit forms for new schema

### Phase 4: Testing & Validation
1. **Functional testing**
   - Test all kanban stage transitions
   - Verify data consistency
   - Test edge cases (contacts without opportunities)

2. **Performance testing**
   - Ensure query performance with joins
   - Test with large datasets
   - Optimize if needed

---

## 🎯 Success Criteria

- ✅ All kanban stages map correctly to unified schema
- ✅ Drag & drop creates appropriate contact/opportunity updates
- ✅ No data loss during transitions
- ✅ Performance remains acceptable
- ✅ UI/UX feels familiar to users
- ✅ All insurance-specific data preserved

This migration maintains the familiar kanban board experience while leveraging the power and flexibility of the unified schema architecture.
