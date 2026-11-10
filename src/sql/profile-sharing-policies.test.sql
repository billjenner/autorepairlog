-- Run after profile-sharing-policies.sql. The inner block rolls back its test data.
DO $test$
DECLARE
  owner_id uuid := gen_random_uuid();
  recipient_id uuid := gen_random_uuid();
  stranger_id uuid := gen_random_uuid();
  owner_email text := owner_id::text || '@example.invalid';
  recipient_email text := recipient_id::text || '@example.invalid';
  owner_profile bigint;
  recipient_profile bigint;
  stranger_profile bigint;
  owner_auto bigint;
  stranger_auto bigint;
  schedule_key bigint;
  service_key bigint;
  order_key bigint;
  n integer;
BEGIN
  BEGIN
  INSERT INTO auth.users(id, email, email_confirmed_at)
  VALUES (owner_id, owner_email, now()), (recipient_id, recipient_email, now()),
         (stranger_id, stranger_id::text || '@example.invalid', now());
  INSERT INTO public.profile(user_id) VALUES (owner_id) RETURNING profile_id INTO owner_profile;
  INSERT INTO public.profile(user_id) VALUES (recipient_id) RETURNING profile_id INTO recipient_profile;
  INSERT INTO public.profile(user_id) VALUES (stranger_id) RETURNING profile_id INTO stranger_profile;
  INSERT INTO public.profile_share(profile_id, email)
  VALUES (owner_profile, recipient_email), (recipient_profile, owner_email);
  INSERT INTO public.auto(profile_id, "isTemplate", make)
  VALUES (owner_profile, false, 'shared') RETURNING auto_id INTO owner_auto;
  INSERT INTO public.auto(profile_id, "isTemplate", make)
  VALUES (stranger_profile, false, 'private') RETURNING auto_id INTO stranger_auto;
  INSERT INTO public.schedule(auto_id) VALUES (owner_auto) RETURNING schedule_id INTO schedule_key;
  INSERT INTO public.service(schedule_id, name) VALUES (schedule_key, 'test')
  RETURNING service_id INTO service_key;
  INSERT INTO public.service_order(auto_id, shop_name) VALUES (owner_auto, 'test')
  RETURNING service_order_id INTO order_key;
  INSERT INTO public.service_log(service_id, service_order_id, service_miles, name)
  VALUES (service_key, order_key, 1, 'test');
  INSERT INTO public.mileage(auto_id, miles) VALUES (owner_auto, 1);
  INSERT INTO public.fuel_log(auto_id) VALUES (owner_auto);

  PERFORM set_config('request.jwt.claim.sub', recipient_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  IF NOT EXISTS (SELECT 1 FROM public.auto WHERE auto_id = owner_auto)
     OR EXISTS (SELECT 1 FROM public.auto WHERE auto_id = stranger_auto)
     OR NOT EXISTS (SELECT 1 FROM public.schedule WHERE schedule_id = schedule_key)
     OR NOT EXISTS (SELECT 1 FROM public.service WHERE service_id = service_key)
     OR NOT EXISTS (SELECT 1 FROM public.service_order WHERE service_order_id = order_key)
     OR NOT EXISTS (SELECT 1 FROM public.service_log WHERE service_order_id = order_key)
     OR NOT EXISTS (SELECT 1 FROM public.mileage WHERE auto_id = owner_auto)
     OR NOT EXISTS (SELECT 1 FROM public.fuel_log WHERE auto_id = owner_auto) THEN
    RAISE EXCEPTION 'Shared visibility or unrelated profile isolation failed';
  END IF;
  UPDATE public.auto SET make = 'edited' WHERE auto_id = owner_auto;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'Shared auto edit denied'; END IF;
  UPDATE public.auto SET make = 'edited' WHERE auto_id = stranger_auto;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'Unshared auto edit allowed'; END IF;
  BEGIN
    UPDATE public.profile SET admin_level = 1 WHERE profile_id = recipient_profile;
    RAISE EXCEPTION 'Privilege escalation allowed';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'Privilege escalation allowed' THEN RAISE; END IF;
  END;
  EXECUTE 'RESET ROLE';

  UPDATE public.profile_share SET is_active = false WHERE profile_id = owner_profile;
  EXECUTE 'SET LOCAL ROLE authenticated';
  IF EXISTS (SELECT 1 FROM public.auto WHERE auto_id = owner_auto)
     OR EXISTS (SELECT 1 FROM public.service WHERE service_id = service_key) THEN
    RAISE EXCEPTION 'Revoked share remains visible';
  END IF;
  EXECUTE 'RESET ROLE';
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claim.role', 'anon', true);
  EXECUTE 'SET LOCAL ROLE anon';
  IF EXISTS (SELECT 1 FROM public.mileage WHERE auto_id = owner_auto)
     OR EXISTS (SELECT 1 FROM public.fuel_log WHERE auto_id = owner_auto)
     OR EXISTS (SELECT 1 FROM public.schedule WHERE schedule_id = schedule_key)
     OR EXISTS (SELECT 1 FROM public.service WHERE service_id = service_key) THEN
    RAISE EXCEPTION 'Anonymous access allowed';
  END IF;
  EXECUTE 'RESET ROLE';
  RAISE EXCEPTION USING ERRCODE = 'Z0001', MESSAGE = 'Rollback sharing test fixtures';
  EXCEPTION WHEN SQLSTATE 'Z0001' THEN
    NULL;
  END;
END
$test$;
