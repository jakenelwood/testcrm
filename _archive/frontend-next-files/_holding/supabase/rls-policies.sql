-- Enable Row Level Security on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_marketing_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (for development purposes)
-- In production, you would restrict access to authenticated users

-- Leads table policies
CREATE POLICY "Allow anonymous select on leads" ON leads
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert on leads" ON leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update on leads" ON leads
  FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous delete on leads" ON leads
  FOR DELETE USING (true);

-- Lead notes table policies
CREATE POLICY "Allow anonymous select on lead_notes" ON lead_notes
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert on lead_notes" ON lead_notes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update on lead_notes" ON lead_notes
  FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous delete on lead_notes" ON lead_notes
  FOR DELETE USING (true);

-- Lead communications table policies
CREATE POLICY "Allow anonymous select on lead_communications" ON lead_communications
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert on lead_communications" ON lead_communications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update on lead_communications" ON lead_communications
  FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous delete on lead_communications" ON lead_communications
  FOR DELETE USING (true);

-- Lead marketing settings table policies
CREATE POLICY "Allow anonymous select on lead_marketing_settings" ON lead_marketing_settings
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert on lead_marketing_settings" ON lead_marketing_settings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update on lead_marketing_settings" ON lead_marketing_settings
  FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous delete on lead_marketing_settings" ON lead_marketing_settings
  FOR DELETE USING (true);
