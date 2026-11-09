-- Deploy together with the application and the corresponding RLS policies.
-- A share is effective only when both verified accounts have active reciprocal entries.
CREATE OR REPLACE FUNCTION public.accessible_profile_ids()
RETURNS TABLE (profile_id bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH current_profile AS (
    SELECT p.profile_id, u.email, u.email_confirmed_at
    FROM public.profile AS p
    JOIN auth.users AS u ON u.id = p.user_id
    WHERE p.user_id = auth.uid()
  )
  SELECT me.profile_id
  FROM current_profile AS me
  UNION
  SELECT other.profile_id
  FROM current_profile AS me
  JOIN public.profile_share AS outgoing
    ON outgoing.profile_id = me.profile_id AND outgoing.is_active
  JOIN public.profile AS other ON other.is_active AND other.profile_id <> me.profile_id
  JOIN auth.users AS other_user ON other_user.id = other.user_id
  JOIN public.profile_share AS incoming
    ON incoming.profile_id = other.profile_id AND incoming.is_active
  WHERE me.email_confirmed_at IS NOT NULL
    AND other_user.email_confirmed_at IS NOT NULL
    AND NULLIF(pg_catalog.btrim(me.email), '') IS NOT NULL
    AND NULLIF(pg_catalog.btrim(other_user.email), '') IS NOT NULL
    AND pg_catalog.lower(pg_catalog.btrim(outgoing.email)) = pg_catalog.lower(pg_catalog.btrim(other_user.email))
    AND pg_catalog.lower(pg_catalog.btrim(incoming.email)) = pg_catalog.lower(pg_catalog.btrim(me.email))
    AND (SELECT count(*) FROM auth.users AS u
         WHERE u.email_confirmed_at IS NOT NULL
           AND pg_catalog.lower(pg_catalog.btrim(u.email)) = pg_catalog.lower(pg_catalog.btrim(me.email))) = 1
    AND (SELECT count(*) FROM auth.users AS u
         WHERE u.email_confirmed_at IS NOT NULL
           AND pg_catalog.lower(pg_catalog.btrim(u.email)) = pg_catalog.lower(pg_catalog.btrim(other_user.email))) = 1;
$$;

REVOKE ALL ON FUNCTION public.accessible_profile_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accessible_profile_ids() TO authenticated;
