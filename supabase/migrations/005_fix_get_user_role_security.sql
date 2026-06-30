-- Fix three security advisor warnings on get_user_role():
--
-- 1. function_search_path_mutable  → pin search_path to '' and use schema-qualified names
-- 2. anon can execute SECURITY DEFINER function via REST
-- 3. authenticated can execute SECURITY DEFINER function via REST
--
-- The function is only called internally by RLS policies (which run as the
-- function owner), so revoking REST-level EXECUTE from anon/authenticated
-- does not break any application behaviour.

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- Remove REST API access — only internal (RLS / postgres) callers need this.
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM anon, authenticated;
