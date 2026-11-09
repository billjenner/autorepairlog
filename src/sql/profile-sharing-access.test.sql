-- Run in a transaction after profile-sharing-access.sql, then roll back.
DO $test$
DECLARE
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  c uuid := gen_random_uuid();
  a_email text := a::text || '@example.invalid';
  b_email text := b::text || '@example.invalid';
  c_email text := c::text || '@example.invalid';
  a_profile bigint;
  b_profile bigint;
  c_profile bigint;
  actual bigint[];
BEGIN
  INSERT INTO auth.users(id, email, email_confirmed_at)
  VALUES (a, a_email, now()), (b, b_email, now()), (c, c_email, now());
  INSERT INTO public.profile(user_id, email) VALUES (a, c_email) RETURNING profile_id INTO a_profile;
  INSERT INTO public.profile(user_id, email) VALUES (b, b_email) RETURNING profile_id INTO b_profile;
  INSERT INTO public.profile(user_id, email) VALUES (c, c_email) RETURNING profile_id INTO c_profile;

  INSERT INTO public.profile_share(profile_id, email, is_active)
  VALUES (a_profile, upper(b_email), true), (a_profile, c_email, true);

  PERFORM set_config('request.jwt.claim.sub', a::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT array_agg(profile_id ORDER BY profile_id) INTO actual FROM public.accessible_profile_ids();
  IF actual IS DISTINCT FROM ARRAY[a_profile] THEN
    RAISE EXCEPTION 'One-sided shares must not grant access';
  END IF;
  EXECUTE 'RESET ROLE';

  INSERT INTO public.profile_share(profile_id, email, is_active)
  VALUES (b_profile, ' ' || upper(a_email) || ' ', true),
         (c_profile, a_email, false);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT array_agg(profile_id ORDER BY profile_id) INTO actual FROM public.accessible_profile_ids();
  IF actual IS DISTINCT FROM (SELECT array_agg(id ORDER BY id) FROM unnest(ARRAY[a_profile, b_profile]) AS ids(id)) THEN
    RAISE EXCEPTION 'Only the reciprocal active share should grant access';
  END IF;

  PERFORM set_config('request.jwt.claim.sub', b::text, true);
  SELECT array_agg(profile_id ORDER BY profile_id) INTO actual FROM public.accessible_profile_ids();
  IF actual IS DISTINCT FROM (SELECT array_agg(id ORDER BY id) FROM unnest(ARRAY[a_profile, b_profile]) AS ids(id)) THEN
    RAISE EXCEPTION 'Reciprocal access must work in both directions';
  END IF;
  EXECUTE 'RESET ROLE';

  UPDATE public.profile_share SET is_active = false WHERE profile_id = a_profile AND lower(email) = b_email;
  SELECT array_agg(profile_id ORDER BY profile_id) INTO actual FROM public.accessible_profile_ids();
  IF actual IS DISTINCT FROM ARRAY[b_profile] THEN
    RAISE EXCEPTION 'Revoking either side must remove shared access';
  END IF;
  UPDATE public.profile_share SET is_active = true WHERE profile_id = a_profile AND lower(email) = b_email;

  UPDATE public.profile SET is_active = false WHERE profile_id = a_profile;
  SELECT array_agg(profile_id ORDER BY profile_id) INTO actual FROM public.accessible_profile_ids();
  IF actual IS DISTINCT FROM ARRAY[b_profile] THEN
    RAISE EXCEPTION 'Inactive shared profiles must not grant access';
  END IF;
  UPDATE public.profile SET is_active = true WHERE profile_id = a_profile;

  UPDATE auth.users SET email_confirmed_at = NULL WHERE id = a;
  SELECT array_agg(profile_id ORDER BY profile_id) INTO actual FROM public.accessible_profile_ids();
  IF actual IS DISTINCT FROM ARRAY[b_profile] THEN
    RAISE EXCEPTION 'Unverified email must not grant shared access';
  END IF;

  PERFORM set_config('request.jwt.claim.sub', '', true);
  IF EXISTS (SELECT 1 FROM public.accessible_profile_ids()) THEN
    RAISE EXCEPTION 'Anonymous identity must not grant access';
  END IF;
  IF NOT has_function_privilege('authenticated', 'public.accessible_profile_ids()', 'EXECUTE')
     OR has_function_privilege('anon', 'public.accessible_profile_ids()', 'EXECUTE') THEN
    RAISE EXCEPTION 'Unexpected function permissions';
  END IF;
END
$test$;
