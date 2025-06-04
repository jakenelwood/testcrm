# Comprehensive Commercial Insurance CRM Data Points

## **LEAD ENTITY (Pre-Purchase)**

### **Lead Identification & Source**
- Lead ID (unique identifier)
- Lead source (referral, website, cold call, trade show, broker, etc.)
- Source sub-category (specific website, referral name, event name)
- Lead score/grade
- Date lead created
- Lead status (new, contacted, qualified, proposal sent, negotiating, lost, converted)
- Assigned agent/producer
- Lead temperature (hot, warm, cold)

### **Business Information**
- Business legal name
- DBA (Doing Business As) name
- Federal Tax ID/EIN
- Business type (LLC, Corp, Partnership, Sole Proprietorship)
- Industry code (NAICS/SIC)
- Industry description
- Years in business
- Annual revenue
- Number of employees (FTE and part-time)
- Business description/operations
- Website URL
- Business license numbers

### **Contact Information**
- Primary contact name
- Primary contact title/role
- Primary contact email
- Primary contact phone (office)
- Primary contact phone (mobile)
- Secondary contact information
- Decision maker name (if different)
- Decision maker contact info

### **Location Information**
- Business address (street, city, state, ZIP)
- Mailing address (if different)
- Property owned vs. leased
- Multiple locations (Y/N)
- Additional location details

### **Current Insurance Information**
- Current carrier(s)
- Current agent/broker
- Policy renewal dates
- Current premium amounts
- Current coverage types
- Coverage limits
- Deductibles
- Claims history (3-5 years)
- Reason for shopping/switching
- Satisfaction level with current coverage

### **Coverage Needs Assessment**
- Requested coverage types:
  - General Liability
  - Professional Liability
  - Property Insurance
  - Workers' Compensation
  - Commercial Auto
  - Cyber Liability
  - Directors & Officers
  - Employment Practices Liability
  - Commercial Umbrella
  - Other specialty coverages
- Desired coverage limits
- Preferred deductibles
- Budget constraints
- Risk tolerance level
- Compliance requirements

### **Risk Assessment Data**
- Safety programs in place
- Training procedures
- Equipment age and condition
- Security measures
- Previous losses/claims
- Risk management practices
- Certifications held
- Subcontractor usage

### **Sales Process Tracking**
- First contact date
- Last contact date
- Next follow-up date
- Number of touchpoints
- Meeting dates and notes
- Email interactions
- Proposal dates
- Quote numbers and amounts
- Competitive quotes
- Objections raised
- Proposal status
- Estimated close date
- Probability of closing

### **Communication Log**
- All interaction dates and types
- Call notes
- Email correspondence
- Meeting summaries
- Document exchanges
- Proposal presentations

---

## **CLIENT ENTITY (Post-Purchase)**

### **Account Management**
- Client ID (unique identifier)
- Conversion date (lead to client)
- Account manager/producer assigned
- Account status (active, suspended, cancelled, non-renewed)
- Client tier/category
- Relationship start date
- Account value (total premium)
- Profitability metrics
- Cross-sell opportunities

### **Policy Portfolio**
**For each policy:**
- Policy number
- Coverage type
- Carrier name
- Policy effective date
- Policy expiration date
- Premium amount
- Payment frequency
- Coverage limits
- Deductibles
- Policy documents
- Certificate requests
- Endorsements/changes

### **Billing & Payments**
- Payment method
- Billing contact
- Billing address
- Payment schedule
- Outstanding balances
- Payment history
- Commission tracking
- Financing arrangements

### **Claims Management**
- Claim numbers
- Date of loss
- Claim status
- Reserve amounts
- Settlement amounts
- Adjuster information
- Claim notes
- Impact on renewals

### **Renewal Management**
- Renewal timeline
- Marketing dates
- Carrier renewal terms
- Rate changes
- Coverage modifications
- Competitive market checks
- Client renewal meetings
- Renewal outcome

### **Service Requests**
- Certificate of insurance requests
- Policy change requests
- Additional insured requests
- Coverage questions
- Service ticket numbers
- Resolution dates
- Service quality ratings

### **Client Communications**
- Regular review meetings
- Policy updates
- Industry updates shared
- Risk management consultations
- Training provided
- Newsletter subscriptions
- Communication preferences

### **Financial Metrics**
- Annual premium volume
- Premium growth/decline
- Retention rate
- Commission earned
- Account profitability
- Cross-sell success
- Upsell opportunities

### **Compliance & Documentation**
- Required filings
- State requirements
- Audit schedules
- Compliance certificates
- Document repository
- E&O considerations

---

## **DATA MIGRATION RULES**

### **Data That Moves from Lead to Client:**
- All business information
- All contact information
- All location information
- Final risk assessment data
- Winning quote/proposal details
- Communication history
- Source attribution (for ROI tracking)

### **Data That Stays with Lead Record:**
- Lead-specific tracking (conversion metrics)
- Competitive quotes not selected
- Lead process timestamps
- Lead scoring history
- Lost opportunity analysis (if applicable)

### **New Client-Only Data:**
- Policy details
- Billing information
- Claims history going forward
- Service request tracking
- Renewal management
- Account performance metrics