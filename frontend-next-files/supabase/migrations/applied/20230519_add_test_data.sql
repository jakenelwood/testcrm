-- Migration: Add test data for development and testing
BEGIN;

-- Record this migration
INSERT INTO schema_versions (version, description)
VALUES ('20230519_add_test_data', 'Add test data for development and testing');

-- Add test users (if auth.users table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Add test users
        INSERT INTO users (id, email, full_name, avatar_url, role)
        VALUES 
            (uuid_generate_v4(), 'agent1@example.com', 'Alex Agent', 'https://i.pravatar.cc/150?u=agent1', 'agent'),
            (uuid_generate_v4(), 'agent2@example.com', 'Bailey Agent', 'https://i.pravatar.cc/150?u=agent2', 'agent'),
            (uuid_generate_v4(), 'admin@example.com', 'Admin User', 'https://i.pravatar.cc/150?u=admin', 'admin')
        ON CONFLICT (email) DO NOTHING;
    END IF;
END $$;

-- Add test insurance types
INSERT INTO insurance_types (id, name, is_personal, is_commercial, description, icon_name)
VALUES 
    (1, 'Auto', TRUE, FALSE, 'Personal auto insurance', 'car'),
    (2, 'Home', TRUE, FALSE, 'Home and property insurance', 'home'),
    (3, 'Life', TRUE, FALSE, 'Life insurance policies', 'heart'),
    (4, 'Commercial', FALSE, TRUE, 'Business insurance', 'building'),
    (5, 'Specialty', TRUE, TRUE, 'Specialty items insurance', 'star')
ON CONFLICT (id) DO NOTHING;

-- Add form schemas to insurance types
UPDATE insurance_types 
SET form_schema = '{"type":"object","properties":{"vehicles":[{"type":"object","properties":{"year":{"type":"integer"},"make":{"type":"string"},"model":{"type":"string"},"vin":{"type":"string"}}}]}}'
WHERE name = 'Auto' AND form_schema IS NULL;

UPDATE insurance_types 
SET form_schema = '{"type":"object","properties":{"address":{"type":"string"},"year_built":{"type":"integer"},"square_feet":{"type":"integer"},"construction_type":{"type":"string"}}}'
WHERE name = 'Home' AND form_schema IS NULL;

-- Add test pipelines
INSERT INTO pipelines (id, name, description, is_default, display_order)
VALUES 
    (1, 'Sales Pipeline', 'Standard sales process for insurance leads', TRUE, 1),
    (2, 'Renewal Pipeline', 'Process for handling policy renewals', FALSE, 2)
ON CONFLICT (id) DO NOTHING;

-- Add test pipeline statuses
INSERT INTO pipeline_statuses (id, pipeline_id, name, description, is_final, display_order, color_hex, icon_name)
VALUES 
    (1, 1, 'New Lead', 'Initial contact or inquiry', FALSE, 1, '#3498db', 'star'),
    (2, 1, 'Contacted', 'Initial outreach completed', FALSE, 2, '#2ecc71', 'phone'),
    (3, 1, 'Needs Analysis', 'Gathering requirements', FALSE, 3, '#f1c40f', 'clipboard'),
    (4, 1, 'Quoted', 'Quote provided to client', FALSE, 4, '#e67e22', 'document'),
    (5, 1, 'Negotiation', 'Discussing terms and options', FALSE, 5, '#9b59b6', 'comments'),
    (6, 1, 'Closed Won', 'Policy issued', TRUE, 6, '#2ecc71', 'check'),
    (7, 1, 'Closed Lost', 'Opportunity lost', TRUE, 7, '#e74c3c', 'times'),
    
    (8, 2, 'Due for Renewal', 'Policy approaching renewal date', FALSE, 1, '#3498db', 'clock'),
    (9, 2, 'Renewal Offered', 'Renewal terms provided', FALSE, 2, '#f1c40f', 'envelope'),
    (10, 2, 'Renewed', 'Policy successfully renewed', TRUE, 3, '#2ecc71', 'check'),
    (11, 2, 'Lost Renewal', 'Client did not renew', TRUE, 4, '#e74c3c', 'times')
ON CONFLICT (id) DO NOTHING;

-- Add test B2C clients (individuals)
INSERT INTO clients (
    id, client_type, name, email, phone_number, 
    date_of_birth, gender, marital_status, 
    ai_summary, metadata, tags
)
VALUES 
    (
        'b5f8c5e4-3c2d-4c3e-8c5e-3c2d4c3e8c5e', 
        'Individual', 
        'John Smith', 
        'john.smith@example.com', 
        '555-123-4567', 
        '1985-06-15', 
        'Male', 
        'Married', 
        'Long-term client with multiple policies. Prefers email communication.',
        '{"occupation": "Software Engineer", "income_range": "$100k-$150k", "hobbies": ["golf", "hiking"]}',
        ARRAY['VIP', 'Multi-Policy']
    ),
    (
        'a4e7b3d2-1c0b-4a9e-7b3d-1c0b4a9e7b3d', 
        'Individual', 
        'Sarah Johnson', 
        'sarah.johnson@example.com', 
        '555-987-6543', 
        '1990-03-22', 
        'Female', 
        'Single', 
        'New client, interested in bundling home and auto.',
        '{"occupation": "Marketing Manager", "income_range": "$75k-$100k", "hobbies": ["yoga", "travel"]}',
        ARRAY['New Client', 'Bundle Opportunity']
    )
ON CONFLICT (id) DO NOTHING;

-- Add test B2B clients (businesses)
INSERT INTO clients (
    id, client_type, name, email, phone_number, 
    business_type, industry, tax_id, year_established, annual_revenue, number_of_employees,
    ai_summary, metadata, tags
)
VALUES 
    (
        'c6f9d6e5-4d3e-5d4f-9d6e-4d3e5d4f9d6e', 
        'Business', 
        'Acme Corporation', 
        'info@acmecorp.example', 
        '555-555-5555', 
        'Corporation', 
        'Manufacturing', 
        '12-3456789', 
        '1995', 
        5000000.00, 
        75,
        'Growing manufacturing business with multiple locations. Looking to expand coverage.',
        '{"locations": 3, "risk_assessment": "Medium", "growth_rate": "15% annually"}',
        ARRAY['Key Account', 'Growth Potential']
    ),
    (
        'd7e0f8g9-5e4f-6g5h-e0f8-5e4f6g5he0f8', 
        'Business', 
        'TechStart Inc.', 
        'contact@techstart.example', 
        '555-444-3333', 
        'Startup', 
        'Technology', 
        '98-7654321', 
        '2020', 
        750000.00, 
        12,
        'Tech startup with rapid growth. Needs flexible coverage options.',
        '{"locations": 1, "risk_assessment": "Low", "funding_round": "Series A"}',
        ARRAY['Startup', 'Tech Sector']
    )
ON CONFLICT (id) DO NOTHING;

-- Add test contacts for business clients
INSERT INTO contacts (
    id, client_id, first_name, last_name, title, email, phone_number, is_primary_contact,
    department, preferred_contact_method
)
VALUES 
    (
        uuid_generate_v4(),
        'c6f9d6e5-4d3e-5d4f-9d6e-4d3e5d4f9d6e',
        'Robert', 
        'Williams', 
        'CFO', 
        'robert.williams@acmecorp.example', 
        '555-555-5501', 
        TRUE,
        'Finance',
        'Email'
    ),
    (
        uuid_generate_v4(),
        'c6f9d6e5-4d3e-5d4f-9d6e-4d3e5d4f9d6e',
        'Jennifer', 
        'Davis', 
        'HR Director', 
        'jennifer.davis@acmecorp.example', 
        '555-555-5502', 
        FALSE,
        'Human Resources',
        'Phone'
    ),
    (
        uuid_generate_v4(),
        'd7e0f8g9-5e4f-6g5h-e0f8-5e4f6g5he0f8',
        'Michael', 
        'Chen', 
        'CEO', 
        'michael.chen@techstart.example', 
        '555-444-3301', 
        TRUE,
        'Executive',
        'Email'
    )
ON CONFLICT DO NOTHING;

-- Add test leads
INSERT INTO leads (
    id, client_id, status_id, assigned_to, notes, insurance_type,
    current_carrier, premium, auto_data, home_data
)
VALUES 
    (
        uuid_generate_v4(),
        'b5f8c5e4-3c2d-4c3e-8c5e-3c2d4c3e8c5e',
        3, -- Needs Analysis
        'agent1@example.com',
        'Client is interested in bundling home and auto for better rates.',
        'Auto',
        'Previous Insurance Co',
        1250.00,
        '{"vehicles": [{"year": 2020, "make": "Toyota", "model": "Camry", "vin": "1HGCM82633A123456"}], "drivers": [{"name": "John Smith", "license": "S12345678", "years_licensed": 15}]}',
        NULL
    ),
    (
        uuid_generate_v4(),
        'a4e7b3d2-1c0b-4a9e-7b3d-1c0b4a9e7b3d',
        2, -- Contacted
        'agent2@example.com',
        'New homeowner looking for comprehensive coverage.',
        'Home',
        'None',
        NULL,
        NULL,
        '{"address": "123 Main St, Anytown, USA", "year_built": 2015, "square_feet": 2200, "construction_type": "Frame", "roof_type": "Asphalt Shingle"}'
    ),
    (
        uuid_generate_v4(),
        'c6f9d6e5-4d3e-5d4f-9d6e-4d3e5d4f9d6e',
        4, -- Quoted
        'agent1@example.com',
        'Business is expanding and needs additional liability coverage.',
        'Commercial',
        'Business Insurance Inc',
        8500.00,
        NULL,
        NULL
    )
ON CONFLICT DO NOTHING;

-- Add test opportunities
INSERT INTO opportunities (
    id, lead_id, name, stage, amount, probability, expected_close_date
)
SELECT 
    uuid_generate_v4(),
    id,
    CASE 
        WHEN insurance_type = 'Auto' THEN 'Auto Insurance Bundle'
        WHEN insurance_type = 'Home' THEN 'Homeowners Policy'
        WHEN insurance_type = 'Commercial' THEN 'Business Liability Package'
        ELSE 'Insurance Policy'
    END,
    CASE 
        WHEN status_id = 2 THEN 'Prospecting'
        WHEN status_id = 3 THEN 'Qualification'
        WHEN status_id = 4 THEN 'Proposal'
        ELSE 'Negotiation'
    END,
    CASE 
        WHEN insurance_type = 'Auto' THEN 1250.00
        WHEN insurance_type = 'Home' THEN 950.00
        WHEN insurance_type = 'Commercial' THEN 8500.00
        ELSE 1000.00
    END,
    CASE 
        WHEN status_id = 2 THEN 20
        WHEN status_id = 3 THEN 50
        WHEN status_id = 4 THEN 70
        ELSE 30
    END,
    CURRENT_DATE + INTERVAL '30 days'
FROM leads
WHERE status_id BETWEEN 2 AND 5
ON CONFLICT DO NOTHING;

-- Add test lead notes
INSERT INTO lead_notes (
    id, lead_id, note_content, created_by, note_type, is_pinned,
    ai_summary
)
SELECT 
    uuid_generate_v4(),
    id,
    CASE 
        WHEN insurance_type = 'Auto' THEN 'Client has a clean driving record and qualifies for safe driver discount.'
        WHEN insurance_type = 'Home' THEN 'Property is in excellent condition with updated electrical and plumbing.'
        WHEN insurance_type = 'Commercial' THEN 'Business has multiple locations and needs comprehensive coverage.'
        ELSE 'Initial consultation completed. Client has specific coverage requirements.'
    END,
    assigned_to,
    'General',
    FALSE,
    CASE 
        WHEN insurance_type = 'Auto' THEN 'Safe driver with discount opportunity'
        WHEN insurance_type = 'Home' THEN 'Well-maintained property with low risk'
        WHEN insurance_type = 'Commercial' THEN 'Multi-location business with complex needs'
        ELSE 'Standard client with specific requirements'
    END
FROM leads
ON CONFLICT DO NOTHING;

-- Add test discount codes
INSERT INTO discount_codes (
    id, code, discount_percent, max_uses, current_uses, expires_at, is_active,
    description, discount_type
)
VALUES 
    (
        uuid_generate_v4(),
        'WELCOME10',
        10,
        100,
        0,
        CURRENT_DATE + INTERVAL '90 days',
        TRUE,
        'Welcome discount for new clients',
        'Percentage'
    ),
    (
        uuid_generate_v4(),
        'BUNDLE25',
        25,
        50,
        0,
        CURRENT_DATE + INTERVAL '60 days',
        TRUE,
        'Bundle discount for multiple policies',
        'Percentage'
    ),
    (
        uuid_generate_v4(),
        'SUMMER2023',
        15,
        200,
        0,
        '2023-09-01',
        TRUE,
        'Summer promotion',
        'Percentage'
    )
ON CONFLICT DO NOTHING;

-- Add test invite codes
INSERT INTO invite_codes (
    id, code, description, max_uses, current_uses, expires_at, is_active
)
VALUES 
    (
        uuid_generate_v4(),
        'AGENT2023',
        'Invitation code for new agents',
        10,
        0,
        CURRENT_DATE + INTERVAL '180 days',
        TRUE
    ),
    (
        uuid_generate_v4(),
        'PARTNER2023',
        'Invitation code for business partners',
        5,
        0,
        CURRENT_DATE + INTERVAL '90 days',
        TRUE
    )
ON CONFLICT DO NOTHING;

-- Add test AI interactions
INSERT INTO ai_interactions (
    id, lead_id, client_id, type, source, content, ai_response, summary, model_used
)
SELECT 
    uuid_generate_v4(),
    id,
    client_id,
    'Chat',
    'Agent UI',
    'What discounts is this client eligible for?',
    CASE 
        WHEN insurance_type = 'Auto' THEN 'Based on the client profile, they are eligible for: 1) Safe Driver Discount (15%), 2) Multi-Policy Discount (10% if bundled with home), 3) Loyalty Discount (5% after 1 year).'
        WHEN insurance_type = 'Home' THEN 'Based on the property details, they are eligible for: 1) New Home Discount (10%), 2) Security System Discount (5%), 3) Multi-Policy Discount (10% if bundled with auto).'
        WHEN insurance_type = 'Commercial' THEN 'Based on the business profile, they are eligible for: 1) Multi-Location Discount (15%), 2) Industry-Specific Safety Program Discount (10%), 3) Long-Term Policy Discount (5% for 3-year term).'
        ELSE 'Standard discounts include: 1) Multi-Policy Discount (10%), 2) Paperless Billing (5%), 3) Paid-in-Full Discount (7%).'
    END,
    'Discount eligibility analysis',
    'GPT-4'
FROM leads
LIMIT 3
ON CONFLICT DO NOTHING;

-- Add test support tickets
INSERT INTO support_tickets (
    id, client_id, lead_id, created_by, issue_type, issue_description,
    resolution_summary, status, assigned_to
)
VALUES 
    (
        uuid_generate_v4(),
        'b5f8c5e4-3c2d-4c3e-8c5e-3c2d4c3e8c5e',
        NULL,
        'system',
        'Billing',
        'Client reports incorrect premium amount on latest statement.',
        NULL,
        'Open',
        'agent1@example.com'
    ),
    (
        uuid_generate_v4(),
        'c6f9d6e5-4d3e-5d4f-9d6e-4d3e5d4f9d6e',
        NULL,
        'agent2@example.com',
        'Coverage',
        'Business client requesting clarification on liability limits.',
        'Explained coverage details and sent documentation. Client satisfied with explanation.',
        'Resolved',
        'agent2@example.com'
    )
ON CONFLICT DO NOTHING;

-- Add test developer notes
INSERT INTO developer_notes (
    id, title, category, tags, priority, status, summary, description
)
VALUES 
    (
        uuid_generate_v4(),
        'Implement Multi-Policy Discount Logic',
        'feature',
        ARRAY['discount', 'pricing', 'business-logic'],
        'high',
        'in-progress',
        'Create logic to automatically apply multi-policy discounts',
        'The system should detect when a client has multiple policies and automatically apply the appropriate discount percentage based on the policy types and coverage amounts.'
    ),
    (
        uuid_generate_v4(),
        'Optimize Lead Assignment Algorithm',
        'performance',
        ARRAY['leads', 'assignment', 'algorithm'],
        'medium',
        'planned',
        'Improve the algorithm that assigns leads to agents',
        'Current assignment is based on round-robin, but we should consider agent expertise, workload, and lead characteristics for better matching.'
    )
ON CONFLICT DO NOTHING;

COMMIT;
