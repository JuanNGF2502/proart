-- ============================================
-- PROART - SAFE MIGRATION (only creates what doesn't exist)
-- ============================================

-- Create ENUM types only if they don't exist
DO $$ BEGIN
    CREATE TYPE client_status AS ENUM ('ativo', 'recorrente', 'inadimplente', 'vip');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE budget_status AS ENUM ('pendente', 'aprovado', 'recusado', 'expirado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('aguardando', 'arte', 'impressao', 'producao', 'acabamento', 'concluido', 'cancelado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pendente', 'parcial', 'pago', 'atrasado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE contact_preference AS ENUM ('whatsapp', 'telefone', 'email');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE file_type AS ENUM ('image', 'pdf', 'document', 'archive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Auto create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- STORAGE BUCKETS (only if not exist)
-- ============================================

-- Insert storage buckets (ignore if exists)
INSERT INTO storage.buckets (id, name, public) VALUES ('clients', 'clients', true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('budgets', 'budgets', true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VIEWS (recreate to ensure they exist)
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
-- SAMPLE DATA (only if tables are empty)
-- ============================================

-- Insert sample products if none exist
INSERT INTO products (name, description, category, unit_price, unit, materials, finishes, is_active, is_featured)
SELECT 'Banner', 'Banner impresso em alta qualidade', 'Banner', 150.00, 'und', ARRAY['Lona', 'Vinil'], ARRAY['Fosco', 'Brilhante'], true, true
WHERE NOT EXISTS (SELECT 1 FROM products);

INSERT INTO products (name, description, category, unit_price, unit, materials, finishes, is_active, is_featured)
SELECT 'Adesivo', 'Adesivo recortado ou personalizado', 'Adesivo', 5.00, 'und', ARRAY['Vinil', 'Branco'], ARRAY['Fosco', 'Brilhante'], true, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Adesivo');

-- Insert default settings if none exist
INSERT INTO settings (id, company_name, budget_validity_days, budget_prefix, order_prefix)
SELECT uuid_generate_v4(), 'PROART', 30, 'ORC', 'PED'
WHERE NOT EXISTS (SELECT 1 FROM settings);

SELECT 'Migration completed successfully!' as result;