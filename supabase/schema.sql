-- ============================================
-- PROART APP - SUPABASE DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE client_status AS ENUM ('ativo', 'recorrente', 'inadimplente', 'vip');
CREATE TYPE budget_status AS ENUM ('pendente', 'aprovado', 'recusado', 'expirado');
CREATE TYPE order_status AS ENUM ('aguardando', 'arte', 'impressao', 'producao', 'acabamento', 'concluido', 'cancelado');
CREATE TYPE payment_status AS ENUM ('pendente', 'parcial', 'pago', 'atrasado');
CREATE TYPE priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE contact_preference AS ENUM ('whatsapp', 'telefone', 'email');
CREATE TYPE file_type AS ENUM ('image', 'pdf', 'document', 'archive');

-- ============================================
-- USERS / AUTH
-- ============================================

CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'manager')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CLIENTS
-- ============================================

CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- Basic Info
    name TEXT NOT NULL,
    contact_name TEXT,
    document TEXT,
    document_type TEXT CHECK (document_type IN ('cpf', 'cnpj')),

    -- Contact
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    instagram TEXT,

    -- Address
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,

    -- Billing Address (separate)
    billing_address TEXT,
    billing_city TEXT,
    billing_state TEXT,
    billing_zip_code TEXT,

    -- Delivery Address (separate)
    delivery_address TEXT,
    delivery_city TEXT,
    delivery_state TEXT,
    delivery_zip_code TEXT,

    -- Status & Classification
    status client_status DEFAULT 'ativo',

    -- Preferences
    preferred_contact contact_preference DEFAULT 'whatsapp',
    delivery_preference BOOLEAN DEFAULT true,
    pickup_preference BOOLEAN DEFAULT false,
    favorite_material TEXT,
    favorite_finish TEXT,

    -- Internal
    notes TEXT,
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for clients
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_name ON public.clients(name);
CREATE INDEX idx_clients_document ON public.clients(document);

-- ============================================
-- BUDGETS
-- ============================================

CREATE TABLE public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- Budget Info
    budget_number TEXT NOT NULL,
    status budget_status DEFAULT 'pendente',

    -- Dates
    valid_until DATE NOT NULL,
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,

    -- Financial
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,

    -- Notes
    notes TEXT,
    internal_notes TEXT,

    -- PDF
    pdf_url TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for budgets
CREATE INDEX idx_budgets_client_id ON public.budgets(client_id);
CREATE INDEX idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX idx_budgets_status ON public.budgets(status);
CREATE INDEX idx_budgets_budget_number ON public.budgets(budget_number);
CREATE INDEX idx_budgets_valid_until ON public.budgets(valid_until);

-- ============================================
-- BUDGET ITEMS
-- ============================================

CREATE TABLE public.budget_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,

    -- Item Info
    name TEXT NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit TEXT DEFAULT 'und',
    unit_price DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,

    -- Product reference (optional)
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,

    -- Order (for display)
    sort_order INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for budget items
CREATE INDEX idx_budget_items_budget_id ON public.budget_items(budget_id);
CREATE INDEX idx_budget_items_product_id ON public.budget_items(product_id);

-- ============================================
-- PRODUCTS (CATALOG)
-- ============================================

CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- Basic Info
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,

    -- Pricing
    unit_price DECIMAL(12,2) DEFAULT 0,
    unit TEXT DEFAULT 'und',

    -- Category
    category TEXT,

    -- Materials & Finishes
    materials TEXT[], -- Array of available materials
    finishes TEXT[], -- Array of available finishes

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,

    -- Image
    image_url TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for products
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_products_sku ON public.products(sku);

-- ============================================
-- ORDERS
-- ============================================

CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    budget_id UUID REFERENCES public.budgets(id) ON DELETE SET NULL,

    -- Order Info
    order_number TEXT NOT NULL,
    status order_status DEFAULT 'aguardando',
    priority priority DEFAULT 'medium',

    -- Production
    responsible TEXT, -- Staff member responsible

    -- Dates
    deadline DATE,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,

    -- Financial
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    amount_paid DECIMAL(12,2) DEFAULT 0,

    -- Notes
    notes TEXT,
    internal_notes TEXT,
    production_notes TEXT,

    -- Specifications
    specifications JSONB DEFAULT '{}',

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for orders
CREATE INDEX idx_orders_client_id ON public.orders(client_id);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_priority ON public.orders(priority);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_deadline ON public.orders(deadline);

-- ============================================
-- ORDER ITEMS
-- ============================================

CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,

    -- Item Info
    name TEXT NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit TEXT DEFAULT 'und',
    unit_price DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,

    -- Product reference
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,

    -- Specifications
    material TEXT,
    finish TEXT,
    dimensions TEXT,

    -- Status per item
    status TEXT DEFAULT 'pendente',

    -- Order (for display)
    sort_order INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for order items
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);

-- ============================================
-- PAYMENTS
-- ============================================

CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    budget_id UUID REFERENCES public.budgets(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- Payment Info
    amount DECIMAL(12,2) NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('pix', 'dinheiro', 'transferencia', 'credito', 'debito', 'boleto', 'cheque')),
    status payment_status DEFAULT 'pendente',

    -- Reference
    description TEXT,
    receipt_url TEXT,

    -- Dates
    due_date DATE,
    paid_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for payments
CREATE INDEX idx_payments_client_id ON public.payments(client_id);
CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_due_date ON public.payments(due_date);

-- ============================================
-- CLIENT FILES / ASSETS
-- ============================================

CREATE TABLE public.client_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- File Info
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type file_type DEFAULT 'document',
    file_size INTEGER, -- in bytes

    -- Category
    category TEXT CHECK (category IN ('logo', 'arte', 'referencia', 'contrato', 'documento', 'outro')),

    -- Description
    description TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for client files
CREATE INDEX idx_client_files_client_id ON public.client_files(client_id);
CREATE INDEX idx_client_files_category ON public.client_files(category);

-- ============================================
-- CLIENT NOTES / CONVERSATIONS
-- ============================================

CREATE TABLE public.client_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- Note Info
    note TEXT NOT NULL,
    note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'preference', 'complaint', 'internal', 'follow_up')),

    -- Internal flag
    is_internal BOOLEAN DEFAULT false,

    -- Follow up
    follow_up_date DATE,
    follow_up_done BOOLEAN DEFAULT false,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for client notes
CREATE INDEX idx_client_notes_client_id ON public.client_notes(client_id);
CREATE INDEX idx_client_notes_note_type ON public.client_notes(note_type);
CREATE INDEX idx_client_notes_follow_up ON public.client_notes(follow_up_date) WHERE follow_up_done = false;

-- ============================================
-- TIMELINE / ACTIVITY LOG
-- ============================================

CREATE TABLE public.timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- Event Info
    event_type TEXT NOT NULL, -- 'budget_created', 'budget_approved', 'order_created', 'payment_received', 'order_finished', etc.
    title TEXT NOT NULL,
    description TEXT,

    -- Additional data
    metadata JSONB DEFAULT '{}',

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for timeline
CREATE INDEX idx_timeline_client_id ON public.timeline(client_id);
CREATE INDEX idx_timeline_order_id ON public.timeline(order_id);
CREATE INDEX idx_timeline_budget_id ON public.timeline(budget_id);
CREATE INDEX idx_timeline_created_at ON public.timeline(created_at DESC);

-- ============================================
-- SETTINGS / CONFIGURATIONS
-- ============================================

CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,

    -- Company Info
    company_name TEXT,
    company_document TEXT,
    company_phone TEXT,
    company_email TEXT,
    company_address TEXT,
    company_logo_url TEXT,

    -- Budget Settings
    budget_validity_days INTEGER DEFAULT 30,
    budget_prefix TEXT DEFAULT 'ORC',

    -- Order Settings
    order_prefix TEXT DEFAULT 'PED',

    -- Preferences
    primary_color TEXT DEFAULT '#F4C95D',
    dark_color TEXT DEFAULT '#0A0A0B',

    -- WhatsApp
    whatsapp_number TEXT,
    whatsapp_message_template TEXT,

    -- Email
    email_smtp_host TEXT,
    email_smtp_port INTEGER,
    email_smtp_user TEXT,
    email_smtp_password TEXT,
    email_from TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to generate budget number
CREATE OR REPLACE FUNCTION generate_budget_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    year_part TEXT;
    seq_num INTEGER;
BEGIN
    year_part := TO_CHAR(NOW(), 'YY');

    SELECT COALESCE(MAX(CAST(SUBSTRING(budget_number FROM 4) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM budgets
    WHERE SUBSTRING(budget_number FROM 1 FOR 2) = year_part;

    new_number := year_part || LPAD(seq_num::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    year_part TEXT;
    seq_num INTEGER;
BEGIN
    year_part := TO_CHAR(NOW(), 'YY');

    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 4) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM orders
    WHERE SUBSTRING(order_number FROM 1 FOR 2) = year_part;

    new_number := year_part || LPAD(seq_num::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto update updated_at
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_budget_items_updated_at
    BEFORE UPDATE ON budget_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_order_items_updated_at
    BEFORE UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_client_files_updated_at
    BEFORE UPDATE ON client_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_client_notes_updated_at
    BEFORE UPDATE ON client_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Users policies (users can see their own profile)
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Clients policies (all authenticated users can CRUD clients)
CREATE POLICY "Users can view all clients"
    ON public.clients FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert clients"
    ON public.clients FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update clients"
    ON public.clients FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Users can delete clients"
    ON public.clients FOR DELETE
    TO authenticated
    USING (true);

-- Budgets policies
CREATE POLICY "Users can view all budgets"
    ON public.budgets FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert budgets"
    ON public.budgets FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update budgets"
    ON public.budgets FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Users can delete budgets"
    ON public.budgets FOR DELETE
    TO authenticated
    USING (true);

-- Budget Items policies (cascade from budgets)
CREATE POLICY "Users can view all budget items"
    ON public.budget_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert budget items"
    ON public.budget_items FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update budget items"
    ON public.budget_items FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Users can delete budget items"
    ON public.budget_items FOR DELETE
    TO authenticated
    USING (true);

-- Products policies
CREATE POLICY "Users can view all products"
    ON public.products FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert products"
    ON public.products FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update products"
    ON public.products FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Users can delete products"
    ON public.products FOR DELETE
    TO authenticated
    USING (true);

-- Orders policies
CREATE POLICY "Users can view all orders"
    ON public.orders FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert orders"
    ON public.orders FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update orders"
    ON public.orders FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Users can delete orders"
    ON public.orders FOR DELETE
    TO authenticated
    USING (true);

-- Order Items policies
CREATE POLICY "Users can view all order items"
    ON public.order_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert order items"
    ON public.order_items FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update order items"
    ON public.order_items FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Users can delete order items"
    ON public.order_items FOR DELETE
    TO authenticated
    USING (true);

-- Payments policies
CREATE POLICY "Users can view all payments"
    ON public.payments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert payments"
    ON public.payments FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update payments"
    ON public.payments FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Users can delete payments"
    ON public.payments FOR DELETE
    TO authenticated
    USING (true);

-- Client Files policies
CREATE POLICY "Users can view all client files"
    ON public.client_files FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert client files"
    ON public.client_files FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update client files"
    ON public.client_files FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Users can delete client files"
    ON public.client_files FOR DELETE
    TO authenticated
    USING (true);

-- Client Notes policies
CREATE POLICY "Users can view all client notes"
    ON public.client_notes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert client notes"
    ON public.client_notes FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update client notes"
    ON public.client_notes FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Users can delete client notes"
    ON public.client_notes FOR DELETE
    TO authenticated
    USING (true);

-- Timeline policies
CREATE POLICY "Users can view all timeline"
    ON public.timeline FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert timeline"
    ON public.timeline FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Settings policies
CREATE POLICY "Users can view settings"
    ON public.settings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert settings"
    ON public.settings FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update settings"
    ON public.settings FOR UPDATE
    TO authenticated
    USING (true);

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('clients', 'clients', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('budgets', 'budgets', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

-- Storage policies
CREATE POLICY "Anyone can view client files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'clients');

CREATE POLICY "Authenticated users can upload client files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'clients');

CREATE POLICY "Authenticated users can update client files"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'clients');

CREATE POLICY "Authenticated users can delete client files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'clients');

CREATE POLICY "Anyone can view product images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'products');

CREATE POLICY "Authenticated users can upload product images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'products');

CREATE POLICY "Anyone can view budget PDFs"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'budgets');

CREATE POLICY "Authenticated users can upload budget PDFs"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'budgets');

CREATE POLICY "Anyone can view logos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'logos');

CREATE POLICY "Authenticated users can upload logos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'logos');

-- ============================================
-- VIEWS FOR DASHBOARD
-- ============================================

-- Client Summary View
CREATE OR REPLACE VIEW client_summary AS
SELECT
    c.id,
    c.name,
    c.status,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(o.total), 0) as total_spent,
    COUNT(DISTINCT CASE WHEN o.status = 'concluido' THEN o.id END) as completed_orders,
    MAX(o.created_at) as last_order_date
FROM clients c
LEFT JOIN orders o ON o.client_id = c.id
GROUP BY c.id, c.name, c.status;

-- Budget Summary View
CREATE OR REPLACE VIEW budget_summary AS
SELECT
    b.id,
    b.budget_number,
    b.status,
    b.total,
    b.valid_until,
    c.name as client_name,
    COUNT(bi.id) as item_count,
    b.created_at
FROM budgets b
LEFT JOIN clients c ON c.id = b.client_id
LEFT JOIN budget_items bi ON bi.budget_id = b.id
GROUP BY b.id, b.budget_number, b.status, b.total, b.valid_until, c.name, b.created_at;

-- Order Summary View
CREATE OR REPLACE VIEW order_summary AS
SELECT
    o.id,
    o.order_number,
    o.status,
    o.priority,
    o.total,
    o.deadline,
    c.name as client_name,
    o.responsible,
    o.created_at
FROM orders o
LEFT JOIN clients c ON c.id = o.client_id;

-- Pending Payments View
CREATE OR REPLACE VIEW pending_payments AS
SELECT
    p.id,
    p.client_id,
    p.order_id,
    p.amount,
    p.due_date,
    p.status,
    c.name as client_name,
    o.order_number
FROM payments p
LEFT JOIN clients c ON c.id = p.client_id
LEFT JOIN orders o ON o.id = p.order_id
WHERE p.status IN ('pendente', 'parcial', 'atrasado')
ORDER BY p.due_date;

-- ============================================
-- SAMPLE DATA (OPTIONAL - REMOVE IN PRODUCTION)
-- ============================================

-- Insert sample products
INSERT INTO products (name, description, category, unit_price, unit, materials, finishes, is_active, is_featured) VALUES
('Banner', 'Banner impresso em alta qualidade', 'Banner', 150.00, 'und', ARRAY['Lona', 'Vinil'], ARRAY['Fosco', 'Brilhante'], true, true),
('Adesivo', 'Adesivo recortado ou personalizado', 'Adesivo', 5.00, 'und', ARRAY['Vinil', 'Branco'], ARRAY['Fosco', 'Brilhante'], true, true),
('Fachada', 'Fachada completa para loja', 'Fachada', 2500.00, 'm²', ARRAY['Lona', 'ACM'], ARRAY['Fosco', 'Brilhante'], true, false),
('Camiseta', 'Camiseta personalizada', 'Vestuário', 45.00, 'und', ARRAY['Algodão', 'Poliéster'], ARRAY['Sublimação', 'Serigrafia'], true, false),
('Cartão de Visita', 'Cartão de visita frente e verso', 'Papelaria', 0.50, 'und', ARRAY['Couchê 300g', 'Reciclado'], ARRAY['Fosco', 'Brilhante', 'Verniz'], true, true),
('Flyer', 'Flyer/A6 impresso', 'Papelaria', 0.80, 'und', ARRAY['Couchê 150g', 'Reciclado'], ARRAY['Fosco', 'Brilhante'], true, false),
('Placa', 'Placa informativa', 'Placa', 80.00, 'und', ARRAY['PVC', 'Acrílico', 'Alumínio'], ARRAY['Fosco', 'Brilhante'], true, false),
('Quadro', 'Quadro decorativo', 'Decoração', 120.00, 'und', ARRAY['Canvas', 'MDF'], ARRAY['Fosco'], true, false);

-- Insert default settings
INSERT INTO settings (id, company_name, budget_validity_days, budget_prefix, order_prefix)
VALUES (uuid_generate_v4(), 'PROART', 30, 'ORC', 'PED');
