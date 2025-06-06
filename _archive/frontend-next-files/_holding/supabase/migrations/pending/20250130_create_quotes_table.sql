-- Migration: Create quotes table for insurance quotes
-- This table will store quote information for leads across all insurance types

BEGIN;

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads_ins_info(id) ON DELETE CASCADE,
  
  -- Quote details
  insurance_type TEXT NOT NULL CHECK (insurance_type IN ('Auto', 'Home', 'Renters', 'Specialty')),
  paid_in_full_amount DECIMAL(10, 2),
  monthly_payment_amount DECIMAL(10, 2),
  contract_term TEXT CHECK (contract_term IN ('6mo', '12mo')),
  
  -- Quote metadata
  quote_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_by TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX quotes_lead_id_idx ON quotes (lead_id);
CREATE INDEX quotes_insurance_type_idx ON quotes (insurance_type);
CREATE INDEX quotes_is_active_idx ON quotes (is_active);
CREATE INDEX quotes_quote_date_idx ON quotes (quote_date);

-- Add trigger for updated_at
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE quotes IS 'Stores insurance quotes for leads across all insurance types';
COMMENT ON COLUMN quotes.lead_id IS 'Foreign key reference to leads_ins_info table';
COMMENT ON COLUMN quotes.insurance_type IS 'Type of insurance: Auto, Home, Renters, or Specialty';
COMMENT ON COLUMN quotes.paid_in_full_amount IS 'Full payment amount for the insurance policy';
COMMENT ON COLUMN quotes.monthly_payment_amount IS 'Monthly payment amount for the insurance policy';
COMMENT ON COLUMN quotes.contract_term IS 'Contract term: 6mo or 12mo';
COMMENT ON COLUMN quotes.is_active IS 'Whether this is the current active quote for this insurance type';

-- Record this migration
INSERT INTO schema_versions (version, description)
VALUES ('20250130_create_quotes_table', 'Create quotes table for insurance quotes');

COMMIT;
