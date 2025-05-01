# Frontend Code Adaptation Guide

This guide provides instructions for adapting frontend code to work with the normalized database schema. The CRM system has evolved from a simple leads-based model to a more sophisticated client-lead relationship model with lookup tables and AI integration.

## Key Schema Changes

1. **Client-Lead Relationship**
   - Leads now reference clients through `client_id` instead of having direct name/contact fields
   - Client information (name, email, phone) is stored in the `clients` table

2. **Lookup Tables**
   - Status values come from the `lead_statuses` table instead of being hardcoded
   - Insurance types come from the `insurance_types` table
   - Communication types come from the `communication_types` table

3. **AI Integration**
   - AI-specific fields added to leads and clients
   - New `ai_interactions` table for conversation history
   - New `support_tickets` table for customer service

## Updating Components

### Forms

#### Lead Form

Before:
```tsx
const LeadForm = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    insurance_type: 'Auto',
    status: 'New',
    // ...
  });
  
  // Form submission
  const handleSubmit = async () => {
    await supabase.from('leads').insert(formData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={formData.first_name} 
        onChange={(e) => setFormData({...formData, first_name: e.target.value})} 
      />
      {/* Other fields */}
    </form>
  );
};
```

After:
```tsx
const LeadForm = () => {
  // Client information
  const [clientData, setClientData] = useState({
    client_type: 'individual',
    name: '',
    email: '',
    phone_number: '',
    // ...
  });
  
  // Lead information
  const [leadData, setLeadData] = useState({
    status_id: null,
    insurance_type_id: null,
    // ...
  });
  
  // Load lookup data
  const [statuses, setStatuses] = useState([]);
  const [insuranceTypes, setInsuranceTypes] = useState([]);
  
  useEffect(() => {
    const fetchLookupData = async () => {
      const { data: statusData } = await supabase.from('lead_statuses').select('*');
      const { data: insuranceData } = await supabase.from('insurance_types').select('*');
      
      setStatuses(statusData);
      setInsuranceTypes(insuranceData);
      
      // Set defaults
      setLeadData({
        ...leadData,
        status_id: statusData.find(s => s.value === 'New')?.id,
        insurance_type_id: insuranceData[0]?.id
      });
    };
    
    fetchLookupData();
  }, []);
  
  // Form submission
  const handleSubmit = async () => {
    // First create the client
    const { data: client } = await supabase.from('clients').insert(clientData).select();
    
    // Then create the lead with the client_id
    if (client && client[0]) {
      await supabase.from('leads').insert({
        ...leadData,
        client_id: client[0].id
      });
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Client fields */}
      <input 
        value={clientData.name} 
        onChange={(e) => setClientData({...clientData, name: e.target.value})} 
      />
      
      {/* Lead fields */}
      <select
        value={leadData.status_id}
        onChange={(e) => setLeadData({...leadData, status_id: e.target.value})}
      >
        {statuses.map(status => (
          <option key={status.id} value={status.id}>{status.value}</option>
        ))}
      </select>
      
      {/* Other fields */}
    </form>
  );
};
```

### Data Fetching

#### Lead List

Before:
```tsx
const LeadList = () => {
  const [leads, setLeads] = useState([]);
  
  useEffect(() => {
    const fetchLeads = async () => {
      const { data } = await supabase.from('leads').select('*');
      setLeads(data);
    };
    
    fetchLeads();
  }, []);
  
  return (
    <div>
      {leads.map(lead => (
        <div key={lead.id}>
          <h3>{lead.first_name} {lead.last_name}</h3>
          <p>Email: {lead.email}</p>
          <p>Status: {lead.status}</p>
        </div>
      ))}
    </div>
  );
};
```

After:
```tsx
const LeadList = () => {
  const [leads, setLeads] = useState([]);
  
  useEffect(() => {
    const fetchLeads = async () => {
      const { data } = await supabase
        .from('leads')
        .select(`
          *,
          client:client_id(*),
          status:status_id(id, value, color_hex, icon_name),
          insurance_type:insurance_type_id(id, name, icon_name)
        `);
      
      setLeads(data);
    };
    
    fetchLeads();
  }, []);
  
  return (
    <div>
      {leads.map(lead => (
        <div key={lead.id}>
          <h3>{lead.client?.name}</h3>
          <p>Email: {lead.client?.email}</p>
          <p>Status: <span style={{color: lead.status?.color_hex}}>{lead.status?.value}</span></p>
          <p>Insurance: {lead.insurance_type?.name}</p>
        </div>
      ))}
    </div>
  );
};
```

### Working with JSON Data

When working with JSON data fields like `auto_data`, be sure to check the schema version:

```tsx
const LeadDetails = ({ lead }) => {
  const renderAutoData = () => {
    if (!lead.auto_data) return null;
    
    // Handle different schema versions
    switch (lead.auto_data_schema_version) {
      case '1.0':
        return (
          <div>
            <p>Vehicle: {lead.auto_data.year} {lead.auto_data.make} {lead.auto_data.model}</p>
            {/* Other v1.0 fields */}
          </div>
        );
      
      case '2.0':
        return (
          <div>
            <p>Vehicle: {lead.auto_data.vehicle.year} {lead.auto_data.vehicle.make} {lead.auto_data.vehicle.model}</p>
            <p>VIN: {lead.auto_data.vehicle.vin}</p>
            {/* Other v2.0 fields */}
          </div>
        );
      
      default:
        return <p>Unknown schema version: {lead.auto_data_schema_version}</p>;
    }
  };
  
  return (
    <div>
      <h2>Auto Insurance Details</h2>
      {renderAutoData()}
    </div>
  );
};
```

## AI Integration

### Using AI Interactions

```tsx
const ChatInterface = ({ leadId, clientId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  
  // Load previous messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('ai_interactions')
        .select('*')
        .or(`lead_id.eq.${leadId},client_id.eq.${clientId}`)
        .order('created_at', { ascending: true });
      
      setMessages(data || []);
    };
    
    fetchMessages();
  }, [leadId, clientId]);
  
  // Send a message
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    // Create a new interaction
    const { data } = await supabase
      .from('ai_interactions')
      .insert({
        lead_id: leadId,
        client_id: clientId,
        type: 'Chat',
        source: 'Agent UI',
        content: input,
        // Other fields will be filled by backend
      })
      .select();
    
    if (data) {
      setMessages([...messages, data[0]]);
      setInput('');
    }
  };
  
  return (
    <div>
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className={msg.ai_response ? 'ai-message' : 'user-message'}>
            {msg.content || msg.ai_response}
          </div>
        ))}
      </div>
      
      <div className="input-area">
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};
```

## Support Tickets

### Creating a Support Ticket

```tsx
const SupportTicketForm = ({ clientId, leadId }) => {
  const [ticket, setTicket] = useState({
    issue_type: '',
    issue_description: '',
    status: 'Open'
  });
  
  const createTicket = async () => {
    await supabase
      .from('support_tickets')
      .insert({
        client_id: clientId,
        lead_id: leadId,
        created_by: supabase.auth.user().id,
        ...ticket
      });
  };
  
  return (
    <form onSubmit={createTicket}>
      <select
        value={ticket.issue_type}
        onChange={(e) => setTicket({...ticket, issue_type: e.target.value})}
      >
        <option value="">Select Issue Type</option>
        <option value="Billing">Billing</option>
        <option value="Technical">Technical</option>
        <option value="Account">Account</option>
        <option value="Other">Other</option>
      </select>
      
      <textarea
        value={ticket.issue_description}
        onChange={(e) => setTicket({...ticket, issue_description: e.target.value})}
        placeholder="Describe the issue..."
      />
      
      <button type="submit">Create Ticket</button>
    </form>
  );
};
```

## Conclusion

Adapting your frontend code to work with the normalized schema will require some changes, but the benefits are significant:

1. **Better Data Organization**: The client-lead relationship model provides a clearer structure
2. **Improved Flexibility**: Lookup tables make it easier to add new statuses, types, etc.
3. **AI Integration**: The new schema supports advanced AI features
4. **Future-Proofing**: The hybrid model with schema versioning ensures backward compatibility

If you encounter any issues during the adaptation process, refer to the TypeScript type definitions in `database.types.ts` for the complete schema structure.
