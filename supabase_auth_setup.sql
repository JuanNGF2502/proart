-- =====================================================
-- SUPABASE AUTH - CONFIGURAÇÃO DO BANCO
-- Execute este SQL no SQL Editor do Supabase
-- =====================================================

-- 1. A tabela 'users' já deve existir no seu schema
-- Se não existir, criar:

CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text,
  email text UNIQUE,
  avatar_url text,
  role text DEFAULT 'user'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- 2. Habilitar RLS na tabela users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas de acesso à tabela users

-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- 4. Criar trigger para criar usuário automaticamente ao fazer login via Supabase Auth
-- Este trigger cria um registro na tabela users quando um novo usuário se autentica

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para o evento de criação de usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Permissões para o Supabase Auth
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;

-- 6. Verificar se o tipo user_role existe (para uso futuro com roles)
DO $$
BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'user', 'production', 'attendance', 'finance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;