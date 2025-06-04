# Comprehensive Personal Lines Insurance CRM Data Points

## **LEAD ENTITY (Pre-Purchase)**

### **Lead Identification & Source**
- Lead ID (unique identifier)
- Lead source (referral, website, social media, direct mail, TV/radio, walk-in)
- Source sub-category (specific campaign, referral name, ad source)
- Lead score/grade
- Date lead created
- Lead status (new, contacted, quoted, follow-up, lost, converted)
- Assigned agent/CSR
- Lead priority (high, medium, low)
- Marketing campaign attribution

### **Personal Information**
- First name
- Middle name
- Last name
- Date of birth
- Social Security Number
- Gender
- Marital status
- Spouse/partner name
- Spouse/partner DOB
- Number of household members
- Primary language
- Occupation
- Employer name
- Annual income range
- Education level

### **Contact Information**
- Primary phone (mobile)
- Secondary phone (home/work)
- Email address (primary)
- Email address (secondary)
- Preferred contact method
- Best time to contact
- Communication preferences (text, email, call)

### **Residence Information**
- Current address (street, city, state, ZIP)
- Previous address (if recent move)
- Residence type (single family, condo, townhome, apartment)
- Own vs. rent vs. other
- Move-in date
- Length at current address
- Mailing address (if different)

### **Current Insurance Information**
- Current auto carrier
- Current home/renters carrier
- Current agent/company
- Policy expiration dates
- Current premium amounts (auto/home)
- Current coverage levels
- Reason for shopping
- Satisfaction with current coverage
- Claims history (3-5 years)
- Continuous coverage dates
- Previous carriers
- Gaps in coverage

### **Auto Insurance Needs**
**For each vehicle:**
- Vehicle year
- Vehicle make
- Vehicle model
- VIN
- Vehicle usage (pleasure, commute, business)
- Annual mileage
- Garaging address
- Financing/leasing information
- Purchase date
- Purchase price
- Safety features
- Anti-theft devices

**For each driver:**
- Driver name
- Relationship to primary insured
- Date of birth
- Gender
- Marital status
- License number
- License state
- Years licensed
- Driving violations (3-5 years)
- Accidents (3-5 years)
- Driver training courses
- Good student status
- Employment status

### **Home/Renters Insurance Needs**
- Property address
- Property type and style
- Year built
- Square footage
- Number of stories
- Roof type and age
- Heating/cooling systems
- Electrical system age
- Plumbing system age
- Foundation type
- Construction materials
- Home improvements/upgrades
- Estimated replacement cost
- Purchase price and date
- Mortgage information
- Home security systems
- Fire protection (alarms, sprinklers)
- Swimming pool
- Trampoline
- Dog ownership (breed, bite history)
- Home business
- Valuable items (jewelry, art, collections)
- Prior losses/claims

### **Coverage Preferences**
- Desired coverage types (auto, home, renters, umbrella, etc.)
- Coverage limit preferences
- Deductible preferences
- Budget constraints
- Discount qualifications
- Bundling interest
- Payment preferences

### **Sales Process Tracking**
- First contact date
- Last contact date
- Next follow-up date
- Number of contacts
- Quote request date
- Quote numbers
- Quote amounts by coverage
- Quote expiration dates
- Competitive quotes
- Price sensitivity
- Objections raised
- Decision timeline
- Estimated close date
- Close probability

### **Communication Log**
- All interaction dates and types
- Call notes and outcomes
- Email correspondence
- Text message history
- Meeting notes
- Quote presentations
- Follow-up reminders

---

## **CLIENT ENTITY (Post-Purchase)**

### **Account Management**
- Client ID (unique identifier)
- Conversion date
- Account manager/agent assigned
- Account status (active, suspended, cancelled)
- Client since date
- Customer lifetime value
- Account tier/category
- Household total premium
- Loyalty program status
- Referral source credit

### **Policy Portfolio**
**For each policy (Auto, Home, Renters, Umbrella, etc.):**
- Policy number
- Coverage type
- Carrier name
- Policy effective date
- Policy expiration date
- Premium amount
- Payment plan
- Coverage details and limits
- Deductibles
- Discounts applied
- Policy documents
- ID cards issued
- Endorsements/changes

### **Vehicle Information (Current)**
- All vehicles on policy
- Coverage per vehicle
- Drivers assigned to vehicles
- Garaging locations
- Updates to vehicle information
- Vehicle additions/deletions
- Financing changes

### **Property Information (Current)**
- Covered properties
- Coverage amounts
- Personal property inventory
- Additional coverages
- Scheduled items
- Property improvements
- Occupancy changes

### **Billing & Payments**
- Payment method (auto-pay, manual)
- Bank account/credit card info
- Billing contact
- Billing address
- Payment schedule
- Payment history
- Late payment tracking
- NSF incidents
- Payment preference changes

### **Claims Management**
- Claim numbers
- Date of loss
- Claim type (auto, property, liability)
- Claim status
- Adjuster assigned
- Claim amount
- Deductible applied
- Settlement amount
- Rental car usage
- At-fault determination
- Impact on rates/renewals
- Claim satisfaction

### **Life Events & Updates**
- Marriage/divorce
- New drivers
- Teen driver additions
- Address changes
- Vehicle purchases/sales
- Home purchases/sales
- Job changes
- Retirement status
- Children leaving home
- Life event notifications

### **Renewal Management**
- Renewal timeline
- Rate indications
- Coverage reviews
- Competitive position
- Retention strategies
- Renewal outcome
- Non-renewal reasons
- Win-back opportunities

### **Service Interactions**
- Service request types
- ID card requests
- Coverage questions
- Policy changes
- Certificate requests
- DMV interactions
- Proof of insurance
- Service satisfaction ratings

### **Cross-Sell Opportunities**
- Products not yet purchased
- Life insurance needs
- Umbrella coverage evaluation
- Additional vehicle coverage
- Recreational vehicle insurance
- Identity theft protection
- Roadside assistance

### **Client Communications**
- Policy review meetings
- Annual check-ins
- Birthday/anniversary contact
- Holiday greetings
- Newsletter subscriptions
- Digital engagement preferences
- Social media connections

### **Financial Performance**
- Total household premium
- Premium growth over time
- Policy count
- Average premium per policy
- Retention rate
- Commission tracking
- Profitability metrics
- Cross-sell success rate

### **Compliance & Documentation**
- State filing requirements
- DMV reporting
- SR-22 requirements
- Document storage
- Electronic signature records
- Privacy preferences
- Regulatory compliance notes

---

## **DATA MIGRATION RULES**

### **Data That Moves from Lead to Client:**
- All personal information
- All contact information
- Current residence information
- Final vehicle and driver details
- Final property details
- Coverage selections
- Communication history and preferences
- Source attribution
- Risk factors and underwriting info

### **Data That Stays with Lead Record:**
- Lead-specific process metrics
- Competitive quotes not selected
- Lead scoring progression
- Sales process timestamps
- Conversion analytics
- Lost opportunity data (if applicable)

### **New Client-Only Data:**
- Active policy details
- Billing and payment information
- Claims history going forward
- Service request tracking
- Renewal management data
- Account performance metrics
- Life event updates
- Cross-sell tracking
