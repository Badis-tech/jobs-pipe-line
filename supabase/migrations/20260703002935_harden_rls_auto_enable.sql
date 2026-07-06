-- rls_auto_enable() is an event-trigger helper (SECURITY DEFINER). It must
-- not be callable via the Data API, so drop the default PUBLIC execute grant.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
