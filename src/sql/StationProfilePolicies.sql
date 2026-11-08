-- Apply after station.profile_id has been populated and made NOT NULL.
-- Other permissive station policies must also be removed if present.
ALTER POLICY "Authenticated users can view all stations"
ON public.station
USING (EXISTS (
    SELECT 1 FROM public.profile
    WHERE profile.profile_id = station.profile_id
      AND profile.user_id = auth.uid()
));

ALTER POLICY "Authenticated users can insert all stations"
ON public.station
WITH CHECK (EXISTS (
    SELECT 1 FROM public.profile
    WHERE profile.profile_id = station.profile_id
      AND profile.user_id = auth.uid()
));

ALTER POLICY "Authenticated users can update all stations"
ON public.station
USING (EXISTS (
    SELECT 1 FROM public.profile
    WHERE profile.profile_id = station.profile_id
      AND profile.user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.profile
    WHERE profile.profile_id = station.profile_id
      AND profile.user_id = auth.uid()
));

ALTER POLICY "Authenticated users can delete all stations"
ON public.station
USING (EXISTS (
    SELECT 1 FROM public.profile
    WHERE profile.profile_id = station.profile_id
      AND profile.user_id = auth.uid()
));
