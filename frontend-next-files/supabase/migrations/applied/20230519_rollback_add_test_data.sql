-- Rollback: Add test data for development and testing
BEGIN;

-- Mark migration as rolled back
UPDATE schema_versions 
SET is_active = FALSE, rolled_back_at = NOW()
WHERE version = '20230519_add_test_data';

-- Remove test support tickets
DELETE FROM support_tickets 
WHERE client_id IN ('b5f8c5e4-3c2d-4c3e-8c5e-3c2d4c3e8c5e', 'c6f9d6e5-4d3e-5d4f-9d6e-4d3e5d4f9d6e');

-- Remove test AI interactions
DELETE FROM ai_interactions 
WHERE client_id IN ('b5f8c5e4-3c2d-4c3e-8c5e-3c2d4c3e8c5e', 'a4e7b3d2-1c0b-4a9e-7b3d-1c0b4a9e7b3d', 'c6f9d6e5-4d3e-5d4f-9d6e-4d3e5d4f9d6e', 'd7e0f8g9-5e4f-6g5h-e0f8-5e4f6g5he0f8');

-- Remove test developer notes
DELETE FROM developer_notes 
WHERE title IN ('Implement Multi-Policy Discount Logic', 'Optimize Lead Assignment Algorithm');

-- Remove test invite codes
DELETE FROM invite_codes 
WHERE code IN ('AGENT2023', 'PARTNER2023');

-- Remove test discount codes
DELETE FROM discount_codes 
WHERE code IN ('WELCOME10', 'BUNDLE25', 'SUMMER2023');

-- Remove test lead notes
DELETE FROM lead_notes 
WHERE lead_id IN (SELECT id FROM leads WHERE client_id IN ('b5f8c5e4-3c2d-4c3e-8c5e-3c2d4c3e8c5e', 'a4e7b3d2-1c0b-4a9e-7b3d-1c0b4a9e7b3d', 'c6f9d6e5-4d3e-5d4f-9d6e-4d3e5d4f9d6e', 'd7e0f8g9-5e4f-6g5h-e0f8-5e4f6g5he0f8'));

-- Remove test opportunities
DELETE FROM opportunities 
WHERE lead_id IN (SELECT id FROM leads WHERE client_id IN ('b5f8c5e4-3c2d-4c3e-8c5e-3c2d4c3e8c5e', 'a4e7b3d2-1c0b-4a9e-7b3d-1c0b4a9e7b3d', 'c6f9d6e5-4d3e-5d4f-9d6e-4d3e5d4f9d6e', 'd7e0f8g9-5e4f-6g5h-e0f8-5e4f6g5he0f8'));

-- Remove test leads
DELETE FROM leads 
WHERE client_id IN ('b5f8c5e4-3c2d-4c3e-8c5e-3c2d4c3e8c5e', 'a4e7b3d2-1c0b-4a9e-7b3d-1c0b4a9e7b3d', 'c6f9d6e5-4d3e-5d4f-9d6e-4d3e5d4f9d6e', 'd7e0f8g9-5e4f-6g5h-e0f8-5e4f6g5he0f8');

-- Remove test contacts
DELETE FROM contacts 
WHERE client_id IN ('c6f9d6e5-4d3e-5d4f-9d6e-4d3e5d4f9d6e', 'd7e0f8g9-5e4f-6g5h-e0f8-5e4f6g5he0f8');

-- Remove test clients
DELETE FROM clients 
WHERE id IN ('b5f8c5e4-3c2d-4c3e-8c5e-3c2d4c3e8c5e', 'a4e7b3d2-1c0b-4a9e-7b3d-1c0b4a9e7b3d', 'c6f9d6e5-4d3e-5d4f-9d6e-4d3e5d4f9d6e', 'd7e0f8g9-5e4f-6g5h-e0f8-5e4f6g5he0f8');

-- Remove test pipeline statuses
DELETE FROM pipeline_statuses 
WHERE id BETWEEN 1 AND 11;

-- Remove test pipelines
DELETE FROM pipelines 
WHERE id IN (1, 2);

-- Remove test insurance types
DELETE FROM insurance_types 
WHERE id BETWEEN 1 AND 5;

-- Remove test users (if users table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        DELETE FROM users 
        WHERE email IN ('agent1@example.com', 'agent2@example.com', 'admin@example.com');
    END IF;
END $$;

COMMIT;
