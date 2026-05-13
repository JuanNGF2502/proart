-- =====================================================
-- CORREÇÃO CRÍTICA: Adicionar status 'aprovado' ao enum budget_status
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- 1. Adicionar 'aprovado' ao tipo budget_status (CRÍTICO!)
DO $$
BEGIN
    -- Tenta adicionar se o tipo existir
    ALTER TYPE budget_status ADD VALUE IF NOT EXISTS 'aprovado';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Adicionar 'convertido' também (para quando orçamento vira pedido)
DO $$
BEGIN
    ALTER TYPE budget_status ADD VALUE IF NOT EXISTS 'convertido';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Garantir que a coluna budget_id existe na tabela orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS budget_id uuid;

-- 4. Criar foreign key (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'orders_budget_id_fkey'
        AND table_name = 'orders'
    ) THEN
        ALTER TABLE orders
        ADD CONSTRAINT orders_budget_id_fkey
        FOREIGN KEY (budget_id) REFERENCES budgets(id);
    END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_orders_budget_id ON orders(budget_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);

-- 6. Verificar se funcionou
-- Execute: SELECT enum_range(null::budget_status);