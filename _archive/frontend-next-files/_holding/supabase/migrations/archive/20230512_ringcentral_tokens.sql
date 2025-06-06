-- Create RingCentral tokens table
CREATE TABLE IF NOT EXISTS ringcentral_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS ringcentral_tokens_user_id_idx ON ringcentral_tokens(user_id);

-- Add RLS policies
ALTER TABLE ringcentral_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tokens
CREATE POLICY "Users can view their own tokens" 
  ON ringcentral_tokens FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can only insert their own tokens
CREATE POLICY "Users can insert their own tokens" 
  ON ringcentral_tokens FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own tokens
CREATE POLICY "Users can update their own tokens" 
  ON ringcentral_tokens FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can only delete their own tokens
CREATE POLICY "Users can delete their own tokens" 
  ON ringcentral_tokens FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_ringcentral_tokens_updated_at
BEFORE UPDATE ON ringcentral_tokens
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
