-- ============================================
-- PROART - MIGRAÇÃO COMPLETA
-- Execute no Supabase SQL Editor (uma vez)
-- ============================================

-- 1. DISABLE RLS (desenvolvimento)
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.budget_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.client_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.client_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.timeline DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.settings DISABLE ROW LEVEL SECURITY;

-- 2. Adicionar pricing_mode à tabela products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS pricing_mode TEXT DEFAULT 'manual' CHECK (pricing_mode IN ('manual', 'component_sum'));

-- 3. Criar tabela de componentes de precificação
CREATE TABLE IF NOT EXISTS public.product_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'material' CHECK (type IN ('material', 'labor', 'service', 'tax', 'other')),
    description TEXT,
    cost_price DECIMAL(12,2) DEFAULT 0,
    markup_percent DECIMAL(5,2) DEFAULT 0,
    unit_price DECIMAL(12,2) DEFAULT 0,
    unit TEXT DEFAULT 'un',
    quantity DECIMAL(10,2) DEFAULT 1,
    is_editable BOOLEAN DEFAULT true,
    is_required BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.product_components DISABLE ROW LEVEL SECURITY;

-- Conceder acesso ao anon key e authenticated (necessário para o cliente Supabase)
GRANT ALL ON public.product_components TO anon, authenticated;
GRANT ALL ON public.products TO anon, authenticated;
GRANT ALL ON public.clients TO anon, authenticated;
GRANT ALL ON public.budgets TO anon, authenticated;
GRANT ALL ON public.budget_items TO anon, authenticated;
GRANT ALL ON public.orders TO anon, authenticated;
GRANT ALL ON public.order_items TO anon, authenticated;
GRANT ALL ON public.payments TO anon, authenticated;
GRANT ALL ON public.client_files TO anon, authenticated;
GRANT ALL ON public.client_notes TO anon, authenticated;
GRANT ALL ON public.timeline TO anon, authenticated;
GRANT ALL ON public.settings TO anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_product_components_product_id ON public.product_components(product_id);

-- 4. Seeds
INSERT INTO public.products (name, description, category, unit, unit_price, is_active, is_featured, pricing_mode) VALUES
('Quadro Metalon c/ Lona', 'Quadro em metalon com lona impressa, incluso impressão, metalon, mão de obra e instalação', 'custom', 'un', 0, true, true, 'component_sum'),
('Banner Impresso', 'Banner lona 440g com ilhoses e rebatedura', 'banner', 'm', 0, true, true, 'component_sum'),
('Adesivo Recortado', 'Adesivo vinil impresso e recortado', 'sticker', 'un', 0, true, false, 'component_sum'),
('Fachada Completa', 'Fachada em ACM com letras caixa e instalação', 'facade', 'm', 0, true, true, 'component_sum'),
('Camiseta Personalizada', 'Camiseta 100% algodão com estampa DTF', 'tshirt', 'un', 0, true, false, 'component_sum')
ON CONFLICT DO NOTHING;

-- 5. Componentes: Quadro Metalon c/ Lona
INSERT INTO public.product_components (product_id, name, type, description, cost_price, markup_percent, unit_price, unit, quantity, sort_order)
SELECT p.id, 'Impressão Lona', 'service', 'Impressão digital em lona 440g', 35.00, 30, 45.50, 'm²', 1, 1
FROM public.products p WHERE p.name = 'Quadro Metalon c/ Lona' AND NOT EXISTS (
    SELECT 1 FROM public.product_components WHERE product_id = p.id AND name = 'Impressão Lona'
);

INSERT INTO public.product_components (product_id, name, type, description, cost_price, markup_percent, unit_price, unit, quantity, sort_order)
SELECT p.id, 'Metalon', 'material', 'Estrutura em tubo de aço metalon 20x20', 60.00, 40, 84.00, 'un', 1, 2
FROM public.products p WHERE p.name = 'Quadro Metalon c/ Lona' AND NOT EXISTS (
    SELECT 1 FROM public.product_components WHERE product_id = p.id AND name = 'Metalon'
);

INSERT INTO public.product_components (product_id, name, type, description, cost_price, markup_percent, unit_price, unit, quantity, sort_order)
SELECT p.id, 'Mão de Obra', 'labor', 'Mão de obra para montagem do quadro', 40.00, 50, 60.00, 'un', 1, 3
FROM public.products p WHERE p.name = 'Quadro Metalon c/ Lona' AND NOT EXISTS (
    SELECT 1 FROM public.product_components WHERE product_id = p.id AND name = 'Mão de Obra'
);

INSERT INTO public.product_components (product_id, name, type, description, cost_price, markup_percent, unit_price, unit, quantity, sort_order)
SELECT p.id, 'Instalação', 'service', 'Instalação no local solicitado pelo cliente', 50.00, 50, 75.00, 'un', 1, 4
FROM public.products p WHERE p.name = 'Quadro Metalon c/ Lona' AND NOT EXISTS (
    SELECT 1 FROM public.product_components WHERE product_id = p.id AND name = 'Instalação'
);

-- 6. Componentes: Banner Impresso
INSERT INTO public.product_components (product_id, name, type, description, cost_price, markup_percent, unit_price, unit, quantity, sort_order)
SELECT p.id, 'Impressão Lona', 'service', 'Impressão digital em lona 440g', 12.00, 40, 16.80, 'm²', 1, 1
FROM public.products p WHERE p.name = 'Banner Impresso' AND NOT EXISTS (
    SELECT 1 FROM public.product_components WHERE product_id = p.id AND name = 'Impressão Lona'
);

INSERT INTO public.product_components (product_id, name, type, description, cost_price, markup_percent, unit_price, unit, quantity, sort_order)
SELECT p.id, 'Ilhoses + Rebatedura', 'service', 'Aplicação de ilhoses e rebatedura nas bordas', 5.00, 30, 6.50, 'm²', 1, 2
FROM public.products p WHERE p.name = 'Banner Impresso' AND NOT EXISTS (
    SELECT 1 FROM public.product_components WHERE product_id = p.id AND name = 'Ilhoses + Rebatedura'
);

-- 7. Componentes: Fachada Completa
INSERT INTO public.product_components (product_id, name, type, description, cost_price, markup_percent, unit_price, unit, quantity, sort_order)
SELECT p.id, 'ACM', 'material', 'Painel ACM 4mm alumínio composto', 180.00, 35, 243.00, 'm²', 1, 1
FROM public.products p WHERE p.name = 'Fachada Completa' AND NOT EXISTS (
    SELECT 1 FROM public.product_components WHERE product_id = p.id AND name = 'ACM'
);

INSERT INTO public.product_components (product_id, name, type, description, cost_price, markup_percent, unit_price, unit, quantity, sort_order)
SELECT p.id, 'Letras Caixa', 'material', 'Letras caixa em ACM com LED', 250.00, 40, 350.00, 'un', 1, 2
FROM public.products p WHERE p.name = 'Fachada Completa' AND NOT EXISTS (
    SELECT 1 FROM public.product_components WHERE product_id = p.id AND name = 'Letras Caixa'
);

INSERT INTO public.product_components (product_id, name, type, description, cost_price, markup_percent, unit_price, unit, quantity, sort_order)
SELECT p.id, 'Instalação Fachada', 'service', 'Instalação completa da fachada com suporte', 300.00, 40, 420.00, 'un', 1, 3
FROM public.products p WHERE p.name = 'Fachada Completa' AND NOT EXISTS (
    SELECT 1 FROM public.product_components WHERE product_id = p.id AND name = 'Instalação Fachada'
);

-- 8. Componentes: Camiseta Personalizada
INSERT INTO public.product_components (product_id, name, type, description, cost_price, markup_percent, unit_price, unit, quantity, sort_order)
SELECT p.id, 'Camiseta', 'material', 'Camiseta 100% algodão malha 30.1', 22.00, 30, 28.60, 'un', 1, 1
FROM public.products p WHERE p.name = 'Camiseta Personalizada' AND NOT EXISTS (
    SELECT 1 FROM public.product_components WHERE product_id = p.id AND name = 'Camiseta'
);

INSERT INTO public.product_components (product_id, name, type, description, cost_price, markup_percent, unit_price, unit, quantity, sort_order)
SELECT p.id, 'Impressão DTF', 'service', 'Impressão DTF (Direct to Film)', 15.00, 40, 21.00, 'un', 1, 2
FROM public.products p WHERE p.name = 'Camiseta Personalizada' AND NOT EXISTS (
    SELECT 1 FROM public.product_components WHERE product_id = p.id AND name = 'Impressão DTF'
);

-- 9. Atualizar unit_price dos produtos baseado na soma dos componentes
UPDATE public.products p
SET unit_price = (
    SELECT COALESCE(SUM(pc.unit_price * pc.quantity), 0)
    FROM public.product_components pc
    WHERE pc.product_id = p.id
)
WHERE p.pricing_mode = 'component_sum'
  AND EXISTS (SELECT 1 FROM public.product_components WHERE product_id = p.id);
