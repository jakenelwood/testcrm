# CRM Data Modeling Overview (Enhanced)

## Overview
This document outlines the approach to structuring data in the CRM with a focus on scalability, query performance, DRY principles, AI integration, and flexibility for both **B2C (individual)** and **B2B (business)** clients across insurance lines.

The system is designed to optimize for:
- Clean, normalized relational data for consistent filtering and reporting
- Flexible JSON structures for variable-length nested data (e.g., additional insureds, vehicles)
- Efficient AI context injection and recall (via HiRAG and JSON summarization)
- Long-term adaptability across auto, home, umbrella, commercial, and specialty insurance
- AI-driven insights, recommendations, and automation
- Comprehensive event tracking and temporal analysis

---

## Storage Strategy

### 1. **Primary Client & Contact Fields**
**Storage**: Relational columns across `clients` and `contacts`

**Why**:
- Every quote has a single primary client (individual or business)
- Business clients may have multiple contacts stored separately
- Clean relational access for indexing, filters, AI memory injection

---

### 2. **Additional Insureds**
**Storage**: JSON array field (`additional_insureds` in `leads` table)

**Why**:
- Varies per policy (spouse, kids, roommates, employees)
- Scalable to any number
- Ideal for templating and AI summarization

**Example:**
```json
"additional_insureds": [
  {
    "name": "Jane Smith",
    "dob": "1985-06-10",
    "relation_to_primary": "Spouse",
    "license_state": "MN"
  },
  {
    "name": "Jake Smith",
    "dob": "2001-04-19",
    "relation_to_primary": "Child"
  }
]
```

---

### 3. **Vehicles (Auto Policies)**
**Storage**: JSON array field (`auto_data`)

**Why**:
- Number and details vary widely
- Designed for looping and summarization

**Example:**
```json
"vehicles": [
  {
    "year": 2021,
    "make": "Toyota",
    "model": "Camry",
    "vin": "1HGCM82633A123456",
    "driver": "Jane Smith",
    "comp": 250,
    "collision": 500
  }
]
```

---

### 4. **Property, Specialty, and Commercial Policy Data**
**Storage**: JSON fields per type (`home_data`, `specialty_data`, `commercial_data`)

**Why**:
- Avoids schema bloat for type-specific fields
- Allows independent schema evolution per insurance line

---

### 5. **Lookup Tables for Reusability**
**Tables**: `lead_statuses`, `insurance_types`, `communication_types`, `campaigns`

**Why**:
- Prevents repetition of static values across code and DB
- Easily extendable without migrations
- Enables metadata tagging (e.g., final stage, personal vs. commercial)
- Supports AI templates and prompts for each type
- Provides UI metadata (colors, icons) for consistent presentation

---

### 6. **Addresses as a Separate Table**
**Used in**: `clients`, `contacts`, `locations`

**Why**:
- Reusable
- Supports multiple location support for B2B
- Consistent geospatial and validation logic
- Enables address verification and geocoding

---

### 7. **AI Annotation Fields**
**Used in**: All major tables (`clients`, `leads`, `contacts`, etc.)

**Why**:
- Stores AI-generated insights directly in the database
- Enables filtering and sorting based on AI recommendations
- Provides consistent structure for AI-driven workflows
- Supports both real-time and batch processing of AI insights

---

### 8. **Schema Versioning for JSON Fields**
**Used in**: JSON data fields (`auto_data`, `home_data`, etc.)

**Why**:
- Tracks schema evolution over time
- Enables backward compatibility
- Supports data migration and validation
- Provides context for AI interpretation of JSON data

---

## AI Integration Benefits

### ✅ Clean Context for AI:
- Core values stored in columns for easy retrieval
- Nested arrays enable precise memory recall and summarization
- AI templates provide consistent prompting patterns

### ✅ Scalable Summarization:
- AI can walk through structured fields across types and summarize intelligently
- AI summaries stored directly in database for quick access
- Sentiment analysis and entity extraction built into the schema

### ✅ Dynamic Document Generation:
- Structured loops make it easy to use docx/pdf templates dynamically
- Schema versioning ensures template compatibility
- JSON data structures map cleanly to template variables

### ✅ Memory-Stitching Ready:
- Each data shape (e.g., `vehicles`, `additional_insureds`) aligns with HiRAG-style embeddings
- AI annotation fields provide pre-computed insights
- Temporal data (timestamps) enables time-aware AI reasoning

### ✅ AI-Driven Workflows:
- AI priority scores enable intelligent work queuing
- AI next action suggestions guide user workflows
- AI risk assessment informs business decisions

---

## Summary
This enhanced CRM schema:
- Combines relational normalization with JSON flexibility
- Supports both B2C and B2B workflows cleanly
- Respects the DRY principle by using lookup and reference tables
- Incorporates AI annotations and insights directly in the database
- Provides comprehensive temporal tracking for event-based analysis
- Includes schema versioning for JSON fields to support evolution
- Optimizes for both human and AI-driven workflows

By combining clean structure with flexibility and AI-readiness, it empowers a system that is:
- Fast and efficient for queries and reporting
- Adaptable to changing business requirements
- Intelligent with built-in AI capabilities
- Comprehensive in tracking the full customer journey
- Future-proof for emerging AI and analytics techniques

