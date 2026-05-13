-- ============================================
-- PROART APP - SCHEMA COMPLETO DO BANCO DE DADOS
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. EXTENSÃO UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS (Tipos de status)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_status') THEN
        CREATE TYPE client_status AS ENUM ('ativo', 'recorrente', 'inadimplente', 'vip');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'budget_status') THEN
        CREATE TYPE budget_status AS ENUM ('pendente', 'aprovado', 'recusado', 'expirado');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('aguardando', 'arte', 'impressao', 'producao', 'acabamento', 'concluido', 'cancelado');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pendente', 'parcial', 'pago', 'atrasado');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority') THEN
        CREATE TYPE priority AS ENUM ('low', 'medium', 'high', 'urgent');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_preference') THEN
        CREATE TYPE contact_preference AS ENUM ('whatsapp', 'telefone', 'email');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'file_type') THEN
        CREATE TYPE file_type AS ENUM ('image', 'pdf', 'document', 'archive');
    END IF;
END $$;

-- ============================================
-- 3. TABELAS
-- ============================================

-- USUÁRIOS
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'manager')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLIENTES
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    contact_name TEXT,
    document TEXT,
    document_type TEXT CHECK (document_type IN ('cpf', 'cnpj')),
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    instagram TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    status client_status DEFAULT 'ativo',
    preferred_contact contact_preference DEFAULT 'whatsapp',
    delivery_preference BOOLEAN DEFAULT true,
    pickup_preference BOOLEAN DEFAULT false,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORÇAMENTOS
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    budget_number TEXT NOT NULL,
    status budget_status DEFAULT 'pendente',
    valid_until DATE NOT NULL,
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    internal_notes TEXT,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ITENS DO ORÇAMENTO
CREATE TABLE IF NOT EXISTS public.budget_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit TEXT DEFAULT 'und',
    unit_price DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    material TEXT,
    finish TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUTOS (Catálogo)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    unit_price DECIMAL(12,2) DEFAULT 0,
    unit TEXT DEFAULT 'und',
    category TEXT,
    materials TEXT[],
    finishes TEXT[],
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PEDIDOS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    budget_id UUID REFERENCES public.budgets(id) ON DELETE SET NULL,
    order_number TEXT NOT NULL,
    status order_status DEFAULT 'aguardando',
    priority priority DEFAULT 'medium',
    responsible TEXT,
    deadline DATE,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    amount_paid DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    internal_notes TEXT,
    production_notes TEXT,
    specifications JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ITENS DO PEDIDO
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit TEXT DEFAULT 'und',
    unit_price DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    material TEXT,
    finish TEXT,
    dimensions TEXT,
    status TEXT DEFAULT 'pendente',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAGAMENTOS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    budget_id UUID REFERENCES public.budgets(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('pix', 'dinheiro', 'transferencia', 'credito', 'debito', 'boleto', 'cheque')),
    status payment_status DEFAULT 'pendente',
    description TEXT,
    receipt_url TEXT,
    due_date DATE,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ARQUIVOS DO CLIENTE
CREATE TABLE IF NOT EXISTS public.client_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type file_type DEFAULT 'document',
    file_size INTEGER,
    category TEXT CHECK (category IN ('logo', 'arte', 'referencia', 'contrato', 'documento', 'outro')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTAS DO CLIENTE
CREATE TABLE IF NOT EXISTS public.client_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    note TEXT NOT NULL,
    note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'preference', 'complaint', 'internal', 'follow_up')),
    is_internal BOOLEAN DEFAULT false,
    follow_up_date DATE,
    follow_up_done BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TIMELINE (Registro de atividades)
CREATE TABLE IF NOT EXISTS public.timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONFIGURAÇÕES
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    company_name TEXT,
    company_document TEXT,
    company_phone TEXT,
    company_email TEXT,
    company_address TEXT,
    company_logo_url TEXT,
    budget_validity_days INTEGER DEFAULT 30,
    budget_prefix TEXT DEFAULT 'ORC',
    order_prefix TEXT DEFAULT 'PED',
    primary_color TEXT DEFAULT '#F4C95D',
    dark_color TEXT DEFAULT '#0A0A0B',
    whatsapp_number TEXT,
    whatsapp_message_template TEXT,
    email_smtp_host TEXT,
    email_smtp_port INTEGER,
    email_smtp_user TEXT,
    email_smtp_password TEXT,
    email_from TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. ÍNDICES (Para performance)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);

CREATE INDEX IF NOT EXISTS idx_budgets_client_id ON public.budgets(client_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON public.budgets(status);
CREATE INDEX IF NOT EXISTS idx_budgets_budget_number ON public.budgets(budget_number);

CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON public.budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_product_id ON public.budget_items(product_id);

CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_budget_id ON public.orders(budget_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_priority ON public.orders(priority);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_deadline ON public.orders(deadline);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_payments_client_id ON public.payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

CREATE INDEX IF NOT EXISTS idx_timeline_client_id ON public.timeline(client_id);
CREATE INDEX IF NOT EXISTS idx_timeline_order_id ON public.timeline(order_id);
CREATE INDEX IF NOT EXISTS idx_timeline_budget_id ON public.timeline(budget_id);

-- ============================================
-- 5. DESABILITAR RLS PARA DESENVOLVIMENTO
-- (Habilite em produção!)
-- ============================================

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
-- 6. DADOS INICIAIS (OPCIONAL)
-- ============================================

-- Inserir produtos de exemplo
INSERT INTO public.products (name, description, category, unit_price, unit, is_active, is_featured) VALUES
('Banner', 'Banner impresso em alta qualidade', 'Banner', 150.00, 'und', true, true),
('Adesivo', 'Adesivo recortado ou personalizado', 'Adesivo', 5.00, 'und', true, true),
('Fachada', 'Fachada completa para loja', 'Fachada', 2500.00, 'm²', true, false),
('Camiseta', 'Camiseta personalizada', 'Vestuário', 45.00, 'und', true, false),
('Cartão de Visita', 'Cartão de visita frente e verso', 'Papelaria', 0.50, 'und', true, true),
('Flyer', 'Flyer/A6 impresso', 'Papelaria', 0.80, 'und', true, false),
('Placa', 'Placa informativa', 'Placa', 80.00, 'und', true, false),
('Quadro', 'Quadro decorativo', 'Decoração', 120.00, 'und', true, false)
ON CONFLICT DO NOTHING;

-- Inserir configurações padrão
INSERT INTO public.settings (company_name, budget_validity_days, budget_prefix, order_prefix)
VALUES ('PROART', 30, 'ORC', 'PED')
ON CONFLICT DO NOTHING;

-- ============================================
-- PRONTO! Execute este SQL no Supabase
-- ============================================