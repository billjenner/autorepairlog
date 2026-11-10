-- Deploy with profile-sharing-access.sql and the matching application.
-- Existing policies on these tables are replaced because permissive policies combine with OR.
-- Execute in a single database session; tools that split statements cannot guarantee atomicity.
BEGIN;

DO $$
DECLARE policy_row record;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profile', 'auto', 'mileage', 'fuel_log', 'schedule',
                        'service', 'service_order', 'service_log')
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I',
                   policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.role() = 'authenticated' AND NOT public.is_admin() THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.user_id IS DISTINCT FROM auth.uid() OR NEW.admin_level <> 0 OR NOT NEW.is_active THEN
        RAISE EXCEPTION 'Cannot create a privileged profile';
      END IF;
    ELSIF NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.admin_level IS DISTINCT FROM OLD.admin_level
       OR NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      RAISE EXCEPTION 'Cannot change profile privileges';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS protect_profile_privileges ON public.profile;
CREATE TRIGGER protect_profile_privileges BEFORE INSERT OR UPDATE ON public.profile
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileges();

CREATE POLICY profile_select ON public.profile FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY profile_insert ON public.profile FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY profile_update ON public.profile FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY profile_delete ON public.profile FOR DELETE TO authenticated
USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.can_edit_shared_auto(target_auto_id bigint)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.auto a
    WHERE a.auto_id = target_auto_id
      AND (public.is_admin()
           OR (NOT a."isTemplate" AND a.profile_id IN (SELECT profile_id FROM public.accessible_profile_ids())))
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_shared_auto(target_auto_id bigint)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.auto a
    WHERE a.auto_id = target_auto_id
      AND (a."isTemplate" OR public.is_admin()
           OR a.profile_id IN (SELECT profile_id FROM public.accessible_profile_ids()))
  );
$$;

REVOKE ALL ON FUNCTION public.can_edit_shared_auto(bigint), public.can_view_shared_auto(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_edit_shared_auto(bigint), public.can_view_shared_auto(bigint) TO authenticated;

CREATE POLICY auto_select ON public.auto FOR SELECT TO authenticated
USING ("isTemplate" OR public.is_admin()
       OR profile_id IN (SELECT profile_id FROM public.accessible_profile_ids()));
CREATE POLICY auto_insert ON public.auto FOR INSERT TO authenticated
WITH CHECK (public.is_admin() OR (NOT "isTemplate"
            AND profile_id IN (SELECT profile_id FROM public.accessible_profile_ids())));
CREATE POLICY auto_update ON public.auto FOR UPDATE TO authenticated
USING (public.can_edit_shared_auto(auto_id))
WITH CHECK (public.is_admin() OR (NOT "isTemplate"
            AND profile_id IN (SELECT profile_id FROM public.accessible_profile_ids())));
CREATE POLICY auto_delete ON public.auto FOR DELETE TO authenticated
USING (public.can_edit_shared_auto(auto_id));

CREATE OR REPLACE FUNCTION public.protect_auto_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.role() = 'authenticated' AND NOT public.is_admin()
     AND NEW.profile_id IS DISTINCT FROM OLD.profile_id THEN
    RAISE EXCEPTION 'Cannot change the owner of an auto';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS protect_auto_owner ON public.auto;
CREATE TRIGGER protect_auto_owner BEFORE UPDATE ON public.auto
FOR EACH ROW EXECUTE FUNCTION public.protect_auto_owner();

CREATE POLICY mileage_access ON public.mileage FOR ALL TO authenticated
USING (public.can_edit_shared_auto(auto_id)) WITH CHECK (public.can_edit_shared_auto(auto_id));
CREATE POLICY fuel_access ON public.fuel_log FOR ALL TO authenticated
USING (public.can_edit_shared_auto(auto_id)) WITH CHECK (public.can_edit_shared_auto(auto_id));
CREATE POLICY schedule_select ON public.schedule FOR SELECT TO authenticated
USING (public.can_view_shared_auto(auto_id));
CREATE POLICY schedule_insert ON public.schedule FOR INSERT TO authenticated
WITH CHECK (public.can_edit_shared_auto(auto_id));
CREATE POLICY schedule_update ON public.schedule FOR UPDATE TO authenticated
USING (public.can_edit_shared_auto(auto_id)) WITH CHECK (public.can_edit_shared_auto(auto_id));
CREATE POLICY schedule_delete ON public.schedule FOR DELETE TO authenticated
USING (public.can_edit_shared_auto(auto_id));

CREATE POLICY service_select ON public.service FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.schedule s WHERE s.schedule_id = service.schedule_id
               AND public.can_view_shared_auto(s.auto_id)));
CREATE POLICY service_insert ON public.service FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.schedule s WHERE s.schedule_id = service.schedule_id
                    AND public.can_edit_shared_auto(s.auto_id)));
CREATE POLICY service_update ON public.service FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.schedule s WHERE s.schedule_id = service.schedule_id
               AND public.can_edit_shared_auto(s.auto_id)))
WITH CHECK (EXISTS (SELECT 1 FROM public.schedule s WHERE s.schedule_id = service.schedule_id
                    AND public.can_edit_shared_auto(s.auto_id)));
CREATE POLICY service_delete ON public.service FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.schedule s WHERE s.schedule_id = service.schedule_id
               AND public.can_edit_shared_auto(s.auto_id)));

CREATE POLICY service_order_access ON public.service_order FOR ALL TO authenticated
USING (public.can_edit_shared_auto(auto_id)) WITH CHECK (public.can_edit_shared_auto(auto_id));
CREATE POLICY service_log_access ON public.service_log FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.service_order so
               WHERE so.service_order_id = service_log.service_order_id
                 AND public.can_edit_shared_auto(so.auto_id)))
WITH CHECK (EXISTS (SELECT 1 FROM public.service_order so
                    WHERE so.service_order_id = service_log.service_order_id
                      AND public.can_edit_shared_auto(so.auto_id)));

DROP POLICY IF EXISTS "Users can view their own auto photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload photos for their own autos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete photos for their own autos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view invoices for their own autos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload invoices for their own autos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete invoices for their own autos" ON storage.objects;
DROP POLICY IF EXISTS shared_auto_files ON storage.objects;

CREATE POLICY shared_auto_files ON storage.objects FOR ALL TO authenticated
USING (bucket_id IN ('auto-photos', 'service-invoices')
       AND EXISTS (SELECT 1 FROM public.auto a
                   WHERE a.profile_id::text = (storage.foldername(name))[1]
                     AND a.auto_id::text = (storage.foldername(name))[2]
                     AND public.can_edit_shared_auto(a.auto_id)))
WITH CHECK (bucket_id IN ('auto-photos', 'service-invoices')
       AND EXISTS (SELECT 1 FROM public.auto a
                   WHERE a.profile_id::text = (storage.foldername(name))[1]
                     AND a.auto_id::text = (storage.foldername(name))[2]
                     AND public.can_edit_shared_auto(a.auto_id)));

NOTIFY pgrst, 'reload schema';
COMMIT;
