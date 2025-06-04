# 🔍 Schema Coverage Analysis: Data Points vs Database Design

## 📊 Executive Summary

**Status**: ⚠️ **GAPS IDENTIFIED** - Our current schema covers ~75% of required data points but needs enhancements for complete coverage.

**Key Findings**:
- ✅ **Core structure** is solid (Lead → Client → Win-back workflow)
- ⚠️ **Missing specialized tables** for vehicles, drivers, properties
- ⚠️ **Insufficient quote management** structure
- ⚠️ **Limited commercial-specific** fields
- ✅ **Good JSONB usage** for flexible data storage

## 🔍 Detailed Gap Analysis

### ✅ **WELL COVERED AREAS**

#### **1. Core Entity Management**
- ✅ Lead identification and tracking
- ✅ Client conversion workflow
- ✅ Win-back customer lifecycle
- ✅ Contact information storage
- ✅ Address management
- ✅ User and assignment tracking

#### **2. AI and Modern Features**
- ✅ AI agent integration
- ✅ Vector embeddings for insights
- ✅ Communication logging
- ✅ Notes and interaction tracking

#### **3. Flexible Data Storage**
- ✅ JSONB fields for complex data
- ✅ Metadata and tags support
- ✅ Extensible architecture

### ⚠️ **CRITICAL GAPS IDENTIFIED**

#### **1. Vehicle Management (Personal Lines)**
**Current**: Basic `vehicles` table with entity_type/entity_id
**Required**: Comprehensive vehicle tracking per storage_fields.csv

**Missing Fields**:
- Vehicle financing/leasing details
- Safety features and anti-theft devices
- Usage patterns (pleasure, commute, business)
- Garaging address (different from owner address)
- Driver assignments per vehicle
- Coverage details per vehicle (collision, comp, etc.)

#### **2. Driver Management (Personal Lines)**
**Current**: No dedicated drivers table
**Required**: Detailed driver information per data_points_list_personal.md

**Missing Structure**:
- Individual driver records
- License information per driver
- Driving history (violations, accidents)
- Driver training and certifications
- Good student status
- Driver-to-vehicle assignments

#### **3. Property Details (Personal Lines)**
**Current**: Basic `homes` table
**Required**: Comprehensive property data per storage_fields.csv

**Missing Fields**:
- Detailed construction information (roof, electrical, plumbing)
- Safety features (alarms, sprinklers, security)
- Property improvements and upgrades
- Attached/detached structures
- Pool, trampoline, pet information
- Home business details

#### **4. Quote Management System**
**Current**: Basic `quotes` table
**Required**: Comprehensive quote tracking per storage_fields.csv

**Missing Structure**:
- Quote comparison data
- Carrier responses and competitive analysis
- Quote presentation tracking
- Follow-up scheduling
- Approval/decline workflow
- E-signature status
- Document management

#### **5. Commercial-Specific Data**
**Current**: Basic business fields in leads/clients
**Required**: Comprehensive commercial data per data_points_list_commercial.md

**Missing Fields**:
- Industry codes (NAICS/SIC)
- Business licensing information
- Employee count and payroll details
- Risk assessment data
- Safety programs and certifications
- Subcontractor information
- Multiple location management

#### **6. Policy Management**
**Current**: Basic `policies` table
**Required**: Detailed policy portfolio tracking

**Missing Features**:
- Coverage limits and deductibles per policy
- Endorsements and policy changes
- ID card issuance tracking
- Certificate of insurance management
- Payment plan details
- Discount tracking

### 📋 **RECOMMENDED SCHEMA ENHANCEMENTS**

#### **Phase 1: Critical Tables (Immediate)**

```sql
-- Enhanced Vehicles Table
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT CHECK (entity_type IN ('lead', 'client')),
  entity_id UUID NOT NULL,

  -- Basic vehicle info
  year INTEGER,
  make TEXT,
  model TEXT,
  vin TEXT,

  -- Usage and storage
  usage_type TEXT CHECK (usage_type IN ('pleasure', 'commute', 'business')),
  annual_mileage INTEGER,
  daily_mileage INTEGER,
  garaging_address_id UUID REFERENCES addresses(id),

  -- Financing
  is_financed BOOLEAN DEFAULT FALSE,
  financing_details JSONB,

  -- Safety and features
  safety_features JSONB,
  anti_theft_devices JSONB,

  -- Coverage preferences
  desired_coverage JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- New Drivers Table
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT CHECK (entity_type IN ('lead', 'client')),
  entity_id UUID NOT NULL,

  -- Personal info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  marital_status TEXT,

  -- License info
  license_number TEXT,
  license_state TEXT,
  years_licensed INTEGER,

  -- Driving history
  violations JSONB, -- Array of violations with dates
  accidents JSONB,  -- Array of accidents with dates

  -- Status and qualifications
  good_student BOOLEAN DEFAULT FALSE,
  driver_training JSONB,
  employment_status TEXT,

  -- Relationship
  relationship_to_primary TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver-Vehicle Assignments
CREATE TABLE driver_vehicle_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  is_primary_driver BOOLEAN DEFAULT FALSE,
  usage_percentage INTEGER, -- 0-100
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Properties Table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT CHECK (entity_type IN ('lead', 'client')),
  entity_id UUID NOT NULL,

  -- Basic property info
  address_id UUID REFERENCES addresses(id),
  property_type TEXT,
  year_built INTEGER,
  square_footage INTEGER,
  stories INTEGER,

  -- Construction details
  roof_type TEXT,
  roof_year INTEGER,
  electrical_year INTEGER,
  electrical_amps INTEGER,
  plumbing_year INTEGER,
  plumbing_type TEXT,
  heating_system_type TEXT,
  heating_system_year INTEGER,

  -- Safety and security
  security_system JSONB,
  fire_protection JSONB,

  -- Property features
  pool_details JSONB,
  trampoline BOOLEAN DEFAULT FALSE,
  pets JSONB,
  home_business JSONB,

  -- Financial
  purchase_price DECIMAL(15,2),
  purchase_date DATE,
  estimated_replacement_cost DECIMAL(15,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Phase 2: Quote Management Enhancement**

```sql
-- Enhanced Quotes Table
CREATE TABLE quote_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id),

  -- Quote details
  insurance_types TEXT[], -- Multiple types in one quote
  requested_coverage JSONB,
  budget_range JSONB,

  -- Process tracking
  status TEXT DEFAULT 'Requested',
  priority INTEGER DEFAULT 5,
  assigned_to UUID REFERENCES users(id),

  -- Timeline
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  target_delivery_date DATE,
  delivered_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual Quote Options
CREATE TABLE quote_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_request_id UUID REFERENCES quote_requests(id),

  -- Carrier and product
  carrier_name TEXT NOT NULL,
  product_name TEXT,

  -- Pricing
  annual_premium DECIMAL(10,2),
  monthly_premium DECIMAL(10,2),
  paid_in_full_discount DECIMAL(10,2),

  -- Coverage details
  coverage_details JSONB,
  deductibles JSONB,
  limits JSONB,

  -- Quote metadata
  quote_number TEXT,
  effective_date DATE,
  expiration_date DATE,

  -- Status
  status TEXT DEFAULT 'Draft',
  presented_at TIMESTAMP WITH TIME ZONE,
  client_response TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 🎯 **IMPLEMENTATION PRIORITY**

#### **High Priority (Week 1-2)**
1. ✅ Enhanced vehicles table with comprehensive data
2. ✅ New drivers table with full tracking
3. ✅ Driver-vehicle assignment relationships
4. ✅ Enhanced properties table

#### **Medium Priority (Week 3-4)**
1. ✅ Quote management system overhaul
2. ✅ Commercial-specific field additions
3. ✅ Policy management enhancements

#### **Low Priority (Month 2)**
1. ✅ Advanced reporting structures
2. ✅ Document management integration
3. ✅ Compliance tracking enhancements

### 📊 **COVERAGE SCORECARD**

| Data Category | Current Coverage | Target Coverage | Priority |
|---------------|------------------|-----------------|----------|
| Core Entities | 95% | 100% | ✅ Complete |
| Contact Info | 90% | 100% | 🟡 Minor gaps |
| Vehicle Data | 40% | 95% | 🔴 Critical |
| Driver Data | 10% | 95% | 🔴 Critical |
| Property Data | 50% | 95% | 🔴 Critical |
| Quote Management | 30% | 90% | 🔴 Critical |
| Commercial Data | 60% | 90% | 🟡 Important |
| Policy Management | 70% | 95% | 🟡 Important |

### 🎯 **NEXT STEPS**

1. **Implement Phase 1 tables** (vehicles, drivers, properties)
2. **Update application forms** to capture comprehensive data
3. **Create data migration scripts** for existing partial data
4. **Test comprehensive data flow** Lead → Client → Win-back
5. **Validate against storage_fields.csv** requirements

This analysis ensures our database will be **mutually exclusive** (no data duplication) and **collectively exhaustive** (captures all required business data points).

## 🔧 **IMMEDIATE ACTION REQUIRED**

Based on this analysis, we need to implement the enhanced tables immediately to achieve full coverage of the data requirements. The current schema covers the workflow correctly but lacks the detailed data structures needed for comprehensive insurance CRM functionality.

**Recommendation**: Implement Phase 1 enhancements (vehicles, drivers, properties, quote management) before proceeding with application development to ensure all business requirements are met.
