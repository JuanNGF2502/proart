# Proart App

Sistema de gestão PWA premium para gráfica e comunicação visual.

## Stack

- **Frontend**: Next.js 15, TypeScript, TailwindCSS
- **UI**: Shadcn/UI, Framer Motion, Lucide Icons
- **State**: Zustand, TanStack Query
- **Forms**: React Hook Form, Zod
- **Database**: PostgreSQL, Prisma ORM
- **PWA**: next-pwa, Service Worker

## Funcionalidades

- Dashboard com métricas em tempo real
- Sistema de orçamentos completo
- Gestão de clientes
- Quadro Kanban para produção
- Painel de produção
- Sistema de notificações
- Geração de PDFs premium
- Tema escuro/claro
- PWA instalável

## Getting Started

```bash
# Instalar dependências
npm install

# Configurar banco de dados
cp .env.example .env
# Editar .env com suas credenciais

# Gerar Prisma Client
npx prisma generate

# Aplicar migrations
npx prisma db push

# Iniciar desenvolvimento
npm run dev
```

## Estrutura do Projeto

```
src/
├── app/
│   ├── (auth)/           # Rotas de autenticação
│   ├── (dashboard)/      # Rotas do dashboard
│   └── api/              # API Routes
├── shared/
│   ├── components/        # Componentes compartilhados
│   ├── hooks/            # Hooks customizados
│   ├── lib/              # Utilitários
│   ├── services/         # Serviços
│   ├── store/            # Zustand stores
│   ├── types/            # Tipos TypeScript
│   └── validators/        # Schemas Zod
└── modules/              # Módulos da aplicação
```

## Variáveis de Ambiente

```env
DATABASE_URL="postgresql://user:password@localhost:5432/proart"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## Scripts

- `npm run dev` - Desenvolvimento
- `npm run build` - Build de produção
- `npm run start` - Servidor de produção
- `npm run lint` - Linting
- `npx prisma studio` - Studio do banco

## Design System

O projeto utiliza um design system premium com:

- Paleta dourada para elementos destacados
- Tema escuro como padrão
- Animações suaves com Framer Motion
- Componentes tipados com Radix UI
- Tipografia com Inter e Cal Sans

## Deploy

O sistema pode ser deployado em qualquer plataforma que suporte Next.js:

- Vercel (recomendado)
- Railway
- AWS Amplify
- Docker

Para Docker:

```bash
docker build -t proart-app .
docker run -p 3000:3000 proart-app
```
