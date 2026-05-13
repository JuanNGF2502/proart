-- ============================================
-- TEMPORARY: Disable RLS for Development
-- Remove these lines in production!
-- ============================================

-- Disable RLS on all tables for development
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- ============================================
-- IMPORTANT: In production, re-enable RLS and use proper authentication
-- ============================================

/*
-- To re-enable RLS in production, run:

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
-- etc...

-- Then create proper policies for authenticated users
*/
