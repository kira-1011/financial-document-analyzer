-- ============================================
-- RPC Function: execute_document_query
-- ============================================
-- Safely executes SELECT queries on documents table
-- Used by AI agent for text-to-SQL document search
-- Returns results as JSONB array
-- ============================================

CREATE OR REPLACE FUNCTION execute_document_query(query_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs with function owner's permissions
SET search_path = public  -- Security best practice
AS $$
DECLARE
  result jsonb;
  clean_query text;
BEGIN
  -- Trim whitespace
  clean_query := trim(query_text);
  
  -- Validate: Must start with SELECT
  IF NOT (lower(clean_query) LIKE 'select%') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;
  
  -- Validate: Must not contain dangerous keywords
  IF lower(clean_query) ~ '\b(delete|update|insert|drop|alter|truncate|create|grant|revoke|exec|execute)\b' THEN
    RAISE EXCEPTION 'Query contains forbidden keywords';
  END IF;
  
  -- Validate: Must reference documents table
  IF NOT (lower(clean_query) LIKE '%documents%') THEN
    RAISE EXCEPTION 'Query must reference the documents table';
  END IF;
  
  -- Execute query and aggregate results as JSONB array
  EXECUTE format(
    'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (%s) t',
    clean_query
  ) INTO result;
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise the exception with context
    RAISE EXCEPTION 'Query execution failed: %', SQLERRM;
END;
$$;

-- ============================================
-- Security: Restrict access to service_role only
-- ============================================
-- Revoke from public (anonymous users)
REVOKE ALL ON FUNCTION execute_document_query(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION execute_document_query(text) FROM anon;
REVOKE ALL ON FUNCTION execute_document_query(text) FROM authenticated;

-- Grant only to service_role (backend server)
GRANT EXECUTE ON FUNCTION execute_document_query(text) TO service_role;

-- ============================================
-- Documentation
-- ============================================
COMMENT ON FUNCTION execute_document_query(text) IS 
'Safely executes SELECT queries on documents table. 
Only callable by service_role (backend).
Used by AI agent for text-to-SQL document search.

Validations:
- Must be SELECT query
- Cannot contain DELETE, UPDATE, INSERT, DROP, ALTER, etc.
- Must reference documents table

Returns: JSONB array of matching documents';

