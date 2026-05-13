-- ============================================
-- Add missing columns to existing tables
-- ============================================

-- Clients table - add missing columns
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS billing_address TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS billing_city TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS billing_state TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS billing_zip_code TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS delivery_city TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS delivery_state TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS delivery_zip_code TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS favorite_material TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS favorite_finish TEXT;

-- Products table - add missing columns (materials and finishes should be TEXT[])
ALTER TABLE public.products ALTER COLUMN materials TYPE TEXT[] USING materials::text[];
ALTER TABLE public.products ALTER COLUMN finishes TYPE TEXT[] USING finishes::text[];

-- Add indexes for commonly queried columns
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_whatsapp ON public.clients(whatsapp);
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON public.clients(is_active);

CREATE INDEX IF NOT EXISTS idx_orders_deadline ON public.orders(deadline);
CREATE INDEX IF NOT EXISTS idx_orders_client_id_status ON public.orders(client_id, status);

CREATE INDEX IF NOT EXISTS idx_budgets_client_id ON public.budgets(client_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON public.budgets(status);

SELECT 'Columns added successfully!' as result;