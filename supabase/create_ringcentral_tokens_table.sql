-- Create the ringcentral_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS ringcentral_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policy for ringcentral_tokens
DROP POLICY IF EXISTS "Users can only access their own tokens" ON ringcentral_tokens;
CREATE POLICY "Users can only access their own tokens"
ON ringcentral_tokens
FOR ALL
USING (auth.uid() = user_id);

-- Enable RLS on ringcentral_tokens
ALTER TABLE ringcentral_tokens ENABLE ROW LEVEL SECURITY;

-- Grant access to the table
GRANT ALL ON ringcentral_tokens TO authenticated;
GRANT SELECT ON ringcentral_tokens TO anon;
GRANT ALL ON ringcentral_tokens TO service_role;
