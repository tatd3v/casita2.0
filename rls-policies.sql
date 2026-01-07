-- Enhanced RLS policies with audit logging and rate limiting
-- Based on your current rls-policies.sql with added security features

-- Step 1: Add user tracking columns to existing tables
ALTER TABLE feeding_states ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE feeding_history ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Step 2: Add indexes for RLS performance
CREATE INDEX idx_feeding_states_user_id ON feeding_states(user_id);
CREATE INDEX idx_feeding_history_user_id ON feeding_history(user_id);

-- Step 3: Create audit logging table
CREATE TABLE IF NOT EXISTS feeding_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for audit queries
CREATE INDEX idx_feeding_audit_user_created ON feeding_audit(user_id, created_at DESC);

-- Step 4: Create audit trigger function
CREATE OR REPLACE FUNCTION log_feeding_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO feeding_audit (
    table_name, 
    operation, 
    user_id, 
    record_id, 
    old_data, 
    new_data,
    ip_address,
    user_agent
  )
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    auth.uid(),
    COALESCE(NEW.id, OLD.id),
    to_jsonb(OLD),
    to_jsonb(NEW),
    inet_client_addr(),
    NULL -- User agent not available in trigger context
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create rate limiting helper function
CREATE OR REPLACE FUNCTION check_rate_limit(user_uuid UUID, table_name TEXT, interval_minutes INTEGER DEFAULT 1)
RETURNS BOOLEAN AS $$
DECLARE
  recent_changes INTEGER;
BEGIN
  -- Skip rate limiting for NULL user_id (legacy data)
  IF user_uuid IS NULL THEN
    RETURN TRUE;
  END IF;
  
  SELECT COUNT(*) INTO recent_changes
  FROM feeding_audit
  WHERE user_id = user_uuid
    AND table_name = table_name
    AND created_at > NOW() - INTERVAL '1 minute' * interval_minutes;
  
  -- Allow max 5 changes per minute for feeding_states, 10 for history
  IF table_name = 'feeding_states' THEN
    RETURN recent_changes < 5;
  ELSIF table_name = 'feeding_history' THEN
    RETURN recent_changes < 10;
  ELSE
    RETURN TRUE; -- No limit for other tables
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Enable RLS on all tables
ALTER TABLE feeding_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeding_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeding_audit ENABLE ROW LEVEL SECURITY;

-- Step 7: Drop existing policies (if they exist)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON feeding_states;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON feeding_states;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON feeding_states;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON feeding_states;

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON feeding_history;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON feeding_history;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON feeding_history;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON feeding_history;

-- Step 8: Create enhanced policies for feeding_states with rate limiting
-- Anyone authenticated can read (household sharing)
CREATE POLICY "household_read_states" ON feeding_states 
FOR SELECT TO authenticated 
USING (true);

-- Insert with rate limiting
CREATE POLICY "household_insert_states" ON feeding_states 
FOR INSERT TO authenticated 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  check_rate_limit(auth.uid(), 'feeding_states', 1)
);

-- Update with rate limiting - allow updates to NULL user_id records (legacy data) or own records
CREATE POLICY "household_update_states" ON feeding_states 
FOR UPDATE TO authenticated 
USING (
  (user_id IS NULL) OR 
  (user_id = auth.uid() AND check_rate_limit(auth.uid(), 'feeding_states', 1))
)
WITH CHECK (
  (user_id IS NULL) OR 
  (user_id = auth.uid() AND check_rate_limit(auth.uid(), 'feeding_states', 1))
);

-- Step 9: Create enhanced policies for feeding_history with rate limiting
-- Anyone authenticated can read (household sharing)
CREATE POLICY "household_read_history" ON feeding_history 
FOR SELECT TO authenticated 
USING (true);

-- Insert with rate limiting
CREATE POLICY "household_insert_history" ON feeding_history 
FOR INSERT TO authenticated 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  check_rate_limit(auth.uid(), 'feeding_history', 1)
);

-- No one can update/delete history (immutable records)
-- This prevents tampering with feeding logs

-- Step 10: Audit logging policies (users can only see their own audit entries)
CREATE POLICY "users_read_own_audit" ON feeding_audit 
FOR SELECT TO authenticated 
USING (user_id = auth.uid());

-- System can insert audit entries (trigger will handle this)
CREATE POLICY "system_insert_audit" ON feeding_audit 
FOR INSERT TO authenticated 
WITH CHECK (true);

-- Step 11: Create triggers for audit logging
DROP TRIGGER IF EXISTS feeding_states_audit_trigger ON feeding_states;
CREATE TRIGGER feeding_states_audit_trigger
  AFTER INSERT OR UPDATE ON feeding_states
  FOR EACH ROW EXECUTE FUNCTION log_feeding_changes();

DROP TRIGGER IF EXISTS feeding_history_audit_trigger ON feeding_history;
CREATE TRIGGER feeding_history_audit_trigger
  AFTER INSERT ON feeding_history
  FOR EACH ROW EXECUTE FUNCTION log_feeding_changes();

-- Step 12: Helper function to get current user info
CREATE OR REPLACE FUNCTION get_current_user_id() 
RETURNS UUID 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT auth.uid()::UUID;
$$;

-- Revoke execute from public for security
REVOKE EXECUTE ON FUNCTION get_current_user_id() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_id() TO authenticated;

-- Step 13: Function to check user's recent activity
CREATE OR REPLACE FUNCTION get_user_rate_limit_status(user_uuid UUID DEFAULT NULL)
RETURNS TABLE(
  table_name TEXT,
  changes_last_minute INTEGER,
  changes_last_hour INTEGER,
  limit_per_minute INTEGER,
  is_rate_limited BOOLEAN
) AS $$
DECLARE
  target_user UUID := COALESCE(user_uuid, auth.uid());
BEGIN
  RETURN QUERY
  SELECT 
    'feeding_states'::TEXT,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 minute'),
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour'),
    5::INTEGER,
    (COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 minute') >= 5)
  FROM feeding_audit 
  WHERE user_id = target_user AND table_name = 'feeding_states'
  
  UNION ALL
  
  SELECT 
    'feeding_history'::TEXT,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 minute'),
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour'),
    10::INTEGER,
    (COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 minute') >= 10)
  FROM feeding_audit 
  WHERE user_id = target_user AND table_name = 'feeding_history';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 14: Update existing records to have user_id (run once)
-- For existing records without user context, we'll set user_id to NULL first
-- Then make it nullable so existing records don't break
UPDATE feeding_states SET user_id = NULL WHERE user_id IS NULL;
UPDATE feeding_history SET user_id = NULL WHERE user_id IS NULL;

-- Step 15: Make user_id nullable for now (can be made NOT NULL later after all records have users)
-- ALTER TABLE feeding_states ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE feeding_history ALTER COLUMN user_id SET NOT NULL;
