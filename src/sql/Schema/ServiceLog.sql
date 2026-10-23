CREATE TABLE public.service_log (
    service_log_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    service_order_id INTEGER NOT NULL
        REFERENCES public.service_order(service_order_id)
        ON DELETE CASCADE,

    type CHAR(1) NOT NULL
        CHECK (type IN ('m', 's')),

    name TEXT NOT NULL,
    description TEXT,
    notes TEXT,

    parts NUMERIC(10,2) NOT NULL DEFAULT 0,
    labor NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_cost NUMERIC(10,2) NOT NULL DEFAULT 0,

    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Updated RLS - see all records (not just my own)
-- ============================================================
-- SELECT
DROP POLICY IF EXISTS "Authenticated users can view all service orderss" ON public.service_log;

CREATE POLICY "Authenticated users can view all service orders"
ON public.service_log
FOR SELECT
TO authenticated
USING (true);

-- INSERT
DROP POLICY IF EXISTS "Authenticated users can insert all services" ON public.service_log;

CREATE POLICY "Authenticated users can insert all service orders"
ON public.service_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE
DROP POLICY IF EXISTS "Authenticated users can update all services" ON public.service_log;

CREATE POLICY "Authenticated users can update all service orders"
ON public.service_log
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- DELETE
DROP POLICY IF EXISTS "Authenticated users can delete all services" ON public.service_log;

CREATE POLICY "Authenticated users can delete all service orders"
ON public.service_log
FOR DELETE
TO authenticated
USING (true);