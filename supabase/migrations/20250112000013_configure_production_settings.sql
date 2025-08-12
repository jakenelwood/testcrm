-- =============================================================================
-- MIGRATION: Production Configuration
-- =============================================================================
-- Description: Configure CORS, rate limiting, and monitoring for production deployment
-- Version: 1.0.0
-- Created: 2025-01-12

-- =============================================================================
-- ENABLE pg_stat_statements FOR MONITORING
-- =============================================================================

-- Enable pg_stat_statements extension for query performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Create a function to get top slow queries (for admins only)
CREATE OR REPLACE FUNCTION public.get_slow_queries(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  query TEXT,
  calls BIGINT,
  total_time DOUBLE PRECISION,
  mean_time DOUBLE PRECISION,
  rows BIGINT
) AS $$
BEGIN
  -- Only allow admins to view query statistics
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT 
    pss.query,
    pss.calls,
    pss.total_exec_time as total_time,
    pss.mean_exec_time as mean_time,
    pss.rows
  FROM pg_stat_statements pss
  ORDER BY pss.mean_exec_time DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get database connection statistics
CREATE OR REPLACE FUNCTION public.get_db_stats()
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  -- Only allow admins to view database statistics
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  SELECT jsonb_build_object(
    'active_connections', (
      SELECT count(*) 
      FROM pg_stat_activity 
      WHERE state = 'active'
    ),
    'total_connections', (
      SELECT count(*) 
      FROM pg_stat_activity
    ),
    'database_size', (
      SELECT pg_size_pretty(pg_database_size(current_database()))
    ),
    'cache_hit_ratio', (
      SELECT round(
        (sum(blks_hit) * 100.0 / sum(blks_hit + blks_read))::numeric, 2
      )
      FROM pg_stat_database
      WHERE datname = current_database()
    )
  ) INTO stats;

  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- RATE LIMITING SETUP
-- =============================================================================

-- Create a table to track API rate limits
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  ip_address INET,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_user_endpoint ON public.api_rate_limits(user_id, endpoint, window_start);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_ip_endpoint ON public.api_rate_limits(ip_address, endpoint, window_start);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_window_start ON public.api_rate_limits(window_start);

-- Enable RLS on rate limits table
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can only see their own rate limit records
CREATE POLICY "Users can view own rate limits" ON public.api_rate_limits
  FOR SELECT USING (user_id = auth.uid());

-- RLS policy: System can insert rate limit records
CREATE POLICY "System can insert rate limits" ON public.api_rate_limits
  FOR INSERT WITH CHECK (true);

-- RLS policy: System can update rate limit records
CREATE POLICY "System can update rate limits" ON public.api_rate_limits
  FOR UPDATE USING (true);

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  endpoint_param TEXT,
  ip_address_param INET DEFAULT NULL,
  max_requests INTEGER DEFAULT 100,
  window_minutes INTEGER DEFAULT 60
)
RETURNS JSONB AS $$
DECLARE
  current_user_id UUID := auth.uid();
  window_start_time TIMESTAMP WITH TIME ZONE;
  current_count INTEGER;
  rate_limit_record RECORD;
  result JSONB;
BEGIN
  -- Calculate window start time (round to nearest window)
  window_start_time := date_trunc('hour', NOW()) + 
    (EXTRACT(MINUTE FROM NOW())::INTEGER / window_minutes) * 
    (window_minutes || ' minutes')::INTERVAL;

  -- Check existing rate limit record
  SELECT * INTO rate_limit_record
  FROM public.api_rate_limits
  WHERE (
    (current_user_id IS NOT NULL AND user_id = current_user_id) OR
    (current_user_id IS NULL AND ip_address = ip_address_param)
  )
  AND endpoint = endpoint_param
  AND window_start = window_start_time;

  IF rate_limit_record IS NOT NULL THEN
    current_count := rate_limit_record.request_count + 1;
    
    -- Update existing record
    UPDATE public.api_rate_limits
    SET request_count = current_count, updated_at = NOW()
    WHERE id = rate_limit_record.id;
  ELSE
    current_count := 1;
    
    -- Insert new record
    INSERT INTO public.api_rate_limits (
      user_id, ip_address, endpoint, request_count, window_start
    ) VALUES (
      current_user_id, ip_address_param, endpoint_param, current_count, window_start_time
    );
  END IF;

  -- Build result
  result := jsonb_build_object(
    'allowed', current_count <= max_requests,
    'current_count', current_count,
    'max_requests', max_requests,
    'window_start', window_start_time,
    'reset_time', window_start_time + (window_minutes || ' minutes')::INTERVAL,
    'remaining', GREATEST(0, max_requests - current_count)
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete rate limit records older than 24 hours
  DELETE FROM public.api_rate_limits
  WHERE window_start < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- CORS CONFIGURATION HELPERS
-- =============================================================================

-- Function to validate CORS origins (for admin configuration)
CREATE OR REPLACE FUNCTION public.validate_cors_origin(origin_url TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Basic URL validation
  IF origin_url IS NULL OR origin_url = '' THEN
    RETURN FALSE;
  END IF;
  
  -- Check if it's a valid URL format
  IF origin_url !~ '^https?://[a-zA-Z0-9.-]+' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE ON public.api_rate_limits TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INET, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_slow_queries(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_db_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limits() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_cors_origin(TEXT) TO authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON EXTENSION pg_stat_statements IS 'Query performance monitoring extension';
COMMENT ON TABLE public.api_rate_limits IS 'API rate limiting tracking table';
COMMENT ON FUNCTION public.check_rate_limit(TEXT, INET, INTEGER, INTEGER) IS 'Check and enforce API rate limits per user/IP and endpoint';
COMMENT ON FUNCTION public.get_slow_queries(INTEGER) IS 'Get slowest database queries for performance monitoring (admin only)';
COMMENT ON FUNCTION public.get_db_stats() IS 'Get database performance statistics (admin only)';
COMMENT ON FUNCTION public.cleanup_rate_limits() IS 'Clean up old rate limit records (call periodically)';
COMMENT ON FUNCTION public.validate_cors_origin(TEXT) IS 'Validate CORS origin URL format';
