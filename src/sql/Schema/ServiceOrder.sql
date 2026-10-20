CREATE TABLE public.service_order (
    service_order_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    auto_id INTEGER NOT NULL
        REFERENCES public.auto(auto_id)
        ON DELETE CASCADE,

    shop_name TEXT NOT NULL,
    mechanic_name TEXT NULL,
    name TEXT,
    service_date DATE,
    mileage_at_service INTEGER,

    parts NUMERIC(10,2) NOT NULL DEFAULT 0,
    labor NUMERIC(10,2) NOT NULL DEFAULT 0,
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