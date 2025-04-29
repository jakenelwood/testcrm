-- Check the constraint definition
SELECT pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'leads_status_check';

-- Check the enum type if it's using an enum
SELECT typname, enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE typname LIKE '%status%';

-- Check the current values in the status column
SELECT DISTINCT status FROM leads;
