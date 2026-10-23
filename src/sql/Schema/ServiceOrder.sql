CREATE TABLE public.service_order (
    service_order_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    auto_id INTEGER NOT NULL
        REFERENCES public.auto(auto_id)
        ON DELETE CASCADE,

    shop_name TEXT NOT NULL,
    mechanic_name TEXT NULL,
    invoice_number TEXT,
    service_date DATE,
    mileage_at_service INTEGER,

    total_cost NUMERIC(10,2) NOT NULL DEFAULT 0,

    invoice_url TEXT,
    notes TEXT,

    is_complete BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- Updated RLS - see all records (not just my own)
-- ============================================================
-- SELECT
DROP POLICY IF EXISTS "Authenticated users can view all service orderss" ON public.service_order;

CREATE POLICY "Authenticated users can view all service orders"
ON public.service_order
FOR SELECT
TO authenticated
USING (true);

-- INSERT
DROP POLICY IF EXISTS "Authenticated users can insert all services" ON public.service_order;

CREATE POLICY "Authenticated users can insert all service orders"
ON public.service_order
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE
DROP POLICY IF EXISTS "Authenticated users can update all services" ON public.service;

CREATE POLICY "Authenticated users can update all service orders"
ON public.service_order
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- DELETE
DROP POLICY IF EXISTS "Authenticated users can delete all services" ON public.service_order;

CREATE POLICY "Authenticated users can delete all service orders"
ON public.service_order
FOR DELETE
TO authenticated
USING (true);

-- ============================================================
-- SERVICE INVOICE STORAGE Bucket (PDF or image invoices)
-- Object path: {profile_id}/{auto_id}/{uuid}.{ext}
-- service_order.invoice_url stores this object path.
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'service-invoices',
    'service-invoices',
    false,
    10485760,
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================
-- SERVICE INVOICE STORAGE POLICIES (auto owner or admin)
-- ============================================================
DROP POLICY IF EXISTS "Users can view invoices for their own autos" ON storage.objects;
CREATE POLICY "Users can view invoices for their own autos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'service-invoices'
    AND EXISTS (
        SELECT 1
        FROM public.auto a
        JOIN public.profile p ON p.profile_id = a.profile_id
        WHERE p.profile_id::text = (storage.foldername(name))[1]
          AND a.auto_id::text = (storage.foldername(name))[2]
          AND (
              p.user_id = auth.uid()
              OR EXISTS (
                  SELECT 1 FROM public.profile admin_profile
                  WHERE admin_profile.user_id = auth.uid()
                    AND admin_profile.admin_level > 0
              )
          )
    )
);

DROP POLICY IF EXISTS "Users can upload invoices for their own autos" ON storage.objects;
CREATE POLICY "Users can upload invoices for their own autos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'service-invoices'
    AND EXISTS (
        SELECT 1
        FROM public.auto a
        JOIN public.profile p ON p.profile_id = a.profile_id
        WHERE p.profile_id::text = (storage.foldername(name))[1]
          AND a.auto_id::text = (storage.foldername(name))[2]
          AND (
              p.user_id = auth.uid()
              OR EXISTS (
                  SELECT 1 FROM public.profile admin_profile
                  WHERE admin_profile.user_id = auth.uid()
                    AND admin_profile.admin_level > 0
              )
          )
    )
);

DROP POLICY IF EXISTS "Users can delete invoices for their own autos" ON storage.objects;
CREATE POLICY "Users can delete invoices for their own autos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'service-invoices'
    AND EXISTS (
        SELECT 1
        FROM public.auto a
        JOIN public.profile p ON p.profile_id = a.profile_id
        WHERE p.profile_id::text = (storage.foldername(name))[1]
          AND a.auto_id::text = (storage.foldername(name))[2]
          AND (
              p.user_id = auth.uid()
              OR EXISTS (
                  SELECT 1 FROM public.profile admin_profile
                  WHERE admin_profile.user_id = auth.uid()
                    AND admin_profile.admin_level > 0
              )
          )
    )
);

NOTIFY pgrst, 'reload schema';