# NGBroker - Setup Guide

Este guia descreve como configurar o ambiente de desenvolvimento para o projeto NGBroker.

## Pré-requisitos

- Node.js (v18+)
- pnpm
- Conta no Supabase

## 1. Configuração do Supabase

1. Crie um novo projeto no [Supabase](https://supabase.com).
2. Vá para o **SQL Editor** no painel do Supabase.
3. Copie o conteúdo do arquivo `supabase/schema.sql` (localizado na raiz deste projeto) e execute-o. Isso criará as tabelas `profiles` e `clients` e configurará as políticas de segurança (RLS).
4. Vá para **Project Settings** > **API**.
5. Copie a `Project URL` e a `anon public` key.

## 2. Configuração Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto (se não existir) e adicione as chaves copiadas:

```bash
NEXT_PUBLIC_SUPABASE_URL=Sua_URL_do_Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=Sua_Chave_Anon_Publica
```

## 3. Instalação e Execução

1. Instale as dependências:
   ```bash
   pnpm install
   ```

2. Rode o servidor de desenvolvimento:
   ```bash
   pnpm dev
   ```

3. Acesse `http://localhost:3000`.

## 4. Testando

1. Ao acessar, você será redirecionado para `/login`.
2. Crie uma conta clicando em "Criar conta".
3. Após o login, você verá o Dashboard.
4. Navegue para "Clientes" no menu lateral para testar o CRUD.

## Arquivos Criados/Modificados Recentemente

### Core & Estrutura
- `src/lib/supabase/client.ts`: Cliente Supabase (Browser)
- `src/lib/supabase/server.ts`: Cliente Supabase (Server via cookies)
- `middleware.ts`: Proteção de rotas e refresh de sessão
- `src/components/ui/*`: Componentes base (PageHeader, EmptyState, Modal, etc.)
- `src/components/layout/*`: Sidebar e Topbar

### Auth
- `src/app/(auth)/login/page.tsx`: Tela de Login/Cadastro
- `src/app/(auth)/login/actions.ts`: Server Actions de Auth

### Features
- `src/app/(app)/dashboard/page.tsx`: Dashboard inicial
- `src/app/(app)/clients/page.tsx`: Lista de Clientes
- `src/app/(app)/clients/[id]/page.tsx`: Detalhes do Cliente
- `src/app/(app)/clients/actions.ts`: Server Actions de Clientes
- `src/components/clients/*`: Componentes específicos de clientes (Modal, Badge)
